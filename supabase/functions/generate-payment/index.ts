// @ts-nocheck
// =============================================================
// Edge Function: generate-payment
// Generates Midtrans Snap token for an order
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

    // Get order + user data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles!inner(name, phone),
        order_items(*),
        payments(id, status, snap_token, midtrans_response)
      `)
      .eq("order_number", order_number)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, message: "Pesanan tidak ditemukan", code: "ORDER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate order status
    if (order.status !== "pending_payment") {
      return new Response(
        JSON.stringify({ success: false, message: "Pesanan tidak dalam status menunggu pembayaran", code: "ORDER_WRONG_STATUS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth user from request and validate JWT
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

    // Check order ownership
    if (order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, message: "Akses ditolak: Anda bukan pemilik pesanan ini" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there is an existing pending snap token to reuse
    let payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
    
    // If no payment record exists, dynamically create one (self-healing)
    if (!payment) {
      console.log(`Creating missing payment record for order ${order.order_number}`);
      const { data: newPayment, error: insertPayError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          midtrans_order_id: order.order_number,
          status: "pending",
          amount: order.total_amount,
        })
        .select("id, status, snap_token, midtrans_response")
        .single();

      if (insertPayError || !newPayment) {
        console.error("Failed to create missing payment record:", insertPayError);
        return new Response(
          JSON.stringify({ success: false, message: "Gagal membuat data pembayaran", code: "PAYMENT_CREATE_ERROR" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      payment = newPayment;
    }

    if (payment.snap_token && payment.status === "pending") {
      let redirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${payment.snap_token}`;
      if (payment.midtrans_response) {
        try {
          const responseObj = typeof payment.midtrans_response === "string"
            ? JSON.parse(payment.midtrans_response)
            : payment.midtrans_response;
          if (responseObj && responseObj.redirect_url) {
            redirectUrl = responseObj.redirect_url;
          }
        } catch (e) {
          console.error("Error parsing midtrans_response:", e);
        }
      }

      console.log(`Reusing existing Snap token for order ${order.order_number}`);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            token: payment.snap_token,
            redirect_url: redirectUrl,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Midtrans Snap parameters
    const midtransMode = Deno.env.get("MIDTRANS_MODE") || "sandbox";
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY")!;
    const snapApiUrl = Deno.env.get("MIDTRANS_SNAP_API_URL")!;

    // Calculate rounded item details to avoid any mismatch with Midtrans
    const itemDetails = order.order_items.map((item: Record<string, unknown>) => ({
      id: item.sku,
      price: Math.round(Number(item.price)),
      quantity: Number(item.quantity),
      name: `${item.product_name} - ${item.variant_name}`.substring(0, 50),
    }));

    // Add shipping as item if > 0
    if (Number(order.shipping_cost) > 0) {
      itemDetails.push({
        id: "SHIPPING",
        price: Math.round(Number(order.shipping_cost)),
        quantity: 1,
        name: "Ongkos Kirim",
      });
    }

    // Add discount as negative item if > 0
    if (Number(order.discount_amount) > 0) {
      itemDetails.push({
        id: "DISCOUNT",
        price: -Math.round(Number(order.discount_amount)),
        quantity: 1,
        name: "Diskon Voucher",
      });
    }

    // Calculate total gross amount as the sum of all items in item_details to prevent rounding errors
    const calculatedGrossAmount = itemDetails.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const transactionDetails = {
      transaction_details: {
        order_id: order.order_number,
        gross_amount: calculatedGrossAmount,
      },
      customer_details: {
        first_name: order.profiles.name,
        phone: order.profiles.phone || "",
      },
      item_details: itemDetails,
      callbacks: {
        finish: `${Deno.env.get("APP_URL") || "http://localhost:3000"}/pesanan/${order.order_number}`,
      },
    };

    console.log("Sending transactionDetails to Midtrans Snap:", JSON.stringify(transactionDetails));

    // Call Midtrans Snap API
    const auth = btoa(`${serverKey}:`);
    const midtransResponse = await fetch(snapApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(transactionDetails),
    });

    const midtransData = await midtransResponse.json();

    if (!midtransResponse.ok) {
      console.error("Midtrans error:", JSON.stringify(midtransData));
      return new Response(
        JSON.stringify({ success: false, message: "Gagal membuat transaksi pembayaran", code: "PAYMENT_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save token to payments table
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        snap_token: midtransData.token,
        midtrans_response: midtransData,
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      console.error("Error saving snap_token to database:", updatePaymentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token: midtransData.token,
          redirect_url: midtransData.redirect_url,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-payment error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
