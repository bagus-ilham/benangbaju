import React from 'react'
import { Button } from '@/shared/components'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'

interface OrderPaymentSectionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any
  isVerifyingPayment: boolean
  isGeneratingToken: boolean
  isCheckingPayment: boolean
  onPayOrder: () => void
  onCheckStatus: () => void
  onCancelOrder: () => void
  onConfirmDelivery: () => void
}

export function OrderPaymentSection({
  order,
  isVerifyingPayment,
  isGeneratingToken,
  isCheckingPayment,
  onPayOrder,
  onCheckStatus,
  onCancelOrder,
  onConfirmDelivery,
}: OrderPaymentSectionProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200 p-5 card-hover-lift gold-border-hover bg-white h-fit space-y-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
      <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold border-b border-neutral-100 pb-2">
        Rincian Pembayaran
      </h2>
      <div className="space-y-3 text-sm text-neutral-600">
        <div className="flex justify-between">
          <span>Subtotal Produk</span>
          <span className="font-semibold text-neutral-900">
            Rp {order.subtotal?.toLocaleString('id-ID')}
          </span>
        </div>
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-neutral-800 font-semibold">
            <span>Diskon Voucher</span>
            <span className="text-red-600">
              - Rp {order.discount_amount.toLocaleString('id-ID')}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Ongkos Kirim</span>
          <span className="font-semibold text-neutral-900">
            Rp {order.shipping_cost?.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between items-center text-brand-black font-heading border-t border-neutral-100 pt-4 mt-2">
          <span className="text-sm font-semibold">Total Pembayaran</span>
          <span className="text-lg font-bold">
            Rp {order.total_amount?.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-2">
        {order.status === 'pending_payment' && (
          <>
            {isVerifyingPayment ? (
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider">
                <Loader2 size={14} className="animate-spin" />
                <span>Memverifikasi pembayaran...</span>
              </div>
            ) : (
              <>
                <Button
                  onClick={onPayOrder}
                  isLoading={isGeneratingToken}
                  disabled={isGeneratingToken}
                  className="w-full py-3 text-xs uppercase tracking-widest font-semibold"
                >
                  Bayar Sekarang
                </Button>
                <Button
                  onClick={onCheckStatus}
                  isLoading={isCheckingPayment}
                  disabled={isCheckingPayment}
                  variant="outline"
                  className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                >
                  Cek Status Pembayaran
                </Button>
              </>
            )}
            <Button
              onClick={onCancelOrder}
              variant="outline"
              disabled={isVerifyingPayment}
              className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-red-200 text-red-500 hover:bg-red-50"
            >
              Batalkan Pesanan
            </Button>
          </>
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
            <div className="flex items-center text-xs text-green-700 bg-green-50 p-3 border border-green-200">
              <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
              <span>Pesanan selesai. Terima kasih telah berbelanja di Benangbaju!</span>
            </div>
            <Link href={`/pesanan/${order.order_number}/retur`} className="w-full">
              <Button
                variant="outline"
                className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-neutral-800 text-neutral-800 hover:bg-neutral-50"
              >
                Ajukan Retur Barang
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
