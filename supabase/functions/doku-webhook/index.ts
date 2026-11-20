// @ts-nocheck
// =============================================================
// Edge Function: doku-webhook
// Handles DOKU Jokul payment notification callbacks (HTTP POST)
// =============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  constantTimeCompare,
  extractDokuPaidAt,
  generateDokuSignature,
} from "../_shared/doku-signature.ts";

declare const Deno: any;

interface DokuNotificationPayload {
  order: {
    invoice_number: string;
    amount: number | string;
  };
  transaction?: {
    status?: string;
    date?: string;
  };
  qris_payment?: {
    date?: string;
  };
  virtual_account_payment?: {
    date?: string;
  };
  service?: {
    id?: string;
  };
  acquirer?: {
    id?: string;
  };
}

/**
 * Verifies DOKU HMAC SHA-256 Notification Signature.
 * In Supabase Edge Functions runtime, `new URL(req.url).pathname` is `/doku-webhook`
 * whereas DOKU signs against the public path `/functions/v1/doku-webhook`.
 * We verify against all valid candidate paths using constant-time comparison.
 */
async function verifyDokuNotificationSignature(
  req: Request,
  rawBody: string,
  secretKey: string
): Promise<boolean> {
  try {
    const clientId = req.headers.get("Client-Id") || "";
    const requestId = req.headers.get("Request-Id") || "";
    const requestTimestamp = req.headers.get("Request-Timestamp") || "";
    const incomingSignature = req.headers.get("Signature") || "";

    if (!incomingSignature || !clientId || !requestId || !requestTimestamp) {
      return false;
    }

    const urlPathname = new URL(req.url).pathname;
    const candidateTargets = Array.from(
      new Set(
        [
          req.headers.get("Request-Target"),
          "/functions/v1/doku-webhook",
          urlPathname,
        ].filter((t): t is string => Boolean(t && t.trim()))
      )
    );

    for (const target of candidateTargets) {
      const calculatedSignature = await generateDokuSignature(
        clientId,
        secretKey,
        requestId,
        requestTimestamp,
        target,
        rawBody
      );
      if (await constantTimeCompare(calculatedSignature, incomingSignature)) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("Error verifying DOKU signature:", err);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const secretKey = (Deno.env.get("DOKU_SECRET_KEY") ?? "").trim();
    if (!secretKey) {
      console.error("Missing DOKU_SECRET_KEY environment variable");
      return new Response(
        JSON.stringify({ success: false, message: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.text();
    let payload: DokuNotificationPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid JSON payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. SIGNATURE VERIFICATION (Constant-time comparison)
    const isSignatureValid = await verifyDokuNotificationSignature(req, rawBody, secretKey);
    if (!isSignatureValid) {
      console.error("Invalid DOKU HMAC signature");
      return new Response(
        JSON.stringify({ success: false, message: "Invalid signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const invoiceNumber = payload.order?.invoice_number;
    const rawAmount = payload.order?.amount;
    const transactionStatus = (payload.transaction?.status || "UNKNOWN").toUpperCase();

    if (!invoiceNumber || rawAmount === undefined) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing order parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials in Edge Function environment");
      return new Response(
        JSON.stringify({ success: false, message: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. IDEMPOTENCY CHECK via payment_logs table
    const { data: existingLog, error: logFetchError } = await supabase
      .from("payment_logs")
      .select("id")
      .eq("gateway_order_id", invoiceNumber)
      .eq("event_type", transactionStatus)
      .maybeSingle();

    if (logFetchError) {
      console.error("Error checking payment logs idempotency:", logFetchError);
    }

    if (existingLog) {
      console.log(`Duplicate webhook ignored for order: ${invoiceNumber}, status: ${transactionStatus}`);
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. FETCH ORDER FROM DATABASE & AMOUNT CROSS-CHECKING
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, total_amount, order_shipping(country_code)")
      .eq("order_number", invoiceNumber)
      .single();

    if (orderError || !order) {
      console.error("Order not found in database:", invoiceNumber);
      return new Response(
        JSON.stringify({ success: false, message: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // CROSS-CHECK: Compare payload amount with DB amount to prevent parameter tampering
    const webhookAmount = Number(rawAmount);
    const dbAmount = Number(order.total_amount);

    if (Math.abs(webhookAmount - dbAmount) > 1) {
      console.error(`Amount mismatch! DB amount: ${dbAmount}, Webhook amount: ${webhookAmount}`);
      return new Response(
        JSON.stringify({ success: false, message: "Payment amount mismatch" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. PROCESS STATUS UPDATE & IDEMPOTENT DB ACTIONS
    let orderStatus: string | null = null;
    let paymentStatus: string | null = null;

    if (transactionStatus === "SUCCESS") {
      orderStatus = "processing";
      paymentStatus = "success";
    } else if (transactionStatus === "FAILED" || transactionStatus === "EXPIRED") {
      orderStatus = "cancelled";
      paymentStatus = transactionStatus === "EXPIRED" ? "expired" : "failed";
    }

    // Fetch existing payment record to preserve gateway_response metadata
    const { data: payment } = await supabase
      .from("payments")
      .select("id, status, gateway_response, paid_at")
      .eq("order_id", order.id)
      .maybeSingle();

    const mergedGatewayResponse = payment?.gateway_response
      ? { ...payment.gateway_response, webhook: payload }
      : { webhook: payload };

    const paidAt = extractDokuPaidAt(payload);

    // If order is already paid/processing, still preserve webhook payload & log cleanly
    if (["processing", "completed", "shipped"].includes(order.status)) {
      if (payment) {
        await supabase
          .from("payments")
          .update({
            gateway_response: mergedGatewayResponse,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);
      }
      await supabase.from("payment_logs").insert({
        gateway_order_id: invoiceNumber,
        event_type: transactionStatus,
        raw_payload: payload,
        payment_id: payment?.id ?? null,
      });
      return new Response(
        JSON.stringify({ success: true, message: "Order already updated" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // CRITICAL GUARD: Late SUCCESS webhook on an already-cancelled order — NEVER drop silently!
    if (order.status === "cancelled" && transactionStatus === "SUCCESS") {
      console.error(`ALERT: Late DOKU SUCCESS webhook received for cancelled order ${invoiceNumber}`);
      if (payment) {
        await supabase
          .from("payments")
          .update({
            gateway_response: mergedGatewayResponse,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);
      }
      await supabase.from("payment_logs").insert({
        gateway_order_id: invoiceNumber,
        event_type: "LATE_WEBHOOK_SUCCESS_ON_CANCELLED",
        raw_payload: payload,
        payment_id: payment?.id ?? null,
      });
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Payment SUCCESS received for a cancelled order; logged for admin review",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update payment record in database (preserve status if already terminal/paid)
    const shouldPreservePayment =
      order.status === "cancelled" || payment?.status === "success";

    if (payment) {
      const paymentUpdate: Record<string, any> = {
        gateway_response: mergedGatewayResponse,
        updated_at: new Date().toISOString(),
      };
      if (!shouldPreservePayment && paymentStatus) {
        paymentUpdate.status = paymentStatus;
        paymentUpdate.paid_at = paymentStatus === "success" ? payment.paid_at || paidAt : payment.paid_at || null;
      }
      await supabase.from("payments").update(paymentUpdate).eq("id", payment.id);
    }

    // Update Order Status & Send Notifications
    if (orderStatus === "processing" && order.status === "pending_payment") {
      await supabase
        .from("orders")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", order.id);

      const rawShipping = order.order_shipping;
      const shipping = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping;
      const isMalaysia = shipping?.country_code === "MY";

      await supabase.from("notifications").insert({
        user_id: order.user_id,
        type: "payment_success",
        title: isMalaysia ? "Payment Successful!" : "Pembayaran Berhasil!",
        message: isMalaysia
          ? `Payment for order #${order.order_number} has been received. Your order is now being prepared for international dispatch.`
          : `Pembayaran untuk pesanan ${order.order_number} berhasil diterima. Pesanan sedang diproses.`,
        data: {
          order_id: order.id,
          order_number: order.order_number,
          country_code: shipping?.country_code || "ID",
        },
      });

      // Trigger generate-invoice Edge Function
      try {
        await supabase.functions.invoke("generate-invoice", {
          body: { order_number: order.order_number },
        });
      } catch (err) {
        console.error("Error invoking generate-invoice:", err);
      }
    } else if (orderStatus === "cancelled" && order.status === "pending_payment") {
      await supabase.rpc("cancel_order", {
        p_order_id: order.id,
        p_cancel_reason:
          transactionStatus === "EXPIRED" ? "Pembayaran kadaluarsa" : "Pembayaran gagal",
      });
    }

    // Log event to payment_logs for idempotency tracking
    await supabase.from("payment_logs").insert({
      gateway_order_id: invoiceNumber,
      event_type: transactionStatus,
      raw_payload: payload,
      payment_id: payment?.id ?? null,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("doku-webhook error:", error.message || error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
