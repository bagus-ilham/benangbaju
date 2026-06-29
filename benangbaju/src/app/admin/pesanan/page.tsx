'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useAdminOrders,
  useAdminReturnRequests,
  useAdminUpdateReturnRequest,
  useAdminUpdateOrderStatus,
} from '@/hooks/useAdmin'
import type { AdminReturnRequestListItem, AdminOrderListItem } from '@/services/orders'
import { Button, Input, Textarea, Modal, AdminPageHeader, TableSkeleton } from '@/components/shared'
import { Search, Eye, AlertTriangle, ShieldCheck, Truck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending_payment', label: 'Belum Bayar' },
  { id: 'processing', label: 'Diproses' },
  { id: 'shipped', label: 'Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Batal' },
  { id: 'returns', label: 'Pengajuan Retur' },
]

export default function AdminOrdersPage() : React.JSX.Element {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Queries
  const { data: ordersData, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders } = useAdminOrders(
    activeTab === 'returns' ? 'all' : activeTab,
    search,
    page,
    limit
  )
  const { data: returnsData = [], isLoading: returnsLoading, isError: returnsError, refetch: refetchReturns } = useAdminReturnRequests()

  const updateReturnMutation = useAdminUpdateReturnRequest()
  const updateOrderStatusMutation = useAdminUpdateOrderStatus()

  // Return request Modal control
  const [selectedReturn, setSelectedReturn] = useState<AdminReturnRequestListItem | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [refundAmount, setRefundAmount] = useState(0)

  // Quick Resi Modal control
  const [quickResiOrder, setQuickResiOrder] = useState<AdminOrderListItem | null>(null)
  const [quickResiNumber, setQuickResiNumber] = useState('')

  const handleOpenQuickResi = (order: AdminOrderListItem) => {
    setQuickResiOrder(order)
    setQuickResiNumber(order.order_shipping?.tracking_number || '')
  }

  const handleUpdateQuickResi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickResiOrder) return
    if (!quickResiNumber.trim()) {
      toast.error('Nomor resi tidak boleh kosong')
      return
    }

    toast.loading('Mengirim pesanan...', { id: 'quick-resi' })
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId: quickResiOrder.id,
        status: 'shipped',
        trackingNumber: quickResiNumber.trim()
      })
      toast.success('Resi diinput dan pesanan dikirim!', { id: 'quick-resi' })
      setQuickResiOrder(null)
      refetchOrders()
    } catch (err) {
      toast.error('Gagal menginput resi', { id: 'quick-resi' })
    }
  }

  const handleOpenReturnModal = (ret: AdminReturnRequestListItem) => {
    setSelectedReturn(ret)
    setAdminNotes(ret.admin_notes || '')
    setRefundAmount(ret.refund_amount || ret.orders?.total_amount || 0)
  }

  const handleUpdateReturnStatus = async (status: 'approved' | 'rejected' | 'completed') => {
    if (!selectedReturn) return
    
    toast.loading('Memperbarui status retur...', { id: 'update-return' })
    try {
      await updateReturnMutation.mutateAsync({
        requestId: selectedReturn.id,
        status,
        adminNotes: adminNotes.trim() || null,
        refundAmount: Number(refundAmount) || 0
      })
      toast.success('Status pengajuan retur berhasil diperbarui!', { id: 'update-return' })
      setSelectedReturn(null)
      refetchReturns()
      refetchOrders()
    } catch (err) {
      toast.error('Gagal memperbarui status retur', { id: 'update-return' })
    }
  }

  const orders = ordersData?.orders || []
  const totalCount = ordersData?.totalCount || 0
  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Manajemen Pesanan"
        subtitle="Pantau status transaksi, konfirmasi pembayaran, dan kelola retur."
      />

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 overflow-x-auto space-x-6 text-xs font-sans">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setPage(1)
            }}
            className={`pb-3 font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {tab.label}
            {tab.id === 'returns' && returnsData.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white font-bold px-1.5 py-0.5 text-[9px] rounded-full">
                {returnsData.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      {activeTab !== 'returns' && (
        <div className="flex bg-white border border-neutral-200 p-4 rounded-none items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 text-neutral-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Cari No. Pesanan atau nama penerima..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none transition"
              aria-label="Cari No. Pesanan atau nama penerima"
            />
          </div>
        </div>
      )}

      {/* Data Section */}
      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        {activeTab === 'returns' ? (
          // Returns Table
          returnsLoading ? (
            <div className="py-8 bg-white border border-neutral-200">
              <TableSkeleton columns={6} rows={3} />
            </div>
          ) : returnsError ? (
            <div className="py-24 text-center">
              <p className="text-red-500 text-xs font-semibold uppercase">Gagal memuat pengajuan retur</p>
              <Button onClick={() => refetchReturns()} variant="outline" className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block">
                Coba Lagi
              </Button>
            </div>
          ) : returnsData.length === 0 ? (
            <div className="py-24 text-center text-neutral-400 italic text-xs">
              Tidak ada pengajuan retur barang.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                    <th className="py-3 px-5">No. Pesanan</th>
                    <th className="py-3 px-4">Pengaju</th>
                    <th className="py-3 px-4">Alasan</th>
                    <th className="py-3 px-4 text-center">Rencana Pengembalian</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                  {returnsData.map((ret: AdminReturnRequestListItem) => (
                    <tr key={ret.id} className="hover:bg-neutral-50/20 transition">
                      <td className="py-4 px-5">
                        <span className="font-semibold text-neutral-900 block">{ret.orders?.order_number}</span>
                        <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                          Tgl Ajuan: {new Date(ret.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p>{ret.profiles?.name}</p>
                        <p className="text-[10px] text-neutral-400 font-normal">{ret.profiles?.email}</p>
                      </td>
                      <td className="py-4 px-4 text-neutral-600 truncate max-w-[200px]">
                        <span className="font-bold text-neutral-800">
                          {ret.reason === 'wrong_item'
                            ? 'Salah Produk'
                            : ret.reason === 'damaged_item'
                            ? 'Barang Rusak'
                            : ret.reason === 'missing_item'
                            ? 'Barang Kurang'
                            : ret.reason === 'not_as_described'
                            ? 'Tidak Sesuai Deskripsi'
                            : ret.reason === 'size_issue'
                            ? 'Salah Ukuran'
                            : 'Lainnya'}
                        </span>
                        {ret.customer_notes && <p className="text-[10px] text-neutral-400 truncate mt-0.5">{ret.customer_notes}</p>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <p className="font-bold">Rp {(ret.refund_amount || ret.orders?.total_amount || 0).toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-neutral-500 font-normal">{ret.refund_bank_name} - {ret.refund_account_number}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 ${
                          ret.status === 'completed'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : ret.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : ret.status === 'approved'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {ret.status === 'pending'
                            ? 'Menunggu'
                            : ret.status === 'approved'
                            ? 'Disetujui'
                            : ret.status === 'rejected'
                            ? 'Ditolak'
                            : 'Selesai'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Button
                          onClick={() => handleOpenReturnModal(ret)}
                          variant="outline"
                          className="text-xs uppercase py-2 px-3 border-neutral-200"
                        >
                          Periksa Retur
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // Orders Table
          ordersLoading ? (
            <div className="py-8 bg-white border border-neutral-200">
              <TableSkeleton columns={6} rows={5} />
            </div>
          ) : ordersError ? (
            <div className="py-24 text-center">
              <p className="text-red-500 text-xs font-semibold uppercase">Gagal memuat daftar pesanan</p>
              <Button onClick={() => refetchOrders()} variant="outline" className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block">
                Coba Lagi
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-24 text-center text-neutral-400 italic text-xs">
              Tidak ada pesanan ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                    <th className="py-3 px-5">No. Pesanan</th>
                    <th className="py-3 px-4">Penerima</th>
                    <th className="py-3 px-4 text-center">Total Belanja</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-50/20 transition duration-150">
                      <td className="py-4 px-5">
                        <span className="font-semibold text-neutral-900 block">{o.order_number}</span>
                        <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                          Tgl Beli: {new Date(o.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p>{o.order_shipping?.recipient_name || 'Pelanggan'}</p>
                        <p className="text-[10px] text-neutral-400 font-normal">{o.order_shipping?.courier_name} | {o.order_shipping?.phone}</p>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-neutral-900">
                        Rp {o.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 ${
                          o.status === 'completed'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : o.status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}>
                          {o.status === 'pending_payment'
                            ? 'Belum Bayar'
                            : o.status === 'processing'
                            ? 'Diproses'
                            : o.status === 'shipped'
                            ? 'Dikirim'
                            : o.status === 'completed'
                            ? 'Selesai'
                            : 'Batal'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right space-x-1 whitespace-nowrap">
                        {o.status === 'processing' && (
                          <Button 
                            onClick={() => handleOpenQuickResi(o)}
                            className="p-2 border-neutral-800 text-neutral-800 hover:bg-neutral-50 mr-1" 
                            variant="outline"
                            title="Input Resi & Kirim"
                          >
                            <Truck size={13} className="mr-1 inline" /> Kirim
                          </Button>
                        )}
                        <Link href={`/admin/pesanan/${o.order_number}`}>
                          <Button variant="outline" className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900">
                            <Eye size={13} className="mr-1 inline" /> Detail
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination (Skip for returns) */}
        {activeTab !== 'returns' && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-150 px-5 py-4 text-xs font-semibold text-neutral-500">
            <span>Menampilkan halaman {page} dari {totalPages}</span>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-2 border-neutral-200"
              >
                &larr;
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="p-2 border-neutral-200"
              >
                &rarr;
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Return Review Modal */}
      {selectedReturn && (
        <Modal
          isOpen={!!selectedReturn}
          onClose={() => setSelectedReturn(null)}
          title="Pemeriksaan Pengajuan Retur"
        >
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
                  <p className="text-neutral-600 mt-1 italic leading-relaxed">{selectedReturn.customer_notes}</p>
                </div>
              )}
              {selectedReturn.return_media && selectedReturn.return_media.length > 0 && (
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-[10px] uppercase font-bold text-neutral-400 mb-2">Bukti Foto Retur:</p>
                  <div className="flex gap-2">
                    {selectedReturn.return_media.map(media => (
                      <a 
                        key={media.id} 
                        href={media.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block w-16 h-16 border border-neutral-200 overflow-hidden hover:border-brand-gold transition-colors relative"
                      >
                        <Image src={media.url} alt="Bukti Retur" fill sizes="64px" className="object-cover" />
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
                      <p className="text-[10px] text-neutral-400">Varian: {item.order_items?.variant_name} | SKU: {item.order_items?.sku}</p>
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
              <p className="text-[10px] uppercase font-bold text-neutral-400">Rekening Tujuan Refund:</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-neutral-700">
                <p>Nama Bank: <span className="font-bold text-neutral-900">{selectedReturn.refund_bank_name}</span></p>
                <p>No. Rekening: <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 select-all">{selectedReturn.refund_account_number}</span></p>
                <p className="col-span-2">Nama Pemilik: <span className="font-bold text-neutral-900">{selectedReturn.refund_account_name}</span></p>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedReturn(null)}
              >
                Tutup
              </Button>
              {selectedReturn.status === 'pending' && (
                <>
                  <Button
                    type="button"
                    onClick={() => handleUpdateReturnStatus('rejected')}
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                  >
                    Tolak Retur
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleUpdateReturnStatus('approved')}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  >
                    Setujui Retur
                  </Button>
                </>
              )}
              {selectedReturn.status === 'approved' && (
                <Button
                  type="button"
                  onClick={() => handleUpdateReturnStatus('completed')}
                >
                  Konfirmasi Refund Selesai (Dana Dikirim)
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Resi Modal */}
      {quickResiOrder && (
        <Modal
          isOpen={!!quickResiOrder}
          onClose={() => setQuickResiOrder(null)}
          title="Input Resi & Kirim Pesanan"
          size="sm"
        >
          <form onSubmit={handleUpdateQuickResi} className="space-y-6 text-xs font-sans">
            <div className="bg-neutral-50/50 p-4 border border-neutral-200">
              <div className="flex justify-between mb-1">
                <span className="text-neutral-500 font-semibold uppercase tracking-wider">Pesanan</span>
                <span className="font-bold">{quickResiOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-semibold uppercase tracking-wider">Kurir</span>
                <span className="font-bold uppercase">{quickResiOrder.order_shipping?.courier_name}</span>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickResiOrder(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                isLoading={updateOrderStatusMutation.isPending}
              >
                Kirim Pesanan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
