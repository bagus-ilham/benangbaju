// @ts-nocheck
// =============================================================
// Edge Function: generate-invoice
// Generates HTML invoice after payment success
// Includes Commercial Invoice format for Malaysia export
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

    // Fetch order data
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
      .select("name, phone, email")
      .eq("id", order.user_id)
      .maybeSingle();

    // Fetch related order items via product_variants -> products (correct FK path)
    let orderItems: any[] = [];
    const { data: rawOrderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*, product_variants(weight_gram, products(weight_gram, hs_code))")
      .eq("order_id", order.id);

    if (itemsError || !rawOrderItems) {
      const { data: fallbackItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      orderItems = fallbackItems || [];
    } else {
      orderItems = rawOrderItems;
    }

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
      .in("key", ["store_name", "store_address", "store_phone", "store_email", "myr_exchange_rate"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = s.value;
    });

    const isMalaysia = orderShipping?.country_code === "MY";
    const rateMyr = parseFloat(settingsMap.myr_exchange_rate || "3600") || 3600;
    const toMYR = (idr: number) => (idr / rateMyr).toFixed(2);

    let totalWeightGram = 0;
    const itemsWithDetails = (orderItems || []).map((item: any) => {
      const pv = item.product_variants;
      const product = Array.isArray(pv?.products) ? pv.products[0] : pv?.products;
      const variantWeight = Number(pv?.weight_gram);
      const productWeight = Number(product?.weight_gram);
      const itemWeight = Number(item.weight_gram);
      const weightGram =
        !isNaN(variantWeight) && variantWeight > 0
          ? variantWeight
          : !isNaN(productWeight) && productWeight > 0
          ? productWeight
          : !isNaN(itemWeight) && itemWeight > 0
          ? itemWeight
          : 400;

      const rawHs = String(product?.hs_code || item.hs_code || "").trim();
      const hsCode = rawHs || "6204.43";
      totalWeightGram += weightGram * (item.quantity || 1);
      return {
        ...item,
        weight_gram: weightGram,
        hs_code: hsCode,
      };
    });

    const shipping = orderShipping;
    const documentTitle = isMalaysia ? "COMMERCIAL INVOICE (EXPORT)" : "INVOICE";

    // Build invoice HTML
    const invoiceHtml = `
<!DOCTYPE html>
<html lang="${isMalaysia ? "en" : "id"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle} #${order.order_number} - ${settingsMap.store_name || "Benangbaju"}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #2D2640; max-width: 860px; margin: 0 auto; padding: 24px 16px; background-color: #FAF8F5; line-height: 1.5; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #2D2640; color: #FAF8F5; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(45, 38, 64, 0.15); }
    .print-btn { background: #94b2b9; color: #2D2640; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s; }
    .print-btn:hover { background: #b5cbcf; transform: translateY(-1px); }
    .invoice-card { background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e9f1f3; box-shadow: 0 8px 30px rgba(45, 38, 64, 0.04); position: relative; overflow: hidden; }
    .top-accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #F3E5AB 0%, #94b2b9 50%, #2D2640 100%); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px dashed #94b2b9; padding-bottom: 24px; margin-bottom: 24px; }
    .header-left p { margin: 3px 0; color: #6b637a; font-size: 12px; }
    .header-right { text-align: right; }
    .header-right h2 { margin: 0; font-size: 20px; font-weight: 800; color: #2D2640; letter-spacing: 1px; }
    .order-num { font-weight: 700; color: #2D2640; font-size: 14px; margin: 4px 0; font-family: monospace; }
    .status-badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 20px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-box { background: #FAF8F5; padding: 18px; border-radius: 12px; border: 1px solid #e9f1f3; }
    .info-box h3 { margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #6b637a; font-weight: 700; border-bottom: 1px dashed #94b2b9; padding-bottom: 6px; }
    .info-box p { margin: 4px 0; color: #2D2640; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #2D2640; color: #FAF8F5; padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
    th:first-child { border-top-left-radius: 8px; }
    th:last-child { border-top-right-radius: 8px; }
    td { padding: 12px 12px; border-bottom: 1px solid #e9f1f3; font-size: 12px; color: #2D2640; }
    .summary-box { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .summary { width: 100%; max-width: 420px; border-collapse: collapse; }
    .summary td { padding: 6px 14px; font-size: 12px; }
    .summary .total { font-size: 15px; font-weight: 800; color: #2D2640; border-top: 2px solid #2D2640; padding-top: 10px; background: #FAF8F5; }
    .customs-box { background: #fefce8; border: 1px solid #fef08a; padding: 14px 18px; border-radius: 10px; margin-bottom: 24px; font-size: 11px; color: #713f12; line-height: 1.6; }
    .footer { text-align: center; color: #6b637a; font-size: 11px; border-top: 1px solid #e9f1f3; padding-top: 18px; }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <span style="font-weight: 600; font-size: 12px;">Invoice #${order.order_number} - Tanggal ${new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
    <button onclick="window.print()" class="print-btn">🖨️ Cetak / Simpan PDF</button>
  </div>

  <div class="invoice-card">
    <div class="top-accent-bar"></div>
    <div class="header">
      <div class="header-left">
        <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #2D2640;">${settingsMap.store_name || "Benangbaju"}</h3>
        <p><strong>Shipper / Origin:</strong> ${settingsMap.store_address || "Bandung, West Java, Indonesia"}</p>
        <p><strong>Country of Origin:</strong> Indonesia (ID — Postal Code 40164)</p>
        <p>${settingsMap.store_phone || "+62 851-7974-7449"} | ${settingsMap.store_email || "cs@benangbaju.com"}</p>
        ${isMalaysia ? `<p style="color: #065f46; font-weight: 700; margin-top: 4px;">Incoterms: DDU (Delivered Duty Unpaid) | Destination: Malaysia (MY)</p>` : ''}
      </div>
      <div class="header-right">
        <h2>${documentTitle}</h2>
        <p class="order-num">#${order.order_number}</p>
        <p style="font-size: 11px; color: #6b637a; margin-bottom: 6px;">Date: ${new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
        <span class="status-badge">✓ PAID / LUNAS</span>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h3>${isMalaysia ? "Consignee / Customer Details" : "Informasi Pelanggan"}</h3>
        <p><strong>${profile?.name || "Customer"}</strong></p>
        <p>${profile?.phone || "-"}</p>
        <p>${profile?.email || "-"}</p>
      </div>
      <div class="info-box">
        <h3>${isMalaysia ? "Delivery Address / Destination" : "Alamat Pengiriman"}</h3>
        <p><strong>${shipping?.recipient_name || "-"}</strong> (${shipping?.phone || "-"})</p>
        <p>${shipping?.full_address || "-"}</p>
        <p>${[shipping?.district_name, shipping?.city_name].filter(Boolean).join(", ")}</p>
        <p>${shipping?.province_name || ""} ${shipping?.postal_code || ""} ${isMalaysia ? ", Malaysia" : ""}</p>
        <p style="margin-top: 6px; font-weight: 600;">Courier: ${shipping?.courier_name || "-"} ${shipping?.tracking_number ? `(AWB: ${shipping.tracking_number})` : ""}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description of Goods</th>
          ${isMalaysia ? `<th>HS Code</th>` : `<th>SKU</th>`}
          <th style="text-align:center;">Qty</th>
          ${isMalaysia ? `<th style="text-align:center;">Net Wt</th>` : ''}
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${(itemsWithDetails || []).map((item: Record<string, any>) => {
          return `
          <tr>
            <td>
              <strong>${item.product_name}</strong> ${item.variant_name ? `- ${item.variant_name}` : ''}
              ${isMalaysia ? `<div style="font-size: 10px; color: #6b637a;">100% Textile Apparel (Muslim Fashion)</div>` : ''}
            </td>
            <td style="color: #6b637a; font-family: monospace; font-size: 11px;">${isMalaysia ? item.hs_code : (item.sku || '-')}</td>
            <td style="text-align:center; font-weight: 700;">${item.quantity}</td>
            ${isMalaysia ? `<td style="text-align:center; font-size: 11px;">${item.weight_gram * item.quantity}g</td>` : ''}
            <td style="text-align:right;">
              Rp ${Number(item.price).toLocaleString("id-ID")}
              ${isMalaysia ? `<br><span style="font-size: 10px; color: #6b637a;">≈ RM ${toMYR(Number(item.price))}</span>` : ''}
            </td>
            <td style="text-align:right; font-weight: 700;">
              Rp ${Number(item.subtotal).toLocaleString("id-ID")}
              ${isMalaysia ? `<br><span style="font-size: 10px; color: #065f46; font-weight: 600;">≈ RM ${toMYR(Number(item.subtotal))}</span>` : ''}
            </td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>

    <div class="summary-box">
      <table class="summary">
        ${isMalaysia ? `<tr><td>Total Package Weight</td><td style="text-align:right; font-weight: 600;">${(totalWeightGram / 1000).toFixed(2)} kg (${totalWeightGram} g)</td></tr>` : ''}
        <tr>
          <td>${isMalaysia ? "Declared Customs Value (FOB)" : "Subtotal Produk"}</td>
          <td style="text-align:right;">
            Rp ${Number(order.subtotal).toLocaleString("id-ID")}
            ${isMalaysia ? ` <span style="color: #6b637a; font-size: 11px;">(≈ RM ${toMYR(Number(order.subtotal))})</span>` : ''}
          </td>
        </tr>
        <tr><td>Ongkos Kirim (Freight)</td><td style="text-align:right;">Rp ${Number(order.shipping_cost).toLocaleString("id-ID")}</td></tr>
        ${Number(order.payment_fee) > 0 ? `<tr><td>Biaya Layanan Pembayaran</td><td style="text-align:right;">Rp ${Number(order.payment_fee).toLocaleString("id-ID")}</td></tr>` : ""}
        ${Number(order.discount_amount) > 0 ? `<tr><td>Diskon Voucher</td><td style="text-align:right; color: #9f1239;">-Rp ${Number(order.discount_amount).toLocaleString("id-ID")}</td></tr>` : ""}
        <tr class="total">
          <td>Total Pembayaran</td>
          <td style="text-align:right;">
            Rp ${Number(order.total_amount).toLocaleString("id-ID")}
            ${isMalaysia ? `<div style="font-size: 12px; color: #065f46; font-weight: 700; margin-top: 2px;">≈ RM ${toMYR(Number(order.total_amount))}</div>` : ''}
          </td>
        </tr>
      </table>
    </div>

    ${isMalaysia ? `
    <div class="customs-box">
      <strong>Customs & Export Declaration:</strong><br>
      Export Category: Commercial E-Commerce Apparel (100% Textile — Non-Hazardous). Country of origin: <strong>Indonesia</strong>. Terms of delivery: Delivered Duty Unpaid (DDU). I/We hereby declare that the information on this invoice is true and correct, and that the contents of this shipment are as stated above. International Final Sale.
    </div>
    ` : ''}

    <div class="footer">
      <p style="font-weight: 700; color: #2D2640; margin-bottom: 4px;">Terima kasih telah berbelanja di ${settingsMap.store_name || "Benangbaju"}!</p>
      <p>${isMalaysia ? "Pesanan lintas batas Malaysia bersifat Final Sale. Bantuan & klaim kendala: WhatsApp Customer Care." : "Kebijakan retur berlaku 7 hari setelah pesanan diterima."}</p>
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
        is_malaysia: isMalaysia,
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
