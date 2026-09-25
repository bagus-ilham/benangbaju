import React from 'react'
import { AdminPanel, Button, HandDrawnIcon, OrderStatusBadge } from '@/shared/components'
import { formatIDR, formatDate } from '@/lib/utils'
import type { Order } from '@/modules/orders/types'

interface AdminOrderPaymentPanelProps {
  order: Order
  onSyncPayment: () => void
  isSyncing: boolean
}

export function AdminOrderPaymentPanel({
  order,
  onSyncPayment,
  isSyncing,
}: AdminOrderPaymentPanelProps): React.JSX.Element {
  const primaryPayment = order.payments && order.payments.length > 0 ? order.payments[0] : null
  const gatewayResponse = (primaryPayment as any)?.gateway_response

  // Extract payment details if available from DOKU response
  const dokuTransaction = gatewayResponse?.transaction
  const qrisInfo = gatewayResponse?.qris_payment
  const vaInfo = gatewayResponse?.virtual_account_info || gatewayResponse?.virtual_account_payment

  const payerName =
    qrisInfo?.payer_account_name ||
    vaInfo?.virtual_account_number ||
    dokuTransaction?.original_request_id ||
    null

  const payerIssuer = qrisInfo?.payer_account_issuer || vaInfo?.bank_name || null
  const referenceId = qrisInfo?.reference_id || vaInfo?.payment_code || null

  const isPaid =
    primaryPayment?.status === 'success' ||
    ['processing', 'shipped', 'completed'].includes(order.status)
  const isCancelled =
    primaryPayment?.status === 'failed' ||
    primaryPayment?.status === 'expired' ||
    order.status === 'cancelled'

  return (
    <AdminPanel title="Informasi Pembayaran">
      <div className="space-y-4 text-xs font-sans">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
          <span className="text-neutral-500">Status Pembayaran</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isPaid
                  ? 'bg-green-100 text-green-800'
                  : isCancelled
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isPaid
                ? 'Lunas / Berhasil'
                : isCancelled
                  ? 'Gagal / Batal'
                  : 'Menunggu Pembayaran'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-neutral-500">Metode / Kanal</span>
          <span className="font-semibold text-neutral-800 uppercase">
            {order.payment_channel || primaryPayment?.payment_channel || 'DOKU Checkout'}
          </span>
        </div>

        {order.payment_fee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Biaya Layanan Payment Gateway</span>
            <span className="font-medium text-neutral-700">{formatIDR(order.payment_fee)}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-neutral-500">Total Ditagihkan</span>
          <span className="font-bold text-neutral-900">{formatIDR(order.total_amount)}</span>
        </div>

        {primaryPayment?.paid_at && (
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Waktu Pembayaran</span>
            <span className="font-medium text-neutral-700">
              {formatDate(primaryPayment.paid_at)}
            </span>
          </div>
        )}

        {payerName && (
          <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-neutral-500">
            <div className="flex justify-between">
              <span>Pengirim / Akun:</span>
              <span className="font-semibold text-neutral-800">{payerName}</span>
            </div>
            {payerIssuer && (
              <div className="flex justify-between">
                <span>Penerbit / Bank:</span>
                <span className="font-semibold text-neutral-800">{payerIssuer}</span>
              </div>
            )}
            {referenceId && (
              <div className="flex justify-between">
                <span>Ref / Kode:</span>
                <span className="font-mono text-neutral-800">{referenceId}</span>
              </div>
            )}
          </div>
        )}

        {order.status === 'pending_payment' && (
          <div className="pt-3 border-t border-neutral-100">
            <Button
              onClick={onSyncPayment}
              isLoading={isSyncing}
              className="w-full py-2.5 text-[10px] uppercase font-bold tracking-wider bg-brand-plum text-white hover:bg-brand-plum/90 flex items-center justify-center gap-1.5"
            >
              <HandDrawnIcon name="refresh" className="h-3.5 w-3.5" /> Cek Status Pembayaran (DOKU)
            </Button>
            <p className="text-[10px] text-neutral-400 text-center mt-1.5">
              Klik untuk memeriksa apakah customer sudah transfer di sistem DOKU.
            </p>
          </div>
        )}
      </div>
    </AdminPanel>
  )
}
