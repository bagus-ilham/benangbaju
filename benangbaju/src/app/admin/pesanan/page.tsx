'use client'

import React, { useState } from 'react'
import {
  useAdminOrders,
  useAdminReturnRequests,
  useAdminUpdateReturnRequest,
  useAdminUpdateOrderStatus,
  useAdminSyncPayment,
} from '@/app/admin/hooks/useAdmin'
import type { AdminReturnRequestListItem, AdminOrderListItem } from '@/modules/orders/types'
import { Button, AdminPageHeader, HandDrawnIcon, Pagination, AdminSearchInput } from '@/shared/components'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
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
  const [countryFilter, setCountryFilter] = useState<'all' | 'ID' | 'MY'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Queries (now filtered server-side by countryFilter, with total pagination preserved)
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useAdminOrders(activeTab === 'returns' ? 'all' : activeTab, search, page, limit, countryFilter)
  const {
    data: returnsDataResponse,
    isLoading: returnsLoading,
    isError: returnsError,
    refetch: refetchReturns,
  } = useAdminReturnRequests()
  const returnsData = returnsDataResponse?.success ? returnsDataResponse.data || [] : []

  const updateReturnMutation = useAdminUpdateReturnRequest()
  const updateOrderStatusMutation = useAdminUpdateOrderStatus()
  const syncPaymentMutation = useAdminSyncPayment()
  const [syncingOrderNumber, setSyncingOrderNumber] = useState<string | null>(null)

  const handleSyncPayment = async (orderNumber: string) => {
    setSyncingOrderNumber(orderNumber)
    toast.loading(`Mengecek status pembayaran ${orderNumber}...`, { id: `sync-${orderNumber}` })
    try {
      const res = await syncPaymentMutation.mutateAsync(orderNumber)
      toast.dismiss(`sync-${orderNumber}`)
      if (res.order_status === 'processing' || res.order_status === 'completed') {
        toast.success(
          `Pembayaran ${orderNumber} terverifikasi! Status pesanan otomatis diubah menjadi Diproses.`,
          { id: `sync-${orderNumber}` }
        )
      } else if (res.order_status === 'cancelled' || res.order_status === 'expired') {
        toast('Sesi pembayaran telah kedaluwarsa atau dibatalkan.', {
          icon: '⚠️',
          id: `sync-${orderNumber}`,
        })
      } else {
        toast(res.message || 'Status di DOKU: Belum dibayar oleh customer.', {
          icon: 'ℹ️',
          id: `sync-${orderNumber}`,
        })
      }
      refetchOrders()
    } catch (err: any) {
      toast.dismiss(`sync-${orderNumber}`)
      toast.error(err.message || 'Gagal mengecek status pembayaran ke DOKU', {
        id: `sync-${orderNumber}`,
      })
    } finally {
      setSyncingOrderNumber(null)
    }
  }

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

  const rawOrders = ordersData?.success ? ordersData.data || [] : []
  const totalCount = ordersData?.success ? ordersData.pagination?.total_count || 0 : 0
  const totalPages = Math.ceil(totalCount / limit)
  const displayedOrders = rawOrders

  // Export CSV handler
  const handleExportCSV = () => {
    if (displayedOrders.length === 0) {
      toast.error('Tidak ada data pesanan untuk diekspor')
      return
    }

    const headers = [
      'No Pesanan',
      'Tanggal Beli',
      'Nama Penerima',
      'Negara Tujuan',
      'Nomor Telepon',
      'Provinsi/Negeri',
      'Kota/Bandar',
      'Kecamatan',
      'Kode Pos',
      'Alamat Lengkap',
      'Kurir',
      'No Resi',
      'Total Belanja IDR',
      'Status Pesanan',
    ]

    const rows = displayedOrders.map((o) => {
      const s = o.order_shipping
      const country = s?.country_code === 'MY' ? 'Malaysia' : 'Indonesia'
      return [
        `"${o.order_number}"`,
        `"${formatDate(o.created_at)}"`,
        `"${(s?.recipient_name || '').replace(/"/g, '""')}"`,
        `"${country}"`,
        `"${s?.phone || ''}"`,
        `"${(s?.province_name || '').replace(/"/g, '""')}"`,
        `"${(s?.city_name || '').replace(/"/g, '""')}"`,
        `"${(s?.district_name || '').replace(/"/g, '""')}"`,
        `"${s?.postal_code || ''}"`,
        `"${(s?.full_address || '').replace(/"/g, '""')}"`,
        `"${(s?.courier_name || '').replace(/"/g, '""')}"`,
        `"${(s?.tracking_number || '').replace(/"/g, '""')}"`,
        o.total_amount,
        `"${o.status}"`,
      ].join(',')
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `pesanan_${countryFilter}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('File CSV pesanan berhasil diunduh!')
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Manajemen Pesanan"
        subtitle="Pantau status transaksi domestik & ekspor Malaysia, konfirmasi pembayaran, dan kelola retur."
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              refetchOrders()
              refetchReturns()
            }}
            variant="outline"
            className="text-xs font-semibold py-2 px-3 border-neutral-200"
          >
            <HandDrawnIcon name="refresh" className="h-3.5 w-3.5 mr-1.5" /> Segarkan
          </Button>
          {activeTab !== 'returns' && (
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="text-xs font-semibold py-2 px-3 border-neutral-800 text-neutral-800 hover:bg-neutral-50"
            >
              <HandDrawnIcon name="download" className="h-3.5 w-3.5 mr-1.5" /> Export CSV
            </Button>
          )}
        </div>
      </AdminPageHeader>

      {/* Status Tabs */}
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

      {/* Toolbar: Search & Country Destination Filter */}
      {activeTab !== 'returns' && (
        <div className="flex flex-col sm:flex-row gap-3 bg-brand-cream border border-neutral-200 p-4 rounded-2xl sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <AdminSearchInput
              placeholder="Cari No. Pesanan atau nama penerima..."
              value={search}
              onChange={(val) => {
                setSearch(val)
                setPage(1)
              }}
            />
          </div>

          {/* Country Filter Toggle */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setCountryFilter('all')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                countryFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Semua Negara
            </button>
            <button
              onClick={() => {
                setCountryFilter('ID')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                countryFilter === 'ID'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>🇮🇩</span> Domestik (ID)
            </button>
            <button
              onClick={() => {
                setCountryFilter('MY')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                countryFilter === 'MY'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>🇲🇾</span> Ekspor (MY)
            </button>
          </div>
        </div>
      )}

      {/* Data Section */}
      <div className="border border-neutral-200 bg-brand-cream rounded-2xl overflow-hidden">
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
            orders={displayedOrders}
            isLoading={ordersLoading}
            isError={ordersError}
            onRefetch={refetchOrders}
            onOpenQuickResi={handleOpenQuickResi}
            onSyncPayment={handleSyncPayment}
            syncingOrderNumber={syncingOrderNumber}
          />
        )}

        {/* Pagination (Skip for returns) */}
        {activeTab !== 'returns' && totalPages > 1 && (
          <div className="border-t border-neutral-150 px-5 py-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              showInfo
              totalItems={totalCount}
            />
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
