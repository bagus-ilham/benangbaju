'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/modules/users/stores/authStore'
import {
  useOrdersList,
  useCancelOrder,
  useConfirmDelivery,
  useGeneratePaymentToken,
} from '@/modules/orders/hooks/useOrders'
import { lazyCancelExpiredOrdersAction } from '@/modules/orders/actions'
import {
  Button,
  AuthLoading,
  EmptyState,
  PageContainer,
  PageHero,
  Modal,
} from '@/shared/components'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { OrderCard } from './components/OrderCard'
import { useMidtransScript } from '@/shared/hooks/useMidtransScript'

const STATUS_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending_payment', label: 'Menunggu Pembayaran' },
  { id: 'processing', label: 'Diproses' },
  { id: 'shipped', label: 'Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
]

export default function PesananPage(): React.JSX.Element {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [cancelOrderInfo, setCancelOrderInfo] = useState<{ id: string; number: string } | null>(
    null
  )
  const [receiptOrderInfo, setReceiptOrderInfo] = useState<{ id: string; number: string } | null>(
    null
  )
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
      lazyCancelExpiredOrdersAction()
    }
  }, [user])

  // 3. Fetch Orders
  const {
    data: ordersResponse,
    isLoading: ordersLoading,
    refetch,
  } = useOrdersList(user?.id || '', activeTab, page, limit)

  const orders = Array.isArray(ordersResponse?.data) ? ordersResponse.data : []
  const totalCount = ordersResponse?.pagination?.total_count || 0
  const totalPages = Math.ceil(totalCount / limit)

  const cancelMutation = useCancelOrder()
  const confirmMutation = useConfirmDelivery()
  const generatePaymentTokenMutation = useGeneratePaymentToken()

  // Load Midtrans Snap.js Script dynamically
  useMidtransScript()

  // Reset page when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setPage(1)
  }

  // Handle Cancel Action
  const handleCancelOrder = (orderId: string, orderNumber: string) => {
    setCancelOrderInfo({ id: orderId, number: orderNumber })
  }

  const executeCancelOrder = async () => {
    if (!cancelOrderInfo) return
    try {
      await cancelMutation.mutateAsync({
        orderId: cancelOrderInfo.id,
        reason: 'Dibatalkan oleh customer',
      })
      toast.success('Pesanan berhasil dibatalkan')
      refetch()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal membatalkan pesanan'
      toast.error(errorMessage)
    } finally {
      setCancelOrderInfo(null)
    }
  }

  // Handle Confirm Receipt Action
  const handleConfirmDelivery = (orderId: string, orderNumber: string) => {
    setReceiptOrderInfo({ id: orderId, number: orderNumber })
  }

  const executeConfirmDelivery = async () => {
    if (!receiptOrderInfo) return
    try {
      await confirmMutation.mutateAsync(receiptOrderInfo.id)
      toast.success('Pesanan berhasil dikonfirmasi')
      refetch()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengkonfirmasi pesanan'
      toast.error(errorMessage)
    } finally {
      setReceiptOrderInfo(null)
    }
  }

  // Handle Pay Action (Retry Payment)
  const handlePayOrder = async (orderNumber: string) => {
    try {
      toast.loading('Membuka gerbang pembayaran...', { id: 'payment-loading' })
      const { token, redirect_url } = await generatePaymentTokenMutation.mutateAsync(orderNumber)
      toast.dismiss('payment-loading')

      // Delayed refetch to give webhook time to process
      const scheduleRefetches = () => {
        setTimeout(() => refetch(), 2000)
        setTimeout(() => refetch(), 5000)
        setTimeout(() => refetch(), 10000)
      }

      if (token) {
        if (window.snap) {
          window.snap.pay(token, {
            onSuccess: () => {
              toast.success('Pembayaran berhasil! Memverifikasi...')
              scheduleRefetches()
            },
            onPending: () => {
              toast('Menunggu pembayaran diselesaikan.', { icon: 'ℹ️' })
              scheduleRefetches()
            },
            onError: () => {
              toast.error('Pembayaran gagal! Coba lagi.')
            },
            onClose: () => {
              // User closed Snap popup — refetch in case payment was made
              scheduleRefetches()
            },
          })
        } else if (redirect_url) {
          window.location.href = redirect_url
        }
      } else {
        toast.error('Gagal memuat pembayaran. Coba lagi.')
      }
    } catch {
      toast.dismiss('payment-loading')
      toast.error('Gagal memproses pembayaran')
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
          <Link href="/akun" className="hover:text-neutral-900 transition">
            Akun Saya
          </Link>
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
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                onCancelOrder={handleCancelOrder}
                onPayOrder={handlePayOrder}
                onConfirmDelivery={handleConfirmDelivery}
              />
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

      {/* Modal Konfirmasi Batal */}
      <Modal
        isOpen={cancelOrderInfo !== null}
        onClose={() => setCancelOrderInfo(null)}
        title="Batalkan Pesanan"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-sm text-neutral-600">
            Apakah Anda yakin ingin membatalkan pesanan {cancelOrderInfo?.number}? Tindakan ini
            tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setCancelOrderInfo(null)}
              variant="outline"
              className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              Kembali
            </Button>
            <Button
              onClick={executeCancelOrder}
              isLoading={cancelMutation.isPending}
              disabled={cancelMutation.isPending}
              className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700"
            >
              Batalkan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Konfirmasi Penerimaan */}
      <Modal
        isOpen={receiptOrderInfo !== null}
        onClose={() => setReceiptOrderInfo(null)}
        title="Selesaikan Pesanan"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-sm text-neutral-600">
            Apakah Anda sudah menerima barang untuk pesanan {receiptOrderInfo?.number} dan yakin
            ingin menyelesaikannya?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setReceiptOrderInfo(null)}
              variant="outline"
              className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              Kembali
            </Button>
            <Button
              onClick={executeConfirmDelivery}
              isLoading={confirmMutation.isPending}
              disabled={confirmMutation.isPending}
              className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold"
            >
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
