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
        payments!inner(id, status)
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

    // Get auth user from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Midtrans Snap parameters
    const midtransMode = Deno.env.get("MIDTRANS_MODE") || "sandbox";
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY")!;
    const snapApiUrl = Deno.env.get("MIDTRANS_SNAP_API_URL")!;

    const transactionDetails = {
      transaction_details: {
        order_id: order.order_number,
        gross_amount: Math.round(Number(order.total_amount)),
      },
      customer_details: {
        first_name: order.profiles.name,
        phone: order.profiles.phone || "",
      },
      item_details: order.order_items.map((item: Record<string, unknown>) => ({
        id: item.sku,
        price: Math.round(Number(item.price)),
        quantity: item.quantity,
        name: `${item.product_name} - ${item.variant_name}`.substring(0, 50),
      })),
      callbacks: {
        finish: `${Deno.env.get("APP_URL")}/pesanan/${order.order_number}`,
      },
    };

    // Add shipping as item if > 0
    if (Number(order.shipping_cost) > 0) {
      transactionDetails.item_details.push({
        id: "SHIPPING",
        price: Math.round(Number(order.shipping_cost)),
        quantity: 1,
        name: "Ongkos Kirim",
      });
    }

    // Add discount as negative item if > 0
    if (Number(order.discount_amount) > 0) {
      transactionDetails.item_details.push({
        id: "DISCOUNT",
        price: -Math.round(Number(order.discount_amount)),
        quantity: 1,
        name: "Diskon Voucher",
      });
    }

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
