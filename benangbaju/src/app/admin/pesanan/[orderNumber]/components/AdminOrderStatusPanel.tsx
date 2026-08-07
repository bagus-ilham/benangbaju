import React from 'react'
import { AdminPanel, Button, Input, HandDrawnIcon } from '@/shared/components'

interface AdminOrderStatusPanelProps {
  status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  trackingNumber: string
  setTrackingNumber: (val: string) => void
  handleUpdateStatus: (
    status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  ) => void
}

export function AdminOrderStatusPanel({
  status,
  trackingNumber,
  setTrackingNumber,
  handleUpdateStatus,
}: AdminOrderStatusPanelProps): React.JSX.Element {
  return (
    <AdminPanel title="Status Alur Kerja">
      <div className="flex items-center space-x-2 text-sm text-neutral-800 font-bold uppercase tracking-wider">
        {status === 'pending_payment' && <HandDrawnIcon name="clock" className="h-4 w-4" />}
        {status === 'processing' && <HandDrawnIcon name="package" className="h-4 w-4" />}
        {status === 'shipped' && <HandDrawnIcon name="truck" className="h-4 w-4" />}
        {status === 'completed' && <HandDrawnIcon name="check-circle" className="h-4 w-4" />}
        {status === 'cancelled' && <HandDrawnIcon name="close" className="h-4 w-4" />}
        <span>
          {status === 'pending_payment'
            ? 'Belum Bayar'
            : status === 'processing'
              ? 'Diproses'
              : status === 'shipped'
                ? 'Dikirim'
                : status === 'completed'
                  ? 'Selesai'
                  : 'Batal'}
        </span>
      </div>

      {/* Logical action workflow buttons */}
      <div className="space-y-2 pt-2 border-t border-neutral-100 mt-4">
        {status === 'pending_payment' && (
          <>
            <Button
              onClick={() => handleUpdateStatus('processing')}
              className="w-full py-3 text-[10px] uppercase tracking-wider font-bold"
            >
              Konfirmasi Pembayaran Manual
            </Button>
            <Button
              onClick={() => handleUpdateStatus('cancelled')}
              variant="outline"
              className="w-full py-3 text-[10px] uppercase tracking-wider font-bold border-red-150 text-red-500 hover:bg-red-50"
            >
              Batalkan Transaksi
            </Button>
          </>
        )}

        {status === 'processing' && (
          <div className="space-y-4 mt-2">
            <Input
              label="Nomor Resi Pengiriman (Aksi Kirim)*"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Masukkan no resi kurir..."
            />
            <Button
              onClick={() => handleUpdateStatus('shipped')}
              className="w-full py-3 text-[10px] uppercase tracking-wider font-bold"
            >
              Kirim & Input Resi
            </Button>
            <Button
              onClick={() => handleUpdateStatus('cancelled')}
              variant="outline"
              className="w-full py-3 text-[10px] uppercase tracking-wider font-bold border-red-150 text-red-500 hover:bg-red-50"
            >
              Batalkan Transaksi
            </Button>
          </div>
        )}

        {status === 'shipped' && (
          <Button
            onClick={() => handleUpdateStatus('completed')}
            className="w-full py-3 text-[10px] uppercase tracking-wider font-bold mt-2"
          >
            Tandai Selesai (Diterima)
          </Button>
        )}

        {status === 'completed' && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold select-none rounded-2xl text-center mt-2">
            Transaksi Selesai.
          </div>
        )}

        {status === 'cancelled' && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold select-none rounded-2xl text-center mt-2">
            Pesanan Dibatalkan.
          </div>
        )}
      </div>
    </AdminPanel>
  )
}
