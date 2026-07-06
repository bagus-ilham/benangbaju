'use client'

import React from 'react'
import Image from 'next/image'
import { Button, Input, Textarea, Modal } from '@/shared/components'
import type { AdminOrderListItem, AdminReturnRequestListItem } from '@/modules/orders/types'

interface QuickResiModalProps {
  order: AdminOrderListItem | null
  quickResiNumber: string
  setQuickResiNumber: (val: string) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
}

export function QuickResiModal({
  order,
  quickResiNumber,
  setQuickResiNumber,
  onClose,
  onSubmit,
  isSubmitting,
}: QuickResiModalProps) {
  if (!order) return null

  return (
    <Modal isOpen={!!order} onClose={onClose} title="Input Resi & Kirim Pesanan" size="sm">
      <form onSubmit={onSubmit} className="space-y-6 text-xs font-sans">
        <div className="bg-neutral-50/50 p-4 border border-neutral-200">
          <div className="flex justify-between mb-1">
            <span className="text-neutral-500 font-semibold uppercase tracking-wider">Pesanan</span>
            <span className="font-bold">{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 font-semibold uppercase tracking-wider">Kurir</span>
            <span className="font-bold uppercase">{order.order_shipping?.courier_name}</span>
          </div>
        </div>

        <Input
          label="Nomor Resi Pengiriman*"
          value={quickResiNumber}
          onChange={(e) => setQuickResiNumber(e.target.value)}
          placeholder="Masukkan no resi dari kurir..."
          required
        />

        <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Kirim Pesanan
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface ReturnReviewModalProps {
  selectedReturn: AdminReturnRequestListItem | null
  onClose: () => void
  refundAmount: number
  setRefundAmount: (val: number) => void
  adminNotes: string
  setAdminNotes: (val: string) => void
  onUpdateStatus: (status: 'approved' | 'rejected' | 'completed') => void
}

export function ReturnReviewModal({
  selectedReturn,
  onClose,
  refundAmount,
  setRefundAmount,
  adminNotes,
  setAdminNotes,
  onUpdateStatus,
}: ReturnReviewModalProps) {
  if (!selectedReturn) return null

  return (
    <Modal isOpen={!!selectedReturn} onClose={onClose} title="Pemeriksaan Pengajuan Retur">
      <div className="space-y-6 text-xs font-sans">
        {/* Info Summary */}
        <div className="border border-neutral-200 p-4 space-y-2.5 bg-neutral-50/30 rounded-none">
          <div className="flex justify-between font-semibold">
            <span>No. Pesanan:</span>
            <span className="text-neutral-900">{selectedReturn.orders?.order_number}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Status Saat Ini:</span>
            <span className="uppercase text-amber-700">{selectedReturn.status}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Alasan Retur:</span>
            <span className="text-neutral-800">
              {selectedReturn.reason === 'wrong_item'
                ? 'Salah Produk'
                : selectedReturn.reason === 'damaged_item'
                  ? 'Barang Rusak'
                  : selectedReturn.reason === 'missing_item'
                    ? 'Barang Kurang'
                    : selectedReturn.reason === 'not_as_described'
                      ? 'Tidak Sesuai Deskripsi'
                      : selectedReturn.reason === 'size_issue'
                        ? 'Salah Ukuran'
                        : 'Lainnya'}
            </span>
          </div>
          {selectedReturn.customer_notes && (
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-[10px] uppercase font-bold text-neutral-400">Catatan Pelanggan:</p>
              <p className="text-neutral-600 mt-1 italic leading-relaxed">
                {selectedReturn.customer_notes}
              </p>
            </div>
          )}
          {selectedReturn.return_media && selectedReturn.return_media.length > 0 && (
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-[10px] uppercase font-bold text-neutral-400 mb-2">
                Bukti Foto Retur:
              </p>
              <div className="flex gap-2">
                {selectedReturn.return_media.map((media) => (
                  <a
                    key={media.id}
                    href={media.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-16 h-16 border border-neutral-200 overflow-hidden hover:border-brand-gold transition-colors relative"
                  >
                    <Image
                      src={media.url}
                      alt="Bukti Retur"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Return Items List */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-neutral-400">Daftar Item Retur:</p>
          <div className="border border-neutral-200 divide-y divide-neutral-100 p-3 bg-white max-h-36 overflow-y-auto rounded-none">
            {selectedReturn.return_items?.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-center text-[11px]">
                <div>
                  <p className="font-semibold text-neutral-800">{item.order_items?.product_name}</p>
                  <p className="text-[10px] text-neutral-400">
                    Varian: {item.order_items?.variant_name} | SKU: {item.order_items?.sku}
                  </p>
                </div>
                <div className="text-right font-bold text-neutral-900">
                  Jumlah Retur: {item.quantity} pcs
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refund Bank Details */}
        <div className="border border-neutral-200 p-4 space-y-2.5 bg-neutral-50/20 rounded-none">
          <p className="text-[10px] uppercase font-bold text-neutral-400">
            Rekening Tujuan Refund:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-neutral-700">
            <p>
              Nama Bank:{' '}
              <span className="font-bold text-neutral-900">{selectedReturn.refund_bank_name}</span>
            </p>
            <p>
              No. Rekening:{' '}
              <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 select-all">
                {selectedReturn.refund_account_number}
              </span>
            </p>
            <p className="col-span-2">
              Nama Pemilik:{' '}
              <span className="font-bold text-neutral-900">
                {selectedReturn.refund_account_name}
              </span>
            </p>
          </div>
        </div>

        {/* Inputs: refund amount & admin notes */}
        {selectedReturn.status === 'pending' || selectedReturn.status === 'approved' ? (
          <div className="space-y-4 pt-2 border-t border-neutral-100">
            <Input
              label="Jumlah Refund (Rupiah)*"
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              required
            />

            <div className="space-y-1">
              <Textarea
                label="Catatan Internal Admin (Alasan tolak/setuju)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tulis catatan admin..."
                rows={3}
              />
            </div>
          </div>
        ) : (
          selectedReturn.admin_notes && (
            <div className="p-3 bg-neutral-100 text-neutral-600 rounded-none">
              <span className="font-bold text-neutral-700 block">Catatan Admin:</span>
              <span className="italic mt-1 block">{selectedReturn.admin_notes}</span>
            </div>
          )
        )}

        {/* Buttons depending on current status */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
          {selectedReturn.status === 'pending' && (
            <>
              <Button
                type="button"
                onClick={() => onUpdateStatus('rejected')}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                Tolak Retur
              </Button>
              <Button
                type="button"
                onClick={() => onUpdateStatus('approved')}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                Setujui Retur
              </Button>
            </>
          )}
          {selectedReturn.status === 'approved' && (
            <Button type="button" onClick={() => onUpdateStatus('completed')}>
              Konfirmasi Refund Selesai (Dana Dikirim)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
