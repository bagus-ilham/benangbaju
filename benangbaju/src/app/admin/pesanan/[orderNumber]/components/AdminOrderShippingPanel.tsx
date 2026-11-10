import React from 'react'
import { AdminPanel, Input, HandDrawnIcon } from '@/shared/components'
import { buildWhatsAppUrl, formatApproxMYR, formatIDR } from '@/lib/utils/format'
import { getCourierTrackingUrl, parseTrackingNumbers } from '@/lib/utils/shipping'
import { DEFAULT_WEIGHT_GRAM } from '@/lib/constants'
import type { OrderItem } from '@/modules/orders/types'
import toast from 'react-hot-toast'

interface AdminOrderShippingPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order?: any
  orderShipping?: {
    recipient_name: string
    phone: string
    full_address: string
    district_name?: string | null
    city_name: string
    province_name: string
    postal_code: string
    courier_name: string
    tracking_number?: string | null
    country_code?: string | null
  } | null
  orderItems?: OrderItem[]
  declaredValueIdr?: number
  isEditingResi: boolean
  editResiNumber: string
  setEditResiNumber: (val: string) => void
  setIsEditingResi: (val: boolean) => void
  handleUpdateResi: () => void
  isUpdatingTracking: boolean
}

export function AdminOrderShippingPanel({
  order,
  orderShipping,
  orderItems = [],
  declaredValueIdr = 0,
  isEditingResi,
  editResiNumber,
  setEditResiNumber,
  setIsEditingResi,
  handleUpdateResi,
  isUpdatingTracking,
}: AdminOrderShippingPanelProps): React.JSX.Element {
  if (!orderShipping) {
    return (
      <AdminPanel title="Alamat Pengiriman">
        <p className="text-xs text-neutral-400 italic">Data pengiriman tidak ditemukan.</p>
      </AdminPanel>
    )
  }

  const isMalaysia = orderShipping.country_code === 'MY'
  const isEastMalaysia =
    isMalaysia &&
    (orderShipping.province_name?.toLowerCase().includes('sabah') ||
      orderShipping.province_name?.toLowerCase().includes('sarawak') ||
      orderShipping.province_name?.toLowerCase().includes('labuan') ||
      (parseInt(orderShipping.postal_code || '0', 10) >= 87000 &&
        parseInt(orderShipping.postal_code || '0', 10) <= 98999))

  const countryDisplay = isMalaysia
    ? isEastMalaysia
      ? 'Malaysia (Malaysia Timur - Sabah/Sarawak/Labuan)'
      : 'Malaysia (Malaysia Barat - Semenanjung)'
    : 'Indonesia'

  const whatsappUrl = buildWhatsAppUrl(
    orderShipping.phone,
    undefined,
    isMalaysia ? 'MY' : 'ID'
  )

  const handlePrintCommercialInvoice = async () => {
    try {
      const { generateCommercialInvoiceHtml } = await import('@/lib/utils/invoice-generator')
      const orderData = {
        ...order,
        order_shipping: orderShipping,
        order_items: orderItems,
      }
      const html = generateCommercialInvoiceHtml(orderData)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.open()
        printWindow.document.write(html)
        printWindow.document.close()
      } else {
        toast.error('Pop-up terblokir browser. Harap izinkan pop-up.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal membuat Commercial Invoice')
    }
  }

  // Calculate total package weight
  const totalWeightGram = orderItems.reduce((acc, item) => {
    const unitWeight = item.weight_gram || DEFAULT_WEIGHT_GRAM
    return acc + unitWeight * (item.quantity || 1)
  }, 0)
  const totalItemsCount = orderItems.reduce((acc, item) => acc + (item.quantity || 1), 0)

  return (
    <AdminPanel title="Alamat Pengiriman">
      <div className="text-sm space-y-2 text-neutral-600 font-medium font-sans">
        {/* Recipient & WhatsApp Contact */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-bold text-neutral-800">
            {orderShipping.recipient_name} ({orderShipping.phone})
          </p>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 hover:text-green-800 bg-green-50 border border-green-200 px-2 py-0.5 rounded hover:bg-green-100 transition"
              title="Hubungi Customer via WhatsApp"
            >
              <span>Chat WhatsApp</span>
              <HandDrawnIcon name="external-link" className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        <p className="leading-relaxed">{orderShipping.full_address}</p>

        <p className="text-xs text-neutral-500">
          {[
            orderShipping.district_name ? `Kecamatan ${orderShipping.district_name}` : null,
            orderShipping.city_name,
            `${orderShipping.province_name} ${orderShipping.postal_code}`,
            countryDisplay,
          ]
            .filter(Boolean)
            .join(', ')}
        </p>

        <div className="pt-2 border-t border-neutral-100 mt-2 space-y-1 text-neutral-500 text-xs">
          <p>
            Kurir:{' '}
            <span className="font-bold text-neutral-700 uppercase">
              {orderShipping.courier_name}
            </span>
          </p>

          {/* Tracking Number & Resi Editor */}
          {orderShipping.tracking_number && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <p>No. Resi: </p>
                {isEditingResi ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editResiNumber}
                      onChange={(e) => setEditResiNumber(e.target.value)}
                      className="w-48 py-1"
                      placeholder="Resi (multi pisahkan koma)"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateResi}
                      disabled={isUpdatingTracking}
                      className="text-green-600 hover:text-green-700 p-0.5"
                      title="Simpan"
                    >
                      <HandDrawnIcon name="check" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setIsEditingResi(false)}
                      className="text-red-500 hover:text-red-600 p-0.5"
                      title="Batal"
                    >
                      <HandDrawnIcon name="close" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 select-all font-mono">
                      {orderShipping.tracking_number}
                    </span>
                    <button
                      onClick={() => {
                        setEditResiNumber(orderShipping.tracking_number!)
                        setIsEditingResi(true)
                      }}
                      className="text-neutral-400 hover:text-brand-accent transition"
                      title="Edit Resi"
                    >
                      <HandDrawnIcon name="edit" className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* External Tracking Links */}
              {!isEditingResi && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-[10px] text-neutral-400">Lacak Pengiriman:</span>
                  {parseTrackingNumbers(orderShipping.tracking_number).map((trk) => {
                    const trackingUrl = getCourierTrackingUrl(orderShipping.courier_name, trk)
                    return (
                      <a
                        key={trk}
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-brand-plum hover:underline font-mono bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded"
                      >
                        <span>{trk}</span>
                        <HandDrawnIcon name="external-link" className="h-2.5 w-2.5" />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customs & KiriminAja Booking Helper (Export Only) */}
        {isMalaysia && (
          <div className="mt-4 p-4 border border-amber-200 bg-amber-50/40 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🇲🇾</span>
                <span className="font-bold text-amber-950 uppercase tracking-wide text-[11px]">
                  Data Deklarasi Bea Cukai & Booking KiriminAja
                </span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                {isEastMalaysia ? 'Ekspor East Malaysia' : 'Ekspor West Malaysia'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-neutral-700">
              <div className="p-2.5 bg-white rounded border border-amber-200/80">
                <p className="text-[10px] text-neutral-400 uppercase font-semibold">Estimasi Berat Paket</p>
                <p className="text-sm font-bold text-neutral-900 mt-0.5">
                  {totalWeightGram.toLocaleString('id-ID')} gr ({(totalWeightGram / 1000).toFixed(2)} kg)
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Dihitung dari {totalItemsCount} item pakaian
                </p>
              </div>

              <div className="p-2.5 bg-white rounded border border-amber-200/80">
                <p className="text-[10px] text-neutral-400 uppercase font-semibold">Nilai Barang (Declared Value)</p>
                <p className="text-sm font-bold text-neutral-900 mt-0.5">
                  {formatIDR(declaredValueIdr)}
                </p>
                <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                  {formatApproxMYR(declaredValueIdr)}
                </p>
              </div>
            </div>

            {/* Items and HS Code table */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                Rincian Item & Kode HS Bea Cukai:
              </p>
              <div className="bg-white rounded border border-amber-200/80 divide-y divide-neutral-100 overflow-hidden">
                {orderItems.map((item, idx) => {
                  const itemWeight = (item.weight_gram || DEFAULT_WEIGHT_GRAM) * item.quantity
                  const itemHs = item.hs_code || '6204.43'
                  return (
                    <div key={item.id || idx} className="p-2 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-semibold text-neutral-900">{item.product_name}</span>
                        <span className="text-neutral-500 ml-1">({item.variant_name}) x{item.quantity}</span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">
                          HS: {itemHs}
                        </span>
                        <span className="text-neutral-500 text-[10px]">{itemWeight} gr</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                <span className="text-[10px] text-neutral-500">
                  *HS Code default 6204.43 (Gamis/Dress Muslim Wanita)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const summaryText = orderItems
                        .map((it) => `${it.product_name} (${it.quantity}x) - HS: ${it.hs_code || '6204.43'}`)
                        .join('\n')
                      navigator.clipboard.writeText(
                        `Booking KiriminAja Ekspor:\nPenerima: ${orderShipping.recipient_name}\nTelepon: ${orderShipping.phone}\nAlamat: ${orderShipping.full_address}, ${orderShipping.city_name}, ${orderShipping.province_name} ${orderShipping.postal_code}, Malaysia\nBerat: ${(totalWeightGram / 1000).toFixed(2)} kg\nNilai: ${formatIDR(declaredValueIdr)}\n\nItems:\n${summaryText}`
                      )
                      toast.success('Ringkasan booking KiriminAja disalin!')
                    }}
                    className="text-brand-plum font-semibold hover:underline text-[11px]"
                  >
                    Salin Data Booking
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintCommercialInvoice}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-plum bg-white border border-amber-300 px-2.5 py-1 rounded hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                    title="Cetak Commercial Invoice Deklarasi Bea Cukai"
                  >
                    <HandDrawnIcon name="clipboard-list" className="h-3 w-3" />
                    <span>Cetak Commercial Invoice</span>
                  </button>
                  <a
                    href="https://kiriminaja.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-plum bg-white border border-amber-300 px-2.5 py-1 rounded hover:bg-amber-100 transition shadow-2xs"
                  >
                    <span>Buka Dashboard KiriminAja</span>
                    <HandDrawnIcon name="external-link" className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPanel>
  )
}
