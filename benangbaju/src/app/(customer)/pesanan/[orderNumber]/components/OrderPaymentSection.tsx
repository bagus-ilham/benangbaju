'use client'

import React, { useState } from 'react'
import { Button, SmartLink as Link, HandDrawnIcon } from '@/shared/components'
import { formatApproxMYR, buildWhatsAppUrl, formatMYR } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import toast from 'react-hot-toast'

interface OrderPaymentSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  returnRequest?: any
  isVerifyingPayment: boolean
  isGeneratingToken: boolean
  isCheckingPayment: boolean
  onPayOrder: () => void
  onCheckStatus: () => void
  onCancelOrder: () => void
  onConfirmDelivery: () => void
  onReorder?: () => void
  isReordering?: boolean
  myrExchangeRate?: number
}

export function OrderPaymentSection({
  order,
  returnRequest,
  isVerifyingPayment,
  isGeneratingToken,
  isCheckingPayment,
  onPayOrder,
  onCheckStatus,
  onCancelOrder,
  onConfirmDelivery,
  onReorder,
  isReordering,
  myrExchangeRate = 3600,
}: OrderPaymentSectionProps): React.JSX.Element {
  const [copiedCode, setCopiedCode] = useState(false)
  const [isDownloadingQR, setIsDownloadingQR] = useState(false)

  const market = useMarket()
  const isMalaysia =
    order.country_code === 'MY' ||
    order.order_shipping?.country_code === 'MY' ||
    order.shipping_address?.country_code === 'MY'
  const isMY = market === 'MY' || isMalaysia

  // Get active payment info
  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments
  const instructions = payment?.payment_instructions || null
  const vaNumber =
    payment?.va_number ||
    instructions?.va_number ||
    payment?.gateway_response?.virtual_account_info?.virtual_account_number ||
    payment?.gateway_response?.va_number
  const paymentCode =
    payment?.payment_code ||
    instructions?.payment_code ||
    payment?.gateway_response?.online_to_offline_info?.payment_code
  const qrUrl =
    payment?.qr_url ||
    instructions?.qr_url ||
    payment?.gateway_response?.qris_info?.qr_url ||
    payment?.gateway_response?.qris_info?.qr_string
  const checkoutUrl =
    instructions?.checkout_url ||
    instructions?.deep_link_url ||
    payment?.gateway_response?.response?.payment?.url ||
    payment?.gateway_response?.url

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    toast.success('Nomor / kode berhasil disalin!')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleDownloadQR = async () => {
    if (!qrUrl) return
    setIsDownloadingQR(true)
    try {
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `qris-${order.order_number}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success('Gambar QRIS berhasil diunduh!')
    } catch {
      // Fallback: open image in new tab if CORS prevents direct blob download
      window.open(qrUrl, '_blank')
    } finally {
      setIsDownloadingQR(false)
    }
  }

  return (
    <div className="border border-neutral-200/80 p-5 bg-brand-cream h-fit space-y-5 relative overflow-hidden rounded-2xl shadow-xs font-sans">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold via-amber-200 to-brand-gold" />
      <h2 className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum border-b border-neutral-200/60 pb-2">
        {isMY ? 'Payment Summary & Methods' : 'Rincian & Metode Pembayaran'}
      </h2>

      {/* Cost Breakdown */}
      <div className="space-y-3 text-sm text-neutral-600">
        <div className="flex justify-between">
          <span>{isMY ? 'Product Subtotal' : 'Subtotal Produk'}</span>
          <span className="font-bold text-brand-plum">
            Rp {order.subtotal?.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between">
          <span>{isMY ? 'Shipping Cost' : 'Ongkos Kirim'}</span>
          <span className="font-bold text-brand-plum">
            Rp {order.shipping_cost?.toLocaleString('id-ID')}
          </span>
        </div>
        {Number(order.payment_fee) > 0 && (
          <div className="flex justify-between">
            <span>{isMY ? 'Payment Processing Fee' : 'Biaya Layanan Pembayaran'}</span>
            <span className="font-bold text-brand-plum">
              Rp {Number(order.payment_fee).toLocaleString('id-ID')}
            </span>
          </div>
        )}
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-neutral-800 font-bold">
            <span>{isMY ? 'Voucher Discount' : 'Diskon Voucher'}</span>
            <span className="text-red-600">
              - Rp {order.discount_amount.toLocaleString('id-ID')}
            </span>
          </div>
        )}
        {order.payment_channel && (
          <div className="flex justify-between text-xs text-neutral-500 pt-1">
            <span>{isMY ? 'Payment Method' : 'Metode Bayar'}</span>
            <span className="font-semibold text-brand-plum uppercase">
              {order.payment_channel.replace(/_/g, ' ')}
            </span>
          </div>
        )}
        <div className="border-t border-neutral-200/60 pt-4 mt-2">
          <div className="flex justify-between items-center text-brand-plum font-sans">
            <span className="text-sm font-bold">{isMY ? 'Total Amount' : 'Total Pembayaran'}</span>
            <span className="text-lg font-bold text-brand-plum">
              Rp {order.total_amount?.toLocaleString('id-ID')}
            </span>
          </div>
          {isMalaysia && (
            <div className="text-right mt-1">
              <span className="text-xs font-bold text-emerald-800">
                {order.total_myr
                  ? formatMYR(Number(order.total_myr))
                  : formatApproxMYR(order.total_amount, myrExchangeRate)}
              </span>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {isMY ? '*Approximate in Ringgit Malaysia (settlement in IDR)' : '*Estimasi Ringgit Malaysia (pembayaran tetap dalam IDR)'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Direct Payment Instructions for Pending Payment */}
      {order.status === 'pending_payment' && (
        <div className="space-y-4 pt-2 border-t border-neutral-200/60">
          {/* VA Instructions */}
          {vaNumber && (
            <div className="bg-white p-4 rounded-xl border border-brand-plum/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-widest">
                {isMY ? 'Virtual Account Number' : 'Nomor Virtual Account'}
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-brand-plum tracking-wider">
                  {vaNumber}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopy(vaNumber)}
                  className="text-[10px] py-1.5 px-3 uppercase tracking-wider font-bold"
                >
                  {copiedCode ? (isMY ? 'Copied' : 'Tersalin') : (isMY ? 'Copy VA' : 'Salin VA')}
                </Button>
              </div>
              <p className="text-[10px] text-neutral-500 font-sans">
                {isMY ? 'Transfer via m-Banking or ATM to the Virtual Account number above.' : 'Transfer melalui m-Banking atau ATM ke nomor Virtual Account di atas.'}
              </p>
            </div>
          )}

          {/* Minimarket Payment Code */}
          {paymentCode && !vaNumber && (
            <div className="bg-white p-4 rounded-xl border border-brand-plum/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-widest">
                {isMY ? 'Convenience Store Payment Code' : 'Kode Pembayaran Minimarket'}
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-brand-plum tracking-wider">
                  {paymentCode}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopy(paymentCode)}
                  className="text-[10px] py-1.5 px-3 uppercase tracking-wider font-bold"
                >
                  {copiedCode ? (isMY ? 'Copied' : 'Tersalin') : (isMY ? 'Copy Code' : 'Salin Kode')}
                </Button>
              </div>
              <p className="text-[10px] text-neutral-500 font-sans">
                Tunjukkan kode pembayaran ini kepada kasir Minimarket terdekat.
              </p>
            </div>
          )}

          {/* QRIS Display */}
          {qrUrl && (
            <div className="bg-white p-4 rounded-xl border border-brand-plum/20 text-center space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-widest">
                  {isMY ? 'Scan Cross-Border QRIS (DuitNow)' : 'Scan QRIS Cross-Border'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQR}
                  isLoading={isDownloadingQR}
                  className="text-[10px] py-1 px-2.5 uppercase font-bold flex items-center gap-1"
                >
                  <HandDrawnIcon name="download" className="h-3 w-3" />
                  <span>{isMY ? 'Download QR' : 'Unduh QR'}</span>
                </Button>
              </div>

              <div className="relative w-48 h-48 mx-auto bg-neutral-50 border p-2 rounded-lg flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="Scan QRIS" className="w-full h-full object-contain" />
              </div>

              {isMalaysia ? (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-left space-y-2 text-xs text-emerald-950 font-sans">
                  <p className="font-bold text-[11px] uppercase tracking-wide text-emerald-900 flex items-center gap-1.5 border-b border-emerald-200/60 pb-1.5">
                    <HandDrawnIcon name="sparkles" className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{isMY ? '🇲🇾 How to Pay with Malaysian Banking / E-Wallet' : '🇲🇾 Panduan Bayar via Bank / E-Wallet Malaysia'}</span>
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-[11px] text-emerald-950/90 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>{isMY ? <>Click <strong>Download QR</strong> above or save a screenshot of this QR code.</> : <>Klik <strong>Unduh QR</strong> di atas atau simpan tangkapan layar (screenshot) kode QR ini.</>}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>{isMY ? <>Open your Malaysian banking or e-wallet app (<strong>Touch &apos;n Go, Maybank MAE, CIMB Octo, Public Bank PB engage, etc</strong>).</> : <>Buka aplikasi perbankan atau e-wallet Malaysia Anda (<strong>Touch &apos;n Go, Maybank MAE, CIMB Octo, Public Bank PB engage, dll</strong>).</>}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>{isMY ? <>Select <strong>DuitNow QR / Scan</strong>, tap <strong>Scan from Gallery / Album</strong>, and select the saved QR image.</> : <>Pilih menu <strong>DuitNow QR / Scan</strong>, lalu pilih opsi <strong>Scan from Gallery / Album</strong> dan pilih gambar QR yang tadi disimpan.</>}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                      <span>{isMY ? <>The total is displayed in <strong>MYR (RM)</strong> automatically. Authorize with your PIN and your order updates immediately.</> : <>Nominal otomatis terkonversi ke <strong>MYR (RM)</strong> oleh DuitNow. Masukkan PIN dan pesanan Anda langsung lunas.</>}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-neutral-500 font-sans">
                  Buka aplikasi bank atau e-wallet Anda (BCA, Mandiri, GoPay, OVO, DANA, dll) lalu scan kode di atas.
                </p>
              )}
            </div>
          )}

          {/* Online Payment / E-Wallet Notice */}
          {checkoutUrl && !qrUrl && !vaNumber && !paymentCode && (
            <div className="bg-white p-4 rounded-xl border border-brand-plum/20 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block tracking-widest">
                {isMalaysia ? 'Sesi Pembayaran QRIS Cross-Border' : 'Sesi Pembayaran Online / E-Wallet'}
              </span>
              <p className="text-[11px] text-neutral-600 font-sans">
                {isMalaysia
                  ? 'Silakan klik tombol di bawah untuk membuka halaman QRIS DOKU, lalu ikuti petunjuk Scan from Gallery.'
                  : 'Silakan klik tombol di bawah untuk melanjutkan pembayaran di portal pembayaran DOKU.'}
              </p>
              {isMalaysia && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-left space-y-2 text-xs text-emerald-950 font-sans mt-2">
                  <p className="font-bold text-[11px] uppercase tracking-wide text-emerald-900 flex items-center gap-1.5 border-b border-emerald-200/60 pb-1.5">
                    <HandDrawnIcon name="sparkles" className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{isMY ? '🇲🇾 How to Pay with Malaysian Banking / E-Wallet' : '🇲🇾 Panduan Bayar via Bank / E-Wallet Malaysia'}</span>
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-[11px] text-emerald-950/90 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>{isMY ? <>Click <strong>Open Payment Page</strong> below to view the QRIS payment session.</> : <>Klik <strong>Buka Halaman Pembayaran</strong> di bawah untuk membuka sesi QRIS.</>}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>{isMY ? <>Take a screenshot of the QRIS code displayed on your screen.</> : <>Simpan tangkapan layar (screenshot) kode QRIS yang tampil di layar Anda.</>}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>{isMY ? <>Open your Malaysian banking or e-wallet app (<strong>Touch &apos;n Go, MAE, CIMB Octo, etc.</strong>), choose <strong>Scan QR / DuitNow</strong>, then tap <strong>Scan from Gallery</strong>.</> : <>Buka aplikasi perbankan atau e-wallet Malaysia Anda (<strong>Touch &apos;n Go, MAE, CIMB Octo, dll</strong>), pilih menu <strong>Scan QR / DuitNow</strong> lalu pilih <strong>Scan from Gallery</strong>.</>}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                      <span>{isMY ? <>Confirm the automatically converted <strong>MYR (RM)</strong> amount with your PIN.</> : <>Konfirmasi nominal yang telah otomatis dikonversi ke <strong>MYR (RM)</strong> oleh DuitNow dengan PIN Anda.</>}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col gap-2">
        {order.status === 'pending_payment' && (
          <>
            {isVerifyingPayment ? (
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image/svg/logo/logo-jarum-benang.svg"
                  alt=""
                  className="h-4 w-4 animate-[spin_3s_linear_infinite] object-contain shrink-0"
                  aria-hidden="true"
                />
                <span>Memverifikasi pembayaran...</span>
              </div>
            ) : (
              <>
                {checkoutUrl ? (
                  <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="accent" className="w-full py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                      <HandDrawnIcon name="external-link" className="h-4 w-4" />
                      <span>{isMY ? 'Open Payment Page' : 'Buka Halaman Pembayaran'}</span>
                    </Button>
                  </a>
                ) : (
                  !vaNumber && !qrUrl && !paymentCode && (
                    <Button
                      onClick={onPayOrder}
                      isLoading={isGeneratingToken}
                      disabled={isGeneratingToken || isVerifyingPayment}
                      variant="accent"
                      className="w-full py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2"
                    >
                      <HandDrawnIcon name="tag" className="h-4 w-4" />
                      <span>{isMY ? 'Request Payment Link / Code' : 'Minta Kode / Link Pembayaran'}</span>
                    </Button>
                  )
                )}
                <Button
                  onClick={onCheckStatus}
                  isLoading={isCheckingPayment}
                  disabled={isCheckingPayment}
                  variant="outline"
                  className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-neutral-300 text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  {isMY ? 'Check Payment Status' : 'Cek Status Pembayaran'}
                </Button>
              </>
            )}
            <Button
              onClick={onCancelOrder}
              variant="outline"
              disabled={isVerifyingPayment}
              className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
            >
              {isMY ? 'Cancel Order' : 'Batalkan Pesanan'}
            </Button>
            {onReorder && (
              <Button
                onClick={onReorder}
                disabled={isReordering || isVerifyingPayment}
                isLoading={isReordering}
                variant="ghost"
                className="w-full py-2 text-[10px] font-sans font-semibold text-neutral-500 hover:text-brand-blue flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-200"
              >
                <HandDrawnIcon name="refresh" className="h-3 w-3" />
                <span>{isMY ? 'Session Expired? Cancel & Re-order' : 'Sesi Expired? Batalkan & Pesan Ulang'}</span>
              </Button>
            )}
          </>
        )}

        {order.status === 'cancelled' && (
          <div className="space-y-3">
            <div className="flex items-center text-xs text-neutral-600 bg-neutral-100/70 p-3.5 border border-neutral-200 rounded-xl">
              <HandDrawnIcon name="close" className="h-4 w-4 mr-2 shrink-0 text-red-500" />
              <span>{isMY ? 'This order has been cancelled or the payment session has expired.' : 'Pesanan ini telah dibatalkan atau sesi pembayaran telah kedaluwarsa.'}</span>
            </div>
            {onReorder && (
              <Button
                onClick={onReorder}
                disabled={isReordering}
                isLoading={isReordering}
                variant="accent"
                className="w-full py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HandDrawnIcon name="refresh" className="h-3.5 w-3.5" />
                <span>{isMY ? 'Re-order Items' : 'Pesan Ulang (Beli Lagi)'}</span>
              </Button>
            )}
          </div>
        )}

        {order.status === 'shipped' && (
          <Button
            onClick={onConfirmDelivery}
            className="w-full py-3 text-xs uppercase tracking-widest font-semibold"
          >
            {isMY ? 'Confirm Order Received' : 'Konfirmasi Penerimaan Barang'}
          </Button>
        )}

        {order.status === 'completed' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center text-xs text-green-700 bg-green-50 p-3 border border-green-200 rounded-xl">
              <HandDrawnIcon name="check-circle" className="h-4 w-4 mr-2 shrink-0" />
              <span>{isMY ? 'Order completed. Thank you for shopping with Benangbaju!' : 'Pesanan selesai. Terima kasih telah berbelanja di Benangbaju!'}</span>
            </div>

            {isMalaysia ? (
              <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2.5 text-xs text-amber-950 font-sans">
                <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-amber-900">
                  <HandDrawnIcon name="sparkles" className="h-3.5 w-3.5 text-amber-700" />
                  <span>{isMY ? 'International Order (Final Sale)' : 'Pesanan Internasional (Final Sale)'}</span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  {isMY ? 'Orders delivered to Malaysia are final sale and not eligible for self-service returns. If you received a defective item or wrong order, please contact Customer Care via WhatsApp.' : 'Pesanan pengiriman ke Malaysia bersifat final dan tidak dapat mengajukan retur mandiri. Jika Anda menerima barang yang cacat produksi atau pesanan tidak sesuai, hubungi Customer Care melalui WhatsApp.'}
                </p>
                <a
                  href={buildWhatsAppUrl(
                    '6285179747449',
                    `Halo Benangbaju, saya ingin konfirmasi terkait pesanan #${order.order_number} (Malaysia).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs gap-1.5"
                >
                  <HandDrawnIcon name="sparkles" className="h-4 w-4" />
                  <span>{isMY ? 'Contact Support via WhatsApp' : 'Hubungi CS via WhatsApp'}</span>
                </a>
              </div>
            ) : returnRequest ? (
              <div className="p-3.5 bg-brand-cream/90 border border-brand-gold/80 rounded-xl flex items-center justify-between shadow-2xs">
                <span className="text-[11px] font-bold text-brand-plum uppercase tracking-wider flex items-center gap-1.5">
                  <HandDrawnIcon name="refresh" className="h-3.5 w-3.5 text-brand-plum" />
                  {returnRequest.status === 'pending'
                    ? 'Retur Sedang Diproses'
                    : returnRequest.status === 'approved'
                      ? 'Retur Disetujui'
                      : returnRequest.status === 'completed'
                        ? 'Retur Selesai'
                        : 'Retur Ditolak'}
                </span>
                <Link
                  href={`/pesanan/${order.order_number}/retur`}
                  className="text-[10px] font-bold uppercase tracking-wider text-brand-plum hover:text-brand-blue underline underline-offset-2 transition"
                >
                  Detail Retur
                </Link>
              </div>
            ) : (
              <Link href={`/pesanan/${order.order_number}/retur`} className="w-full">
                <Button
                  variant="outline"
                  className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-neutral-800 text-neutral-800 hover:bg-neutral-50"
                >
                  {isMY ? 'Request Return' : 'Ajukan Retur Barang'}
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
