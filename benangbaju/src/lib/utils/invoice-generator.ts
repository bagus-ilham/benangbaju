import { formatIDR, formatMYR, formatApproxMYR } from './format'
import { DEFAULT_WEIGHT_GRAM } from '@/lib/constants'

export interface InvoiceOrderData {
  id?: string
  order_number: string
  created_at: string
  status: string
  subtotal: number
  discount_amount?: number | null
  shipping_cost?: number | null
  payment_fee?: number | null
  total_amount: number
  country_code?: string | null
  exchange_rate_at_order?: number | null
  markup_percent_at_order?: number | null
  total_myr?: number | null
  payment_channel?: string | null
  notes?: string | null
  order_shipping?: {
    recipient_name: string
    phone: string
    full_address: string
    city_name: string
    province_name: string
    postal_code: string
    district_name?: string | null
    courier_name?: string | null
    tracking_number?: string | null
    country_code?: string | null
  } | null
  order_items?: Array<{
    id?: string
    product_name: string
    variant_name?: string | null
    quantity: number
    price: number
    subtotal: number
    unit_price_myr?: number | null
    total_myr?: number | null
    weight_gram?: number | null
    hs_code?: string | null
  }>
}

/**
 * Escapes HTML characters to prevent XSS in print templates.
 */
function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Generates customer invoice HTML (bilingual/English for Malaysia orders, IDR for Indonesia).
 */
export function generateCustomerInvoiceHtml(
  order: InvoiceOrderData,
  options?: { isBilingualMY?: boolean }
): string {
  const isMY =
    options?.isBilingualMY ??
    (order.country_code === 'MY' || order.order_shipping?.country_code === 'MY')

  const shipping = order.order_shipping
  const items = order.order_items || []
  const rate = order.exchange_rate_at_order || 3600

  const itemsHtml = items
    .map((item, idx) => {
      const unitPriceStr = isMY
        ? item.unit_price_myr != null
          ? formatMYR(item.unit_price_myr)
          : formatMYR(item.price / rate)
        : formatIDR(item.price)

      const lineTotalStr = isMY
        ? item.total_myr != null
          ? formatMYR(item.total_myr)
          : item.unit_price_myr != null
            ? formatMYR(item.unit_price_myr * item.quantity)
            : formatMYR(item.subtotal / rate)
        : formatIDR(item.subtotal)

      return `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0ece1; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0ece1;">
          <strong>${escapeHtml(item.product_name)}</strong>
          ${item.variant_name ? `<br/><span style="font-size: 11px; color: #737373;">Variant: ${escapeHtml(item.variant_name)}</span>` : ''}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0ece1; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0ece1; text-align: right;">${unitPriceStr}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0ece1; text-align: right; font-weight: 600;">${lineTotalStr}</td>
      </tr>
    `
    })
    .join('')

  // Subtotal, shipping, discount, total (order.subtotal/shipping_cost/discount_amount are already charged_idr)
  const mySubtotalValue = isMY
    ? items.length > 0 && items.every((i) => i.unit_price_myr != null)
      ? items.reduce((acc, i) => acc + Number(i.unit_price_myr || 0) * i.quantity, 0)
      : (order.subtotal || 0) / rate
    : 0

  const subtotalStr = isMY
    ? formatMYR(mySubtotalValue)
    : formatIDR(order.subtotal || 0)

  const shippingStr = isMY
    ? order.shipping_cost
      ? formatMYR(order.shipping_cost / rate)
      : 'Free'
    : order.shipping_cost
      ? formatIDR(order.shipping_cost)
      : 'Rp 0'

  const discountStr =
    order.discount_amount && order.discount_amount > 0
      ? isMY
        ? `-${formatMYR(order.discount_amount / rate)}`
        : `-${formatIDR(order.discount_amount)}`
      : null

  const grandTotalStr = isMY
    ? order.total_myr != null
      ? formatMYR(order.total_myr)
      : formatMYR(order.total_amount / rate)
    : formatIDR(order.total_amount)

  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString(isMY ? 'en-MY' : 'id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  return `<!DOCTYPE html>
<html lang="${isMY ? 'en' : 'id'}">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${escapeHtml(order.order_number)} - Benangbaju</title>
  <style>
    @page { size: A4 portrait; margin: 16mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #262626;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-card { max-width: 800px; margin: 0 auto; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #500028; padding-bottom: 16px; margin-bottom: 24px; }
    .brand-title { font-size: 24px; font-weight: 800; color: #500028; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; }
    .brand-subtitle { font-size: 11px; color: #737373; margin-top: 4px; }
    .invoice-title { font-size: 20px; font-weight: 700; color: #262626; text-align: right; margin: 0; }
    .invoice-meta { font-size: 11px; color: #525252; text-align: right; margin-top: 4px; }
    .grid-info { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
    .info-box { flex: 1; background: #faf8f5; border: 1px solid #eee7de; border-radius: 8px; padding: 12px 16px; font-size: 12px; }
    .info-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #500028; letter-spacing: 0.08em; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #500028; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px; text-align: left; }
    .totals-area { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-table { width: 320px; font-size: 12px; }
    .totals-table td { padding: 4px 0; }
    .grand-total { border-top: 2px solid #500028; font-size: 16px; font-weight: 800; color: #500028; padding-top: 8px !important; }
    .footnote { background: #fdfbf7; border: 1px dashed #d4c5b3; border-radius: 8px; padding: 12px 16px; font-size: 11px; color: #525252; margin-top: 20px; }
    .footer { text-align: center; font-size: 11px; color: #a3a3a3; margin-top: 32px; border-top: 1px solid #f0ece1; padding-top: 16px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="brand-title">Benangbaju</h1>
        <div class="brand-subtitle">
          Bandung, West Java, Indonesia &bull; www.benangbaju.com<br/>
          Customer Support: +62 851-7974-7449
        </div>
      </div>
      <div>
        <h2 class="invoice-title">${isMY ? 'TAX & PAYMENT RECEIPT' : 'FAKTUR PENJUALAN'}</h2>
        <div class="invoice-meta">
          <strong>#${escapeHtml(order.order_number)}</strong><br/>
          Date: ${dateStr}<br/>
          Status: <span style="text-transform: uppercase; font-weight: 700; color: #047857;">${escapeHtml(order.status)}</span>
        </div>
      </div>
    </div>

    <div class="grid-info">
      <div class="info-box">
        <div class="info-title">${isMY ? 'Bill / Ship To' : 'Tujuan Pengiriman'}</div>
        <strong>${escapeHtml(shipping?.recipient_name || 'Customer')}</strong><br/>
        Phone: ${escapeHtml(shipping?.phone || '-')}<br/>
        ${escapeHtml(shipping?.full_address || '-')}<br/>
        ${escapeHtml(shipping?.city_name || '')}, ${escapeHtml(shipping?.province_name || '')} ${escapeHtml(shipping?.postal_code || '')}<br/>
        <strong>${escapeHtml(isMY ? 'MALAYSIA' : 'INDONESIA')}</strong>
      </div>
      <div class="info-box">
        <div class="info-title">${isMY ? 'Shipping & Payment Method' : 'Informasi Pembayaran & Kurir'}</div>
        Courier: ${escapeHtml(shipping?.courier_name || 'Standard Courier')}<br/>
        Tracking No: <strong>${escapeHtml(shipping?.tracking_number || 'Pending Dispatch')}</strong><br/>
        Payment Channel: ${escapeHtml(order.payment_channel || 'QRIS / DuitNow Cross-Border')}<br/>
        Currency: <strong>${isMY ? 'MYR (Ringgit Malaysia)' : 'IDR (Indonesian Rupiah)'}</strong>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">No</th>
          <th>${isMY ? 'Item Description' : 'Deskripsi Barang'}</th>
          <th style="width: 60px; text-align: center;">${isMY ? 'Qty' : 'Jumlah'}</th>
          <th style="width: 100px; text-align: right;">${isMY ? 'Unit Price' : 'Harga Satuan'}</th>
          <th style="width: 110px; text-align: right;">${isMY ? 'Total' : 'Subtotal'}</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td>Subtotal</td>
          <td style="text-align: right; font-weight: 600;">${subtotalStr}</td>
        </tr>
        <tr>
          <td>${isMY ? 'Shipping Cost' : 'Ongkos Kirim'}</td>
          <td style="text-align: right;">${shippingStr}</td>
        </tr>
        ${
          discountStr
            ? `<tr>
                 <td style="color: #b91c1c;">${isMY ? 'Promo Discount' : 'Diskon Voucher'}</td>
                 <td style="text-align: right; color: #b91c1c; font-weight: 600;">${discountStr}</td>
               </tr>`
            : ''
        }
        <tr class="grand-total">
          <td>${isMY ? 'Total Amount' : 'Total Pembayaran'}</td>
          <td style="text-align: right;">${grandTotalStr}</td>
        </tr>
      </table>
    </div>

    ${
      isMY
        ? `
    <div class="footnote">
      <strong>Payment & Customs Notice:</strong><br/>
      &bull; Settlement via Midtrans QRIS Cross-Border: <strong>${formatIDR(order.total_amount)}</strong> (Conversion snapshot: 1 MYR = ${formatIDR(rate)}).<br/>
      &bull; <strong>Final Sale:</strong> Orders delivered to Malaysia are final and non-refundable. For defective/wrong items, please report to our WhatsApp support within 48 hours of delivery with unboxing photo/video proof.<br/>
      &bull; Delivered Duty Unpaid (DDU). Shipments with CIF value &le; RM 500 are exempt from import duty (De Minimis).
    </div>
    `
        : `
    <div class="footnote">
      Terima kasih telah berbelanja di Benangbaju! Simpan bukti faktur ini untuk keperluan konfirmasi pesanan atau layanan purna jual.
    </div>
    `
    }

    <div class="footer">
      This is a computer-generated document. No physical signature is required.<br/>
      Benangbaju &bull; Crafted with Care, Delivered with Love.
    </div>
  </div>
</body>
</html>`
}

/**
 * Generates an official Commercial Invoice for customs clearance / export to Malaysia.
 */
export function generateCommercialInvoiceHtml(
  order: InvoiceOrderData,
  options?: { defaultHsCode?: string }
): string {
  const shipping = order.order_shipping
  const items = order.order_items || []
  const rate = order.exchange_rate_at_order || 3600
  const defaultHs = options?.defaultHsCode || '6204.43.00'

  let totalQty = 0
  let totalNetWeightKg = 0
  let totalDeclaredMyr = 0
  let totalDeclaredIdr = 0

  const itemsRows = items
    .map((item, idx) => {
      const qty = item.quantity || 1
      totalQty += qty

      const unitWeightGram = item.weight_gram || DEFAULT_WEIGHT_GRAM
      const itemNetWeightKg = (unitWeightGram * qty) / 1000
      totalNetWeightKg += itemNetWeightKg

      const itemHs = item.hs_code || defaultHs

      const unitMyr =
        item.unit_price_myr != null
          ? Number(item.unit_price_myr)
          : Number((item.price / rate).toFixed(2))

      const lineTotalMyr =
        item.total_myr != null ? Number(item.total_myr) : Number((unitMyr * qty).toFixed(2))

      const unitIdr = item.price
      const lineTotalIdr = item.subtotal

      totalDeclaredMyr += lineTotalMyr
      totalDeclaredIdr += lineTotalIdr

      return `
      <tr>
        <td style="text-align: center; padding: 6px 4px; border: 1px solid #d4d4d4;">${idx + 1}</td>
        <td style="padding: 6px 8px; border: 1px solid #d4d4d4;">
          <strong>${escapeHtml(item.product_name)}</strong>
          ${item.variant_name ? `<br/><span style="font-size: 10px; color: #525252;">Variant: ${escapeHtml(item.variant_name)}</span>` : ''}
          <br/><span style="font-size: 10px; color: #737373;">Description: Modest Apparel / Women's Clothing</span>
        </td>
        <td style="text-align: center; padding: 6px 4px; border: 1px solid #d4d4d4; font-family: monospace;">${escapeHtml(itemHs)}</td>
        <td style="text-align: center; padding: 6px 4px; border: 1px solid #d4d4d4;">ID</td>
        <td style="text-align: center; padding: 6px 4px; border: 1px solid #d4d4d4;">${qty}</td>
        <td style="text-align: right; padding: 6px 6px; border: 1px solid #d4d4d4;">${itemNetWeightKg.toFixed(2)}</td>
        <td style="text-align: right; padding: 6px 6px; border: 1px solid #d4d4d4;">RM ${unitMyr.toFixed(2)}</td>
        <td style="text-align: right; padding: 6px 6px; border: 1px solid #d4d4d4; font-weight: 600;">RM ${lineTotalMyr.toFixed(2)}</td>
      </tr>
    `
    })
    .join('')

  const totalGrossWeightKg = (totalNetWeightKg * 1.15).toFixed(2) // +15% packaging allowance
  const dateStr = new Date().toISOString().split('T')[0]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>COMMERCIAL INVOICE - ${escapeHtml(order.order_number)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      color: #171717;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .wrapper { max-width: 820px; margin: 0 auto; padding: 12px; }
    .header-table, .meta-table, .items-table, .sign-table {
      width: 100%; border-collapse: collapse; margin-bottom: 12px;
    }
    .title-banner {
      background: #500028; color: #ffffff; text-align: center; padding: 8px;
      font-size: 16px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
      margin-bottom: 12px;
    }
    .box-cell {
      border: 1px solid #a3a3a3; padding: 8px; vertical-align: top;
    }
    .cell-title {
      font-size: 9px; font-weight: 800; text-transform: uppercase; color: #500028; margin-bottom: 4px;
    }
    .items-table th {
      background: #f5f5f5; border: 1px solid #a3a3a3; padding: 6px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;
    }
    .declaration-text {
      font-size: 10px; color: #404040; text-align: justify; margin: 10px 0; line-height: 1.35;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="title-banner">
      COMMERCIAL INVOICE — CUSTOMS DECLARATION
    </div>

    <table class="header-table">
      <tr>
        <td class="box-cell" style="width: 50%;">
          <div class="cell-title">1. EXPORTER / SHIPPER</div>
          <strong>BENANGBAJU (PT BENANG BAJU INDONESIA)</strong><br/>
          Jl. R.E. Martadinata No. 120, Cihapit, Bandung<br/>
          Jawa Barat 40115, INDONESIA<br/>
          Phone: +62 851-7974-7449<br/>
          Email: export@benangbaju.com &bull; Web: www.benangbaju.com<br/>
          Tax ID (NPWP): 03.123.456.7-428.000
        </td>
        <td class="box-cell" style="width: 50%;">
          <div class="cell-title">2. INVOICE & EXPORT METADATA</div>
          Invoice Number: <strong>INV-EXP-${escapeHtml(order.order_number)}</strong><br/>
          Invoice Date: <strong>${dateStr}</strong><br/>
          Customer Order Ref: <strong>${escapeHtml(order.order_number)}</strong><br/>
          Air Waybill (AWB): <strong>${escapeHtml(shipping?.tracking_number || 'PENDING DISPATCH')}</strong><br/>
          Carrier / Courier: <strong>${escapeHtml(shipping?.courier_name || 'International Air Freight')}</strong><br/>
          Reason for Export: <strong>Commercial E-Commerce Retail Sale</strong>
        </td>
      </tr>
      <tr>
        <td class="box-cell">
          <div class="cell-title">3. CONSIGNEE / IMPORTER (BUYER)</div>
          <strong>${escapeHtml(shipping?.recipient_name || 'Customer')}</strong><br/>
          Phone: <strong>${escapeHtml(shipping?.phone || '-')}</strong><br/>
          Address: ${escapeHtml(shipping?.full_address || '-')}<br/>
          ${escapeHtml(shipping?.city_name || '')}, ${escapeHtml(shipping?.province_name || '')} ${escapeHtml(shipping?.postal_code || '')}<br/>
          Country: <strong>MALAYSIA</strong>
        </td>
        <td class="box-cell">
          <div class="cell-title">4. SHIPMENT & CUSTOMS TERMS</div>
          Country of Origin: <strong>INDONESIA (ID)</strong><br/>
          Country of Destination: <strong>MALAYSIA (MY)</strong><br/>
          Port of Loading: <strong>CGK (Soekarno-Hatta Int'l Airport) / BDO</strong><br/>
          Port of Discharge: <strong>KUL (Kuala Lumpur International Airport)</strong><br/>
          Incoterms: <strong>DAP / DDU (Delivered Duty Unpaid) - Incoterms 2020</strong><br/>
          Invoice Currency: <strong>MYR (Malaysian Ringgit)</strong>
        </td>
      </tr>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 25px;">No</th>
          <th>Description of Goods</th>
          <th style="width: 80px;">HS Code</th>
          <th style="width: 35px;">COO</th>
          <th style="width: 40px;">Qty</th>
          <th style="width: 60px;">Net (kg)</th>
          <th style="width: 80px;">Unit (MYR)</th>
          <th style="width: 90px;">Total (MYR)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
      <tfoot>
        <tr style="background: #fafafa; font-weight: 700;">
          <td colspan="4" style="text-align: right; padding: 6px; border: 1px solid #d4d4d4;">TOTALS:</td>
          <td style="text-align: center; padding: 6px; border: 1px solid #d4d4d4;">${totalQty} pcs</td>
          <td style="text-align: right; padding: 6px; border: 1px solid #d4d4d4;">${totalNetWeightKg.toFixed(2)} kg</td>
          <td style="text-align: right; padding: 6px; border: 1px solid #d4d4d4;">FOB Value:</td>
          <td style="text-align: right; padding: 6px; border: 1px solid #d4d4d4; color: #500028;">RM ${totalDeclaredMyr.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <table class="meta-table">
      <tr>
        <td class="box-cell" style="width: 50%;">
          <strong>Weight Summary:</strong><br/>
          Total Net Weight: <strong>${totalNetWeightKg.toFixed(2)} kg</strong><br/>
          Total Gross Weight (Est.): <strong>${totalGrossWeightKg} kg</strong><br/>
          Number of Packages: <strong>1 Parcel</strong>
        </td>
        <td class="box-cell" style="width: 50%;">
          <strong>Declared Value Summary:</strong><br/>
          Total Declared FOB Value: <strong>RM ${totalDeclaredMyr.toFixed(2)}</strong><br/>
          Equivalent in IDR: <strong>${formatIDR(totalDeclaredIdr)}</strong><br/>
          Exchange Rate: 1 MYR = ${formatIDR(rate)}
        </td>
      </tr>
    </table>

    <div class="declaration-text">
      <strong>EXPORTER DECLARATION:</strong> I, the undersigned, hereby declare that the information provided in this Commercial Invoice is true and accurate in all respects. The goods described are manufactured and exported from Indonesia for commercial retail purposes. No prohibited or dangerous goods are contained in this consignment.
    </div>

    <table class="sign-table">
      <tr>
        <td style="width: 60%; vertical-align: bottom;">
          Date: <strong>${dateStr}</strong><br/>
          Place: <strong>Bandung, Indonesia</strong>
        </td>
        <td style="width: 40%; text-align: center; vertical-align: bottom; border-top: 1px solid #404040; padding-top: 40px;">
          <strong>BENANGBAJU EXPORT OPERATIONS</strong><br/>
          <span style="font-size: 10px; color: #737373;">Authorized Shipper Signature & Stamp</span>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`
}
