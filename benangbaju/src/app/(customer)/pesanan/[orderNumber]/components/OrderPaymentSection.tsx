'use client'

import React, { useState } from 'react'
import { Button, SmartLink as Link, HandDrawnIcon } from '@/shared/components'
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
}: OrderPaymentSectionProps): React.JSX.Element {
  const [copiedCode, setCopiedCode] = useState(false)

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

  return (
    <div className="border border-neutral-200/80 p-5 bg-brand-cream h-fit space-y-5 relative overflow-hidden rounded-2xl shadow-xs font-sans">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold via-amber-200 to-brand-gold" />
      <h2 className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum border-b border-neutral-200/60 pb-2">
        Rincian & Metode Pembayaran
      </h2>

      {/* Cost Breakdown */}
      <div className="space-y-3 text-sm text-neutral-600">
        <div className="flex justify-between">
          <span>Subtotal Produk</span>
          <span className="font-bold text-brand-plum">
            Rp {order.subtotal?.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Ongkos Kirim</span>
          <span className="font-bold text-brand-plum">
            Rp {order.shipping_cost?.toLocaleString('id-ID')}
          </span>
        </div>
        {Number(order.payment_fee) > 0 && (
          <div className="flex justify-between">
            <span>Biaya Layanan Pembayaran</span>
            <span className="font-bold text-brand-plum">
              Rp {Number(order.payment_fee).toLocaleString('id-ID')}
            </span>
          </div>
        )}
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-neutral-800 font-bold">
            <span>Diskon Voucher</span>
            <span className="text-red-600">
              - Rp {order.discount_amount.toLocaleString('id-ID')}
            </span>
          </div>
        )}
        {order.payment_channel && (
          <div className="flex justify-between text-xs text-neutral-500 pt-1">
            <span>Metode Bayar</span>
            <span className="font-semibold text-brand-plum uppercase">{order.payment_channel.replace('_', ' ')}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-brand-plum font-sans border-t border-neutral-200/60 pt-4 mt-2">
          <span className="text-sm font-bold">Total Pembayaran</span>
          <span className="text-lg font-bold text-brand-plum">
            Rp {order.total_amount?.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Direct Payment Instructions for Pending Payment */}
      {order.status === 'pending_payment' && (
        <div className="space-y-4 pt-2 border-t border-neutral-200/60">
          {/* VA Instructions */}
          {vaNumber && (
            <div className="bg-white p-4 rounded-xl border border-brand-plum/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-widest">
                Nomor Virtual Account
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
                  {copiedCode ? 'Tersalin' : 'Salin VA'}
                </Button>
              </div>
              <p className="text-[10px] text-neutral-500 font-sans">
                Transfer melalui m-Banking atau ATM ke nomor Virtual Account di atas.
              </p>
            </div>
          )}

          {/* Minimarket Payment Code */}
          {paymentCode && !vaNumber && (
            <div className="bg-white p-4 rounded-xl border border-brand-plum/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-widest">
                Kode Pembayaran Minimarket
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
                  {copiedCode ? 'Tersalin' : 'Salin Kode'}
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
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-widest">
                Scan QRIS
              </span>
              <div className="relative w-48 h-48 mx-auto bg-neutral-50 border p-2 rounded-lg flex items-center justify-center">
                <img src={qrUrl} alt="Scan QRIS" className="w-full h-full object-contain" />
              </div>
              <p className="text-[10px] text-neutral-500 font-sans">
                Buka aplikasi bank atau e-wallet Anda (BCA, Mandiri, GoPay, OVO, DANA, dll) lalu scan kode di atas.
              </p>
            </div>
          )}

          {/* Online Payment / E-Wallet Notice */}
          {checkoutUrl && !qrUrl && !vaNumber && !paymentCode && (
            <div className="bg-white p-4 rounded-xl border border-brand-plum/20 text-center space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block tracking-widest">
                Sesi Pembayaran Online / E-Wallet
              </span>
              <p className="text-[11px] text-neutral-600 font-sans">
                Silakan klik tombol di bawah untuk melanjutkan pembayaran di portal pembayaran DOKU.
              </p>
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
                      <span>Buka Halaman Pembayaran</span>
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
                      <span>Minta Kode / Link Pembayaran</span>
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
                  Cek Status Pembayaran
                </Button>
              </>
            )}
            <Button
              onClick={onCancelOrder}
              variant="outline"
              disabled={isVerifyingPayment}
              className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
            >
              Batalkan Pesanan
            </Button>
            {onReorder && (
              <Button
                onClick={onReorder}
                variant="ghost"
                className="w-full py-2 text-[10px] font-sans font-semibold text-neutral-500 hover:text-brand-blue flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-200"
              >
                <HandDrawnIcon name="refresh" className="h-3 w-3" />
                <span>Sesi Expired? Pesan Ulang Produk Ini</span>
              </Button>
            )}
          </>
        )}

        {order.status === 'cancelled' && (
          <div className="space-y-3">
            <div className="flex items-center text-xs text-neutral-600 bg-neutral-100/70 p-3.5 border border-neutral-200 rounded-xl">
              <HandDrawnIcon name="close" className="h-4 w-4 mr-2 shrink-0 text-red-500" />
              <span>Pesanan ini telah dibatalkan atau sesi pembayaran telah kedaluwarsa.</span>
            </div>
            {onReorder && (
              <Button
                onClick={onReorder}
                variant="accent"
                className="w-full py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HandDrawnIcon name="refresh" className="h-3.5 w-3.5" />
                <span>Pesan Ulang (Beli Lagi)</span>
              </Button>
            )}
          </div>
        )}

        {order.status === 'shipped' && (
          <Button
            onClick={onConfirmDelivery}
            className="w-full py-3 text-xs uppercase tracking-widest font-semibold"
          >
            Konfirmasi Penerimaan Barang
          </Button>
        )}

        {order.status === 'completed' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center text-xs text-green-700 bg-green-50 p-3 border border-green-200 rounded-xl">
              <HandDrawnIcon name="check-circle" className="h-4 w-4 mr-2 shrink-0" />
              <span>Pesanan selesai. Terima kasih telah berbelanja di Benangbaju!</span>
            </div>
            {returnRequest ? (
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
                  Ajukan Retur Barang
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
