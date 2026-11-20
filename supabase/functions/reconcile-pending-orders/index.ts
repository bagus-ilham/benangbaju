// @ts-nocheck
// ============================================================================
// Edge Function: reconcile-pending-orders
// Scheduled safety net (every 5 minutes via pg_cron + pg_net)
//
// Core invariant:
//   NEVER blindly cancel an order that has a DOKU payment session.
//   Always verify against DOKU Check Status API first:
//     - DOKU SUCCESS (amount matches) -> mark order `processing`, payment `success`,
//       notify customer, and generate invoice.
//     - DOKU FAILED / EXPIRED / ORDER_EXPIRED -> safely cancel_order().
//     - DOKU PENDING / 404 (not paid yet) -> ONLY cancel if order age > 90 minutes.
//     - DOKU network / 5xx / timeout -> SKIP (fail-safe; retry next cycle).
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  constantTimeCompare,
  extractDokuPaidAt,
  generateDokuSignature,
  getDokuApiUrl,
  getDokuTimestamp,
} from "../_shared/doku-signature.ts";

declare const Deno: any;

const EXPIRY_MINUTES = 90;
const MIN_AGE_MINUTES = 2;
const BATCH_LIMIT = 25;

async function isAuthorizedRequest(req: Request, supabase: any): Promise<boolean> {
  // 1. Check dedicated cron secret header (used by pg_cron + pg_net)
  const expectedCronSecret = (Deno.env.get("RECONCILE_CRON_SECRET") ?? "").trim();
  const incomingCronSecret = (req.headers.get("x-cron-secret") ?? "").trim();
  if (expectedCronSecret && incomingCronSecret) {
    if (await constantTimeCompare(expectedCronSecret, incomingCronSecret)) {
      return true;
    }
  }

  // 2. Fallback: allow service_role Bearer token or authenticated Admin user JWT
  const authHeader = (req.headers.get("Authorization") ?? "").trim();
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (!token) return false;

  const serviceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (serviceRoleKey && (await constantTimeCompare(serviceRoleKey, token))) {
    return true;
  }

  const { data: userData } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role?.toLowerCase();
  return profile?.is_active !== false && (role === "admin" || role === "staff");
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const clientId = (Deno.env.get("DOKU_CLIENT_ID") ?? "").trim();
    const secretKey = (Deno.env.get("DOKU_SECRET_KEY") ?? "").trim();

    if (!supabaseUrl || !supabaseServiceKey || !clientId || !secretKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing server configuration" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!(await isAuthorizedRequest(req, supabase))) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const dokuEndpoint = getDokuApiUrl();
    const minAgeIso = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000).toISOString();

    // Fetch pending_payment orders older than MIN_AGE_MINUTES
    const { data: pendingOrders, error: fetchError } = await supabase
      .from("orders")
      .select(
        "id, order_number, user_id, status, total_amount, created_at, order_shipping(country_code), payments(id, status, gateway_response, paid_at)"
      )
      .eq("status", "pending_payment")
      .lt("created_at", minAgeIso)
      .order("created_at", { ascending: true })
      .limit(BATCH_LIMIT);

    if (fetchError) {
      throw fetchError;
    }

    const summary = {
      checked: 0,
      marked_paid: 0,
      cancelled_expired: 0,
      cancelled_failed: 0,
      still_pending: 0,
      skipped_errors: 0,
      details: [] as Array<{ order_number: string; action: string; doku_status?: string }>,
    };

    for (const order of pendingOrders || []) {
      summary.checked += 1;
      const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
      const orderAgeMs = Date.now() - new Date(order.created_at).getTime();
      const isPastExpiry = orderAgeMs > EXPIRY_MINUTES * 60 * 1000;

      // Case 1: Customer never opened payment gateway (no DOKU session recorded)
      if (!payment?.gateway_response) {
        if (isPastExpiry) {
          await supabase.rpc("cancel_order", {
            p_order_id: order.id,
            p_cancel_reason:
              "Otomatis dibatalkan - melewati batas waktu pembayaran (90 menit, tanpa sesi pembayaran)",
          });
          summary.cancelled_expired += 1;
          summary.details.push({
            order_number: order.order_number,
            action: "cancelled_no_session",
          });
        } else {
          summary.still_pending += 1;
        }
        continue;
      }

      // Case 2: Order HAS a DOKU session — ALWAYS query DOKU Check Status API first!
      const requestTarget = `/orders/v1/status/${order.order_number}`;
      const requestId = crypto.randomUUID();
      const requestTimestamp = getDokuTimestamp();

      let dokuRes: Response;
      let dokuData: any = {};
      try {
        const signature = await generateDokuSignature(
          clientId,
          secretKey,
          requestId,
          requestTimestamp,
          requestTarget,
          null
        );

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          dokuRes = await fetch(`${dokuEndpoint}${requestTarget}`, {
            method: "GET",
            headers: {
              "Client-Id": clientId,
              "Request-Id": requestId,
              "Request-Timestamp": requestTimestamp,
              Signature: signature,
            },
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        dokuData = await dokuRes.json().catch(() => ({}));
      } catch (netErr: any) {
        // FAIL-SAFE: Never cancel when DOKU cannot be reached!
        console.error(`DOKU unreachable for ${order.order_number}:`, netErr?.message || netErr);
        summary.skipped_errors += 1;
        summary.details.push({ order_number: order.order_number, action: "skipped_network_error" });
        continue;
      }

      // FAIL-SAFE on 5xx / 429 / 401 — never cancel on transient gateway/auth errors
      if (!dokuRes.ok && dokuRes.status !== 404) {
        console.error(`DOKU returned HTTP ${dokuRes.status} for ${order.order_number}`);
        summary.skipped_errors += 1;
        summary.details.push({
          order_number: order.order_number,
          action: `skipped_http_${dokuRes.status}`,
        });
        continue;
      }

      const transactionStatus =
        dokuRes.status === 404
          ? "NOT_FOUND"
          : (dokuData?.transaction?.status || "UNKNOWN").toUpperCase();
      const dokuOrderStatus = (dokuData?.order?.status || "UNKNOWN").toUpperCase();

      const mergedGatewayResponse = payment.gateway_response
        ? { ...payment.gateway_response, reconcile_check: dokuData }
        : { reconcile_check: dokuData };

      if (transactionStatus === "SUCCESS") {
        // Verify paid amount matches order total
        const dokuAmount = dokuData?.order?.amount != null ? Number(dokuData.order.amount) : null;
        if (
          dokuAmount !== null &&
          !isNaN(dokuAmount) &&
          Math.abs(dokuAmount - Number(order.total_amount)) > 1
        ) {
          console.error(
            `RECONCILE AMOUNT MISMATCH for ${order.order_number}: expected ${order.total_amount}, got ${dokuAmount}`
          );
          summary.skipped_errors += 1;
          summary.details.push({
            order_number: order.order_number,
            action: "skipped_amount_mismatch",
            doku_status: transactionStatus,
          });
          continue;
        }

        const paidAt = extractDokuPaidAt(dokuData);

        await supabase
          .from("payments")
          .update({
            status: "success",
            paid_at: payment.paid_at || paidAt,
            gateway_response: mergedGatewayResponse,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        // Atomic guard: only update if still pending_payment
        const { data: updatedOrder } = await supabase
          .from("orders")
          .update({ status: "processing", updated_at: new Date().toISOString() })
          .eq("id", order.id)
          .eq("status", "pending_payment")
          .select("id")
          .maybeSingle();

        if (updatedOrder) {
          const rawShipping = order.order_shipping;
          const shipping = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping;
          const isMalaysia = shipping?.country_code === "MY";

          await supabase.from("notifications").insert({
            user_id: order.user_id,
            type: "payment_success",
            title: isMalaysia ? "Payment Successful!" : "Pembayaran Berhasil!",
            message: isMalaysia
              ? `Payment for order #${order.order_number} has been verified. Your order is now being prepared for international dispatch.`
              : `Pembayaran untuk pesanan ${order.order_number} berhasil diverifikasi. Pesanan Anda sedang diproses.`,
            data: {
              order_id: order.id,
              order_number: order.order_number,
              country_code: shipping?.country_code || "ID",
            },
          });

          try {
            await supabase.functions.invoke("generate-invoice", {
              body: { order_number: order.order_number },
            });
          } catch (invErr) {
            console.error(`Invoice generation error for ${order.order_number}:`, invErr);
          }
        }

        await supabase.from("payment_logs").insert({
          gateway_order_id: order.order_number,
          event_type: "RECONCILE_SUCCESS",
          raw_payload: dokuData,
          payment_id: payment.id,
        });

        summary.marked_paid += 1;
        summary.details.push({
          order_number: order.order_number,
          action: "marked_paid",
          doku_status: transactionStatus,
        });
      } else if (
        transactionStatus === "FAILED" ||
        transactionStatus === "EXPIRED" ||
        dokuOrderStatus === "ORDER_EXPIRED"
      ) {
        const isFailed = transactionStatus === "FAILED";
        await supabase
          .from("payments")
          .update({
            status: isFailed ? "failed" : "expired",
            gateway_response: mergedGatewayResponse,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        await supabase.rpc("cancel_order", {
          p_order_id: order.id,
          p_cancel_reason: isFailed
            ? "Otomatis dibatalkan - pembayaran gagal di DOKU"
            : "Otomatis dibatalkan - sesi pembayaran kedaluwarsa di DOKU",
        });

        await supabase.from("payment_logs").insert({
          gateway_order_id: order.order_number,
          event_type: isFailed ? "RECONCILE_FAILED" : "RECONCILE_EXPIRED",
          raw_payload: dokuData,
          payment_id: payment.id,
        });

        if (isFailed) summary.cancelled_failed += 1;
        else summary.cancelled_expired += 1;

        summary.details.push({
          order_number: order.order_number,
          action: isFailed ? "cancelled_failed" : "cancelled_expired",
          doku_status: transactionStatus,
        });
      } else if ((transactionStatus === "PENDING" || transactionStatus === "NOT_FOUND") && isPastExpiry) {
        // Only cancel after 90 minutes when DOKU explicitly confirmed order is still PENDING / NOT_FOUND
        await supabase
          .from("payments")
          .update({
            status: "expired",
            gateway_response: mergedGatewayResponse,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        await supabase.rpc("cancel_order", {
          p_order_id: order.id,
          p_cancel_reason:
            "Otomatis dibatalkan - melewati batas waktu pembayaran (90 menit, terkonfirmasi belum dibayar di DOKU)",
        });

        await supabase.from("payment_logs").insert({
          gateway_order_id: order.order_number,
          event_type: "RECONCILE_TIMEOUT_EXPIRED",
          raw_payload: dokuData,
          payment_id: payment.id,
        });

        summary.cancelled_expired += 1;
        summary.details.push({
          order_number: order.order_number,
          action: "cancelled_timeout",
          doku_status: transactionStatus,
        });
      } else {
        summary.still_pending += 1;
        summary.details.push({
          order_number: order.order_number,
          action: "still_pending",
          doku_status: transactionStatus,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, data: summary }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("reconcile-pending-orders error:", err?.message || err);
    return new Response(
      JSON.stringify({ success: false, message: err?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
