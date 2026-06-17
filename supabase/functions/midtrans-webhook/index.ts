// @ts-nocheck
// =============================================================
// Edge Function: midtrans-webhook
// Handles Midtrans payment notification callbacks
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.208.0/encoding/hex.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();

    const {
      order_id: midtransOrderId,
      transaction_id: transactionId,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      payment_type: paymentType,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      status_code: statusCode,
    } = payload;

    // ========== VALIDATE SIGNATURE ==========
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY")!;
    const signatureInput = `${midtransOrderId}${statusCode}${grossAmount}${serverKey}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureInput);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const expectedSignature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signatureKey !== expectedSignature) {
      console.error("Invalid signature for order:", midtransOrderId);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Init Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ========== IDEMPOTENCY CHECK ==========
    const { data: existingLog } = await supabase
      .from("payment_logs")
      .select("id")
      .eq("midtrans_order_id", midtransOrderId)
      .eq("event_type", transactionStatus)
      .maybeSingle();

    if (existingLog) {
      console.log("Duplicate webhook, skipping:", midtransOrderId, transactionStatus);
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========== LOG WEBHOOK ==========
    await supabase.from("payment_logs").insert({
      midtrans_order_id: midtransOrderId,
      event_type: transactionStatus,
      raw_payload: payload,
    });

    // ========== MAP STATUS ==========
    let orderStatus: string | null = null;
    let paymentStatus: string | null = null;

    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        orderStatus = "processing";
        paymentStatus = "success";
      }
      // challenge → stay pending
    } else if (transactionStatus === "settlement") {
      orderStatus = "processing";
      paymentStatus = "success";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      orderStatus = "cancelled";
      paymentStatus = transactionStatus === "expire" ? "expired" : "failed";
    } else if (transactionStatus === "pending") {
      paymentStatus = "pending";
    }

    // ========== GET ORDER ==========
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, voucher_id, total_amount")
      .eq("order_number", midtransOrderId)
      .single();

    if (!order) {
      console.error("Order not found:", midtransOrderId);
      return new Response(
        JSON.stringify({ success: false, message: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========== UPDATE PAYMENT ==========
    const paymentUpdate: Record<string, unknown> = {
      midtrans_transaction_id: transactionId,
      payment_type: paymentType,
      midtrans_response: payload,
    };

    if (paymentStatus) {
      paymentUpdate.status = paymentStatus;
    }
    if (paymentStatus === "success") {
      paymentUpdate.paid_at = new Date().toISOString();
    }
    if (paymentStatus === "expired") {
      paymentUpdate.expired_at = new Date().toISOString();
    }

    // Update payment_logs with payment_id
    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", order.id)
      .single();

    if (payment) {
      await supabase
        .from("payments")
        .update(paymentUpdate)
        .eq("id", payment.id);

      // Link log to payment
      await supabase
        .from("payment_logs")
        .update({ payment_id: payment.id })
        .eq("midtrans_order_id", midtransOrderId)
        .eq("event_type", transactionStatus);
    }

    // ========== UPDATE ORDER STATUS ==========
    if (orderStatus && order.status === "pending_payment") {
      if (orderStatus === "processing") {
        // Payment success → update order
        await supabase
          .from("orders")
          .update({ status: "processing" })
          .eq("id", order.id);

        // Create notification for customer
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          type: "payment_success",
          title: "Pembayaran Berhasil!",
          message: `Pembayaran untuk pesanan ${order.order_number} berhasil. Pesanan sedang diproses.`,
          data: { order_id: order.id, order_number: order.order_number },
        });

        // Trigger generate-invoice Edge Function
        try {
          const { error: invoiceErr } = await supabase.functions.invoke("generate-invoice", {
            body: { order_number: order.order_number },
          });
          if (invoiceErr) {
            console.error("Error triggering generate-invoice:", invoiceErr);
          }
        } catch (err) {
          console.error("Error invoking generate-invoice:", err);
        }

        // Trigger send-email Edge Function (payment success notification)
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
          const userEmail = userData?.user?.email;

          const { data: profileData } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", order.user_id)
            .single();
          const customerName = profileData?.name || "Pelanggan";

          if (userEmail) {
            const { error: emailErr } = await supabase.functions.invoke("send-email", {
              body: {
                to: userEmail,
                template: "payment_success",
                data: {
                  customer_name: customerName,
                  order_number: order.order_number,
                  total_amount: Number(order.total_amount).toLocaleString("id-ID"),
                },
              },
            });
            if (emailErr) {
              console.error("Error triggering send-email:", emailErr);
            }
          }
        } catch (err) {
          console.error("Error sending payment success email:", err);
        }

      } else if (orderStatus === "cancelled") {
        // Payment failed/expired → cancel order and restore stock
        await supabase.rpc("cancel_order", {
          p_order_id: order.id,
          p_cancel_reason:
            transactionStatus === "expire"
              ? "Pembayaran melewati batas waktu"
              : "Pembayaran ditolak",
        });

        // Create notification for customer
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          type: "payment_failed",
          title: "Pembayaran Gagal",
          message: `Pembayaran untuk pesanan ${order.order_number} ${
            transactionStatus === "expire" ? "sudah kadaluarsa" : "gagal"
          }. Silakan buat pesanan baru.`,
          data: { order_id: order.id, order_number: order.order_number },
        });

        // Trigger send-email Edge Function (order_cancelled)
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
          const userEmail = userData?.user?.email;

          const { data: profileData } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", order.user_id)
            .single();
          const customerName = profileData?.name || "Pelanggan";

          if (userEmail) {
            const cancelReason = transactionStatus === "expire"
              ? "Pembayaran melewati batas waktu"
              : "Pembayaran ditolak";

            const { error: emailErr } = await supabase.functions.invoke("send-email", {
              body: {
                to: userEmail,
                template: "order_cancelled",
                data: {
                  customer_name: customerName,
                  order_number: order.order_number,
                  cancel_reason: cancelReason,
                },
              },
            });
            if (emailErr) {
              console.error("Error triggering send-email:", emailErr);
            }
          }
        } catch (err) {
          console.error("Error sending order cancelled email:", err);
        }
      }
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        function: "midtrans-webhook",
        event: transactionStatus,
        order_id: midtransOrderId,
        amount: grossAmount,
        mapped_order_status: orderStatus,
      })
    );

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("midtrans-webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
