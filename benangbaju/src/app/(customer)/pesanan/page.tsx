'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useOrdersList, useCancelOrder, useConfirmDelivery, useGeneratePaymentToken } from '@/hooks/useOrders'
import { lazyCancelExpiredOrders } from '@/services/orders'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Badge, AuthLoading, EmptyState, PageContainer, PageHero } from '@/components/shared'
import { ArrowLeft, Clock, Package, Truck, CheckCircle2, XCircle, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatIDR } from '@/lib/utils'

const supabase = createBrowserClient()

const STATUS_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending_payment', label: 'Menunggu Pembayaran' },
  { id: 'processing', label: 'Diproses' },
  { id: 'shipped', label: 'Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
]

export default function PesananPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 8

  // 1. Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/pesanan')
    }
  }, [isAuthenticated, authLoading, router])

  // 2. Trigger Lazy Cancellation of Expired Orders on Load
  useEffect(() => {
    if (user?.id) {
      lazyCancelExpiredOrders(supabase, user.id)
    }
  }, [user])

  // 3. Fetch Orders
  const { data, isLoading: ordersLoading, refetch } = useOrdersList(
    user?.id || '',
    activeTab,
    page,
    limit
  )

  const orders = data?.orders || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / limit)

  const cancelMutation = useCancelOrder()
  const confirmMutation = useConfirmDelivery()
  const generatePaymentTokenMutation = useGeneratePaymentToken()

  // Reset page when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setPage(1)
  }

  // Handle Cancel Action
  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (confirm(`Apakah Anda yakin ingin membatalkan pesanan ${orderNumber}?`)) {
      try {
        const res = await cancelMutation.mutateAsync({ orderId, reason: 'Dibatalkan oleh customer' })
        if (res.success) {
          toast.success('Pesanan berhasil dibatalkan')
          refetch()
        } else {
          toast.error(res.message || 'Gagal membatalkan pesanan')
        }
      } catch (err) {
        toast.error('Terjadi kesalahan saat membatalkan pesanan')
      }
    }
  }

  // Handle Confirm Receipt Action
  const handleConfirmDelivery = async (orderId: string, orderNumber: string) => {
    if (confirm(`Apakah Anda sudah menerima barang untuk pesanan ${orderNumber}?`)) {
      try {
        const res = await confirmMutation.mutateAsync(orderId)
        if (res.success) {
          toast.success('Pesanan berhasil diselesaikan!')
          refetch()
        } else {
          toast.error(res.message || 'Gagal menyelesaikan pesanan')
        }
      } catch (err) {
        toast.error('Terjadi kesalahan saat menyelesaikan pesanan')
      }
    }
  }

  // Handle Pay Action (Retry Payment)
  const handlePayOrder = async (orderNumber: string) => {
    try {
      toast.loading('Membuka gerbang pembayaran...', { id: 'payment-loading' })
      const paymentRes = await generatePaymentTokenMutation.mutateAsync(orderNumber)
      toast.dismiss('payment-loading')

      if (!paymentRes.success || !paymentRes.token) {
        toast.error(paymentRes.message || 'Gagal memuat pembayaran. Coba lagi.')
        return
      }

      if ((window as any).snap) {
        (window as any).snap.pay(paymentRes.token, {
          onSuccess: () => {
            toast.success('Pembayaran berhasil!')
            refetch()
          },
          onPending: () => {
            toast('Menunggu pembayaran diselesaikan.', { icon: 'ℹ️' })
            refetch()
          },
          onError: () => {
            toast.error('Pembayaran gagal! Coba lagi.')
          },
        })
      } else {
        if (paymentRes.redirect_url) {
          window.location.href = paymentRes.redirect_url
        }
      }
    } catch (err) {
      toast.dismiss('payment-loading')
      toast.error('Gagal memproses pembayaran')
    }
  }

  // Get status details
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-amber-800 bg-amber-50 border border-amber-200 animate-pulse-glow">
            <Clock size={12} className="mr-1" /> Menunggu Pembayaran
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-blue-800 bg-blue-50 border border-blue-200">
            <Package size={12} className="mr-1" /> Diproses
          </span>
        )
      case 'shipped':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-indigo-800 bg-indigo-50 border border-indigo-200">
            <Truck size={12} className="mr-1" /> Dikirim
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-green-800 bg-green-50 border border-green-200">
            <CheckCircle2 size={12} className="mr-1" /> Selesai
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 text-neutral-500 bg-neutral-50 border border-neutral-200">
            <XCircle size={12} className="mr-1" /> Dibatalkan
          </span>
        )
      default:
        return null
    }
  }

  if (authLoading || !isAuthenticated) {
    return <AuthLoading message="Memuat riwayat..." />
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Akun Saya"
        title="Riwayat Pesanan"
        subtitle="Lacak pengiriman dan riwayat pembelian produk Anda."
      />
      <PageContainer size="lg" className="py-10 page-content">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center space-x-2 text-xs uppercase tracking-wider text-neutral-400">
          <Link href="/akun" className="hover:text-neutral-900 transition">Akun Saya</Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">Pesanan Saya</span>
        </div>

        {/* Tab Filter */}
        <div className="flex border-b border-neutral-200 overflow-x-auto no-scrollbar mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition duration-150 -mb-[2px] ${
                activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Listing */}
        {ordersLoading ? (
          <div className="space-y-4">
            <div className="h-44 skeleton-shimmer border border-neutral-200 rounded-none" />
            <div className="h-44 skeleton-shimmer border border-neutral-200 rounded-none" />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="border border-neutral-200 p-5 sm:p-6 bg-white hover:border-neutral-400 transition duration-200 rounded-none hover:shadow-sm"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-neutral-100 mb-4 text-sm gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-neutral-900">
                      No. Pesanan:{' '}
                      <Link href={`/pesanan/${order.order_number}`} className="underline hover:text-neutral-600">
                        {order.order_number}
                      </Link>
                    </p>
                    <p className="text-xs text-neutral-400">
                      Tanggal: {new Date(order.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Items preview */}
                <div className="space-y-3 mb-5">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="min-w-0 pr-4">
                        <p className="font-medium text-neutral-800 truncate">
                          {item.product_name} - {item.variant_name}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {item.quantity} x {formatIDR(item.price)}
                        </p>
                      </div>
                      <span className="font-semibold text-neutral-900 whitespace-nowrap">
                        {formatIDR(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total amount & Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-neutral-100 gap-4">
                  <div className="text-sm">
                    <span className="text-neutral-500">Total Pembayaran:</span>{' '}
                    <span className="font-bold text-neutral-900 text-base">
                      {formatIDR(order.total_amount)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/pesanan/${order.order_number}`}>
                      <Button variant="outline" className="text-xs py-2 px-4 uppercase font-semibold">
                        Lihat Detail
                      </Button>
                    </Link>

                    {order.status === 'pending_payment' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleCancelOrder(order.id, order.order_number)}
                          className="text-xs py-2 px-4 uppercase font-semibold border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                        >
                          Batalkan
                        </Button>
                        <Button
                          onClick={() => handlePayOrder(order.order_number)}
                          className="text-xs py-2 px-4 uppercase font-semibold"
                        >
                          Bayar Sekarang
                        </Button>
                      </>
                    )}

                    {order.status === 'shipped' && (
                      <Button
                        onClick={() => handleConfirmDelivery(order.id, order.order_number)}
                        className="text-xs py-2 px-4 uppercase font-semibold"
                      >
                        Selesai (Terima Barang)
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 pt-4">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="text-xs uppercase font-semibold py-2 px-4"
                >
                  Sebelumnya
                </Button>
                <span className="px-4 py-2 text-xs text-neutral-500 font-semibold flex items-center">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="text-xs uppercase font-semibold py-2 px-4"
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="Belum Ada Pesanan"
            description="Belum ada pesanan dengan status ini."
            action={{ label: 'Belanja Sekarang', href: '/produk' }}
          />
        )}

        <div className="mt-12 pt-6 border-t border-neutral-100">
          <Link
            href="/akun"
            className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-neutral-600 hover:text-neutral-950 transition duration-100"
          >
            <ArrowLeft size={14} className="mr-2" /> Kembali ke Akun
          </Link>
        </div>
      </PageContainer>
    </div>
  )
}
