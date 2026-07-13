// =============================================================
// Edge Function: midtrans-webhook
// Handles Midtrans payment notification callbacks
// =============================================================

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import { encode as hexEncode } from "https://deno.land/std@0.208.0/encoding/hex.ts";

// Declare Deno to satisfy TypeScript in non-Deno workspace
declare const Deno: any;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    interface MidtransNotificationPayload {
      order_id: string;
      transaction_id: string;
      transaction_status: string;
      fraud_status?: string;
      payment_type: string;
      gross_amount: string | number;
      signature_key: string;
      status_code: string;
    }

    const payload = (await req.json()) as MidtransNotificationPayload;

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
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!serverKey) {
      console.error("Missing MIDTRANS_SERVER_KEY environment variable");
      return new Response(
        JSON.stringify({ success: false, message: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Normalize gross_amount to always have two decimal places (e.g. "150000.00") for signature verification
    let grossAmountStr = String(grossAmount);
    if (typeof grossAmount === "number") {
      grossAmountStr = grossAmount.toFixed(2);
    } else if (grossAmountStr && !grossAmountStr.includes(".")) {
      grossAmountStr = Number(grossAmountStr).toFixed(2);
    }

    const signatureInput = `${midtransOrderId}${statusCode}${grossAmountStr}${serverKey}`;
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

    // ========== IDEMPOTENCY CHECK ==========
    const { data: existingLog, error: logFetchError } = await supabase
      .from("payment_logs")
      .select("id")
      .eq("midtrans_order_id", midtransOrderId)
      .eq("event_type", transactionStatus)
      .maybeSingle();

    if (logFetchError) {
      console.error("Error checking payment logs idempotency:", logFetchError);
      return new Response(
        JSON.stringify({ success: false, message: "Database query error during idempotency check" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (existingLog) {
      console.log("Duplicate webhook, skipping:", midtransOrderId, transactionStatus);
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

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
    const { data: order, error: orderFetchError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, voucher_id, total_amount")
      .eq("order_number", midtransOrderId)
      .single();

    if (orderFetchError || !order) {
      console.error("Order not found or fetch error:", orderFetchError, midtransOrderId);
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

    // Get payment_id
    const { data: payment, error: paymentFetchError } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", order.id)
      .single();

    if (paymentFetchError || !payment) {
      console.error("Payment not found or fetch error:", paymentFetchError, order.id);
      return new Response(
        JSON.stringify({ success: false, message: "Payment record not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update(paymentUpdate)
      .eq("id", payment.id);

    if (paymentUpdateError) {
      console.error("Error updating payment:", paymentUpdateError);
      return new Response(
        JSON.stringify({ success: false, message: "Payment update failure" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========== UPDATE ORDER STATUS ==========
    if (orderStatus && (order.status === "pending_payment" || order.status === "paid")) {
      if (orderStatus === "processing") {
        // Payment success → update order
        console.log(`Updating order ${order.order_number} status from ${order.status} to processing`);
        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({ status: "processing" })
          .eq("id", order.id);

        if (orderUpdateError) {
          console.error("Error updating order status to processing:", orderUpdateError);
          return new Response(
            JSON.stringify({ success: false, message: "Order status update failure" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // Create notification for customer
        const { error: notifError } = await supabase.from("notifications").insert({
          user_id: order.user_id,
          type: "payment_success",
          title: "Pembayaran Berhasil!",
          message: `Pembayaran untuk pesanan ${order.order_number} berhasil. Pesanan sedang diproses.`,
          data: { order_id: order.id, order_number: order.order_number },
        });

        if (notifError) {
          console.error("Error inserting success notification:", notifError);
        }

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
          const { data: userData, error: authGetError } = await supabase.auth.admin.getUserById(order.user_id);
          if (authGetError) {
            console.error("Error fetching user email from auth:", authGetError);
          }
          const userEmail = userData?.user?.email;

          const { data: profileData, error: profileGetError } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", order.user_id)
            .single();
          if (profileGetError) {
            console.error("Error fetching profile name:", profileGetError);
          }
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
        const { error: cancelError } = await supabase.rpc("cancel_order", {
          p_order_id: order.id,
          p_cancel_reason:
            transactionStatus === "expire"
              ? "Pembayaran melewati batas waktu"
              : "Pembayaran ditolak",
        });

        if (cancelError) {
          console.error("Error calling cancel_order RPC:", cancelError);
          return new Response(
            JSON.stringify({ success: false, message: "RPC cancel_order failure" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // Create notification for customer
        const { error: notifError } = await supabase.from("notifications").insert({
          user_id: order.user_id,
          type: "payment_failed",
          title: "Pembayaran Gagal",
          message: `Pembayaran untuk pesanan ${order.order_number} ${
            transactionStatus === "expire" ? "sudah kadaluarsa" : "gagal"
          }. Silakan buat pesanan baru.`,
          data: { order_id: order.id, order_number: order.order_number },
        });

        if (notifError) {
          console.error("Error inserting failure notification:", notifError);
        }

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

    // ========== LOG WEBHOOK ==========
    // Log is inserted AFTER all processing is completed.
    // If anything fails above, this won't be reached, leaving the idempotency check open for retry.
    const { error: logInsertError } = await supabase.from("payment_logs").insert({
      midtrans_order_id: midtransOrderId,
      event_type: transactionStatus,
      raw_payload: payload,
      payment_id: payment.id,
    });

    if (logInsertError) {
      console.error("Error inserting payment log:", logInsertError);
      // We don't return 500 here because the operation actually succeeded.
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
