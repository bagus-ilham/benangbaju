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
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${order.order_number} - ${settingsMap.store_name || "Benangbaju"}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 24px 16px; background-color: #f8fafc; line-height: 1.5; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .print-btn { background: #4338ca; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.2s; }
    .print-btn:hover { background: #3730a3; }
    .invoice-card { background: #ffffff; border-radius: 16px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 24px; margin-bottom: 24px; }
    .header h1 { color: #4338ca; margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 2px 0; color: #64748b; font-size: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .info-box { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; }
    .info-box h3 { margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 700; }
    .info-box p { margin: 3px 0; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #4338ca; color: white; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    th:first-child { border-top-left-radius: 8px; }
    th:last-child { border-top-right-radius: 8px; }
    td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
    .summary-box { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .summary { width: 100%; max-width: 320px; border-collapse: collapse; }
    .summary td { padding: 6px 12px; }
    .summary .total { font-size: 15px; font-weight: 800; color: #4338ca; border-top: 2px solid #6366f1; padding-top: 10px; }
    .footer { text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <span style="font-weight: 600; color: #334155;">Invoice Tanggal ${new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
    <button onclick="window.print()" class="print-btn">🖨️ Cetak / Simpan PDF</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <h1>${settingsMap.store_name || "Benangbaju"}</h1>
        <p>${settingsMap.store_address || "Jakarta, Indonesia"}</p>
        <p>${settingsMap.store_phone || ""} | ${settingsMap.store_email || ""}</p>
      </div>
      <div style="text-align:right;">
        <h2 style="margin:0; font-size: 20px; color: #1e293b;">INVOICE</h2>
        <p style="font-weight: 700; color: #4338ca; font-size: 14px; margin-top: 4px;">#${order.order_number}</p>
        <p>Tanggal: ${new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
        <p>Status: <strong style="color: #16a34a; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">LUNAS</strong></p>
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
          <td><strong>${item.product_name}</strong> - ${item.variant_name}</td>
          <td style="color: #64748b;">${item.sku}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">Rp ${Number(item.price).toLocaleString("id-ID")}</td>
          <td style="text-align:right;">Rp ${Number(item.subtotal).toLocaleString("id-ID")}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="summary-box">
      <table class="summary">
        <tr><td>Subtotal Produk</td><td style="text-align:right;">Rp ${Number(order.subtotal).toLocaleString("id-ID")}</td></tr>
        <tr><td>Ongkos Kirim</td><td style="text-align:right;">Rp ${Number(order.shipping_cost).toLocaleString("id-ID")}</td></tr>
        ${Number(order.payment_fee) > 0 ? `<tr><td>Biaya Layanan</td><td style="text-align:right;">Rp ${Number(order.payment_fee).toLocaleString("id-ID")}</td></tr>` : ""}
        ${Number(order.discount_amount) > 0 ? `<tr><td>Diskon Voucher</td><td style="text-align:right; color: #dc2626;">-Rp ${Number(order.discount_amount).toLocaleString("id-ID")}</td></tr>` : ""}
        <tr class="total"><td>Total Tagihan</td><td style="text-align:right;">Rp ${Number(order.total_amount).toLocaleString("id-ID")}</td></tr>
      </table>
    </div>

    <div class="footer">
      <p>Terima kasih telah berbelanja di ${settingsMap.store_name || "Benangbaju"}!</p>
      <p>Kebijakan retur berlaku 7 hari setelah pesanan diterima.</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        try { window.print(); } catch (e) {}
      }, 400);
    };
  </script>
</body>
</html>`;

    // Upload as HTML file to Supabase Storage
    const invoicePath = `${order_number}.html`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(invoicePath, invoiceHtml, {
        contentType: "text/html; charset=utf-8",
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
        data: {
          invoice_path: invoicePath,
          html: invoiceHtml,
        },
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
