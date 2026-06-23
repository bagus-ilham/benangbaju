// @ts-nocheck
// =============================================================
// Edge Function: generate-invoice
// Generates HTML invoice after payment success
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const isServiceRole = serviceRoleKey && token === serviceRoleKey;

    let user = null;
    if (!isServiceRole) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authUser) {
        return new Response(
          JSON.stringify({ success: false, message: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      user = authUser;
    }

    // Fetch order data - separate queries for robustness
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", order_number)
      .single();

    if (orderError || !order) {
      console.error("Fetch order error:", orderError);
      return new Response(
        JSON.stringify({ success: false, message: "Pesanan tidak ditemukan" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check ownership if not service role
    if (!isServiceRole && user && order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, message: "Akses ditolak: Anda bukan pemilik pesanan ini" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch related profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", order.user_id)
      .maybeSingle();

    // Fetch related order items
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    // Fetch related order shipping
    const { data: orderShipping } = await supabase
      .from("order_shipping")
      .select("*")
      .eq("order_id", order.id)
      .maybeSingle();

    // Fetch related payments
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", order.id);

    // Fetch store settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["store_name", "store_address", "store_phone", "store_email"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = s.value;
    });

    // Build invoice HTML
    const shipping = orderShipping;
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #8B5CF6; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { color: #8B5CF6; margin: 0; font-size: 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-box { background: #f9f9f9; padding: 12px; border-radius: 8px; }
    .info-box h3 { margin: 0 0 8px; font-size: 13px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #8B5CF6; color: white; padding: 10px; text-align: left; font-size: 12px; }
    td { padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; }
    .summary { text-align: right; }
    .summary td { padding: 6px 10px; }
    .summary .total { font-size: 16px; font-weight: bold; color: #8B5CF6; border-top: 2px solid #8B5CF6; }
    .footer { text-align: center; color: #999; font-size: 10px; border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${settingsMap.store_name || "Benangbaju"}</h1>
      <p>${settingsMap.store_address || ""}</p>
      <p>${settingsMap.store_phone || ""} | ${settingsMap.store_email || ""}</p>
    </div>
    <div style="text-align:right;">
      <h2 style="margin:0;">INVOICE</h2>
      <p><strong>${order.order_number}</strong></p>
      <p>Tanggal: ${new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
      <p>Status: <strong style="color: green;">LUNAS</strong></p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Informasi Pelanggan</h3>
      <p><strong>${profile?.name || "Pelanggan"}</strong></p>
      <p>${profile?.phone || "-"}</p>
    </div>
    <div class="info-box">
      <h3>Alamat Pengiriman</h3>
      <p><strong>${shipping?.recipient_name || "-"}</strong></p>
      <p>${shipping?.full_address || "-"}</p>
      <p>${shipping?.district_name || ""}, ${shipping?.city_name || ""}</p>
      <p>${shipping?.province_name || ""} ${shipping?.postal_code || ""}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produk</th>
        <th>SKU</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Harga</th>
        <th style="text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${(orderItems || []).map((item: Record<string, unknown>) => `
      <tr>
        <td>${item.product_name} - ${item.variant_name}</td>
        <td>${item.sku}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">Rp ${Number(item.price).toLocaleString("id-ID")}</td>
        <td style="text-align:right;">Rp ${Number(item.subtotal).toLocaleString("id-ID")}</td>
      </tr>
      `).join("")}
    </tbody>
  </table>

  <table class="summary">
    <tr><td>Subtotal</td><td>Rp ${Number(order.subtotal).toLocaleString("id-ID")}</td></tr>
    <tr><td>Ongkos Kirim</td><td>Rp ${Number(order.shipping_cost).toLocaleString("id-ID")}</td></tr>
    ${Number(order.discount_amount) > 0 ? `<tr><td>Diskon Voucher</td><td>-Rp ${Number(order.discount_amount).toLocaleString("id-ID")}</td></tr>` : ""}
    <tr class="total"><td>Total</td><td>Rp ${Number(order.total_amount).toLocaleString("id-ID")}</td></tr>
  </table>

  <div class="footer">
    <p>Terima kasih telah berbelanja di ${settingsMap.store_name || "Benangbaju"}!</p>
    <p>Kebijakan retur berlaku 7 hari setelah pesanan diterima.</p>
  </div>
</body>
</html>`;

    // Upload as HTML file to Supabase Storage
    const invoicePath = `invoices/${order_number}.html`;
    const blob = new Blob([invoiceHtml], { type: "text/html" });

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(invoicePath, blob, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ success: false, message: "Gagal menyimpan invoice" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update payment with invoice URL if record exists
    if (payments && payments.length > 0) {
      await supabase
        .from("payments")
        .update({ invoice_url: invoicePath })
        .eq("order_id", order.id);
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        function: "generate-invoice",
        order_number,
        path: invoicePath,
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: { invoice_path: invoicePath },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-invoice error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal membuat invoice" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
