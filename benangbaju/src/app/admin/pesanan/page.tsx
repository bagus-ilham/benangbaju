'use client'

import React, { useState } from 'react'
import {
  useAdminOrders,
  useAdminReturnRequests,
  useAdminUpdateReturnRequest,
  useAdminUpdateOrderStatus,
} from '@/app/admin/hooks/useAdmin'
import type { AdminReturnRequestListItem, AdminOrderListItem } from '@/modules/orders/types'
import { Button, AdminPageHeader } from '@/shared/components'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  AdminOrdersTable,
  AdminReturnsTable,
  QuickResiModal,
  ReturnReviewModal,
} from './components'

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending_payment', label: 'Belum Bayar' },
  { id: 'processing', label: 'Diproses' },
  { id: 'shipped', label: 'Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Batal' },
  { id: 'returns', label: 'Pengajuan Retur' },
]

export default function AdminOrdersPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Queries
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useAdminOrders(activeTab === 'returns' ? 'all' : activeTab, search, page, limit)
  const {
    data: returnsDataResponse,
    isLoading: returnsLoading,
    isError: returnsError,
    refetch: refetchReturns,
  } = useAdminReturnRequests()
  const returnsData = returnsDataResponse?.success ? returnsDataResponse.data || [] : []

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
        trackingNumber: quickResiNumber.trim(),
      })
      toast.success('Resi diinput dan pesanan dikirim!', { id: 'quick-resi' })
      setQuickResiOrder(null)
      refetchOrders()
    } catch {
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
        refundAmount: Number(refundAmount) || 0,
      })
      toast.success('Status pengajuan retur berhasil diperbarui!', { id: 'update-return' })
      setSelectedReturn(null)
      refetchReturns()
      refetchOrders()
    } catch {
      toast.error('Gagal memperbarui status retur', { id: 'update-return' })
    }
  }

  const orders = ordersData?.success ? ordersData.data || [] : []
  const totalCount = ordersData?.success ? ordersData.pagination?.total_count || 0 : 0
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
                {
                  returnsData.filter((r: AdminReturnRequestListItem) => r.status === 'pending')
                    .length
                }
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
          <AdminReturnsTable
            returnsData={returnsData}
            isLoading={returnsLoading}
            isError={returnsError}
            onRefetch={refetchReturns}
            onOpenReturnModal={handleOpenReturnModal}
          />
        ) : (
          <AdminOrdersTable
            orders={orders}
            isLoading={ordersLoading}
            isError={ordersError}
            onRefetch={refetchOrders}
            onOpenQuickResi={handleOpenQuickResi}
          />
        )}

        {/* Pagination (Skip for returns) */}
        {activeTab !== 'returns' && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-150 px-5 py-4 text-xs font-semibold text-neutral-500">
            <span>
              Menampilkan halaman {page} dari {totalPages}
            </span>
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

      <ReturnReviewModal
        selectedReturn={selectedReturn}
        onClose={() => setSelectedReturn(null)}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        adminNotes={adminNotes}
        setAdminNotes={setAdminNotes}
        onUpdateStatus={handleUpdateReturnStatus}
      />

      <QuickResiModal
        order={quickResiOrder}
        quickResiNumber={quickResiNumber}
        setQuickResiNumber={setQuickResiNumber}
        onClose={() => setQuickResiOrder(null)}
        onSubmit={handleUpdateQuickResi}
        isSubmitting={updateOrderStatusMutation.isPending}
      />
    </div>
  )
}
