// @ts-nocheck
// =============================================================
// Edge Function: check-payment-status
// Actively checks payment status with Midtrans API and updates
// the database accordingly. This is a fallback for when webhooks
// fail or are delayed.
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_number } = await req.json();

    if (!order_number) {
      return new Response(
        JSON.stringify({ success: false, message: "Order number diperlukan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Init Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, total_amount")
      .eq("order_number", order_number)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, message: "Pesanan tidak ditemukan" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify ownership
    if (order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, message: "Akses ditolak" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already processed, just return current status
    if (order.status !== "pending_payment") {
      return new Response(
        JSON.stringify({
          success: true,
          data: { order_status: order.status, payment_status: "already_processed" },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== QUERY MIDTRANS API ==========
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!serverKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const midtransMode = Deno.env.get("MIDTRANS_MODE") || "sandbox";
    const midtransApiBase = midtransMode === "production"
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";

    const auth = btoa(`${serverKey}:`);

    console.log(`Checking payment status with Midtrans for order: ${order_number}`);

    const midtransRes = await fetch(`${midtransApiBase}/${order_number}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
    });

    const midtransData = await midtransRes.json();

    console.log(`Midtrans status response for ${order_number}:`, JSON.stringify(midtransData));

    if (!midtransRes.ok) {
      // Midtrans returned an error — transaction might not exist yet
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            order_status: order.status,
            payment_status: "pending",
            midtrans_status: midtransData.status_code || "unknown",
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== MAP MIDTRANS STATUS ==========
    const transactionStatus = midtransData.transaction_status;
    const fraudStatus = midtransData.fraud_status;

    let newOrderStatus: string | null = null;
    let newPaymentStatus: string | null = null;

    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        newOrderStatus = "processing";
        newPaymentStatus = "success";
      }
    } else if (transactionStatus === "settlement") {
      newOrderStatus = "processing";
      newPaymentStatus = "success";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      newOrderStatus = "cancelled";
      newPaymentStatus = transactionStatus === "expire" ? "expired" : "failed";
    } else if (transactionStatus === "pending") {
      newPaymentStatus = "pending";
    }

    // ========== UPDATE DATABASE ==========
    if (newPaymentStatus && newPaymentStatus !== "pending") {
      // Get payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("id")
        .eq("order_id", order.id)
        .single();

      if (payment) {
        const paymentUpdate: Record<string, unknown> = {
          status: newPaymentStatus,
          midtrans_transaction_id: midtransData.transaction_id,
          payment_type: midtransData.payment_type,
          midtrans_response: midtransData,
        };

        if (newPaymentStatus === "success") {
          paymentUpdate.paid_at = new Date().toISOString();
        }
        if (newPaymentStatus === "expired") {
          paymentUpdate.expired_at = new Date().toISOString();
        }

        const { error: paymentUpdateError } = await supabase
          .from("payments")
          .update(paymentUpdate)
          .eq("id", payment.id);

        if (paymentUpdateError) {
          console.error("Error updating payment:", paymentUpdateError);
        }
      }

      // Update order status
      if (newOrderStatus && (order.status === "pending_payment" || order.status === "paid")) {
        if (newOrderStatus === "processing") {
          const { error: orderUpdateError } = await supabase
            .from("orders")
            .update({ status: "processing" })
            .eq("id", order.id);

          if (orderUpdateError) {
            console.error("Error updating order status:", orderUpdateError);
          } else {
            console.log(`Order ${order_number} status updated to processing via manual check`);

            // Create notification
            await supabase.from("notifications").insert({
              user_id: order.user_id,
              type: "payment_success",
              title: "Pembayaran Berhasil!",
              message: `Pembayaran untuk pesanan ${order.order_number} berhasil. Pesanan sedang diproses.`,
              data: { order_id: order.id, order_number: order.order_number },
            });

            // Trigger invoice generation
            try {
              await supabase.functions.invoke("generate-invoice", {
                body: { order_number: order.order_number },
              });
            } catch (err) {
              console.error("Error triggering generate-invoice:", err);
            }
          }
        } else if (newOrderStatus === "cancelled") {
          const cancelReason = transactionStatus === "expire"
            ? "Pembayaran melewati batas waktu"
            : "Pembayaran ditolak";

          const { error: cancelError } = await supabase.rpc("cancel_order", {
            p_order_id: order.id,
            p_cancel_reason: cancelReason,
          });

          if (cancelError) {
            console.error("Error cancelling order:", cancelError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order_status: newOrderStatus || order.status,
          payment_status: newPaymentStatus || "pending",
          transaction_status: transactionStatus,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-payment-status error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
