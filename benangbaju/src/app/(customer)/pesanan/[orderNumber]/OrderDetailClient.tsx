'use client'

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/modules/users/stores/authStore'
import {
  useOrderDetail,
  useCancelOrder,
  useConfirmDelivery,
  useGeneratePaymentToken,
  useCheckPaymentStatus,
} from '@/modules/orders/hooks/useOrders'
import { useSubmitReview } from '@/modules/reviews/hooks/useReviews'
import { createBrowserClient } from '@/lib/supabase/client'
import { AuthLoading } from '@/shared/components/AuthLoading'
import { Button, PageHero, PageContainer, EmptyState, Modal } from '@/shared/components'
import { ArrowLeft, Download, AlertCircle } from 'lucide-react'
import { OrderTrackingSection } from './components/OrderTrackingSection'
import { OrderPaymentSection } from './components/OrderPaymentSection'
import { OrderItemsList } from './components/OrderItemsList'
import { OrderReviewModal } from './components/OrderReviewModal'
import { OrderShippingSection } from './components/OrderShippingSection'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { useMidtransScript } from '@/shared/hooks/useMidtransScript'

const supabase = createBrowserClient()

interface OrderDetailPageProps {
  params: {
    orderNumber: string
  }
}

function OrderDetailContent({ params }: OrderDetailPageProps): React.JSX.Element | null {
  const { orderNumber } = params
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const searchParams = useSearchParams()
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [receiptConfirmOpen, setReceiptConfirmOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedReviewItem, setSelectedReviewItem] = useState<any | null>(null)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(
    () => searchParams.get('verifying') === '1'
  )
  const verifyTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  const hasTriggeredVerification = useRef(false)

  // 1. Fetch Order Details
  const {
    data: orderResponse,
    isLoading: orderLoading,
    refetch,
  } = useOrderDetail(orderNumber, user?.id)
  const order = orderResponse?.data

  const [formattedDate, setFormattedDate] = useState('')

  useEffect(() => {
    if (order?.created_at) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormattedDate(
        new Date(order.created_at).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    }
  }, [order?.created_at])

  const cancelMutation = useCancelOrder()
  const confirmMutation = useConfirmDelivery()
  const generatePaymentTokenMutation = useGeneratePaymentToken()
  const checkPaymentMutation = useCheckPaymentStatus()
  const submitReviewMutation = useSubmitReview()

  // Start payment verification — actively check with Midtrans API in 3 attempts (3s, 10s, 25s)
  const startPaymentVerification = useCallback(() => {
    setIsVerifyingPayment(true)

    // Clear any existing timeouts first
    verifyTimeoutsRef.current.forEach(clearTimeout)
    verifyTimeoutsRef.current = []

    const doCheck = async (attempt: number) => {
      try {
        const result = await checkPaymentMutation.mutateAsync(orderNumber)
        if (result.order_status && result.order_status !== 'pending_payment') {
          setIsVerifyingPayment(false)
          refetch()
          toast.success('Pembayaran terverifikasi! Status pesanan diperbarui.')
          return true // Status updated
        }
      } catch (err) {
        console.error(`Error checking payment status on attempt ${attempt}:`, err)
      }
      refetch()
      return false
    }

    // Schedule 3 attempts: 3s, 10s, 25s
    const delays = [3000, 10000, 25000]

    delays.forEach((delay, index) => {
      const timeoutId = setTimeout(async () => {
        const done = await doCheck(index + 1)
        if (done) {
          verifyTimeoutsRef.current.forEach(clearTimeout)
          verifyTimeoutsRef.current = []
        } else if (index === delays.length - 1) {
          setIsVerifyingPayment(false)
          toast(
            'Verifikasi otomatis selesai. Jika pembayaran belum terupdate, silakan gunakan tombol cek manual.',
            { icon: 'ℹ️' }
          )
        }
      }, delay)
      verifyTimeoutsRef.current.push(timeoutId)
    })
  }, [orderNumber, checkPaymentMutation, refetch])

  // Handle Manual Status Check
  const handleManualCheckStatus = async () => {
    try {
      toast.loading('Mengecek status pembayaran...', { id: 'manual-check' })
      const result = await checkPaymentMutation.mutateAsync(orderNumber)
      toast.dismiss('manual-check')

      if (result.order_status) {
        if (result.order_status !== 'pending_payment') {
          toast.success('Pembayaran terverifikasi! Status pesanan diperbarui.')
        } else {
          toast('Pembayaran belum diterima/diproses. Silakan coba sesaat lagi.', { icon: 'ℹ️' })
        }
      }
      refetch()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.dismiss('manual-check')
      toast.error(err.message || 'Gagal memverifikasi status pembayaran')
    }
  }

  // Review handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenReviewModal = (item: any) => {
    setSelectedReviewItem(item)
  }

  const handleCloseReviewModal = () => {
    setSelectedReviewItem(null)
  }

  // Load Midtrans Snap.js Script dynamically
  useMidtransScript()

  // Trigger verification if page is loaded with verifying query param
  useEffect(() => {
    if (searchParams.get('verifying') === '1' && !hasTriggeredVerification.current) {
      hasTriggeredVerification.current = true

      // Clean up URL parameter to prevent looping or accidental re-trigger on reload
      const url = new URL(window.location.href)
      if (url.searchParams.has('verifying')) {
        url.searchParams.delete('verifying')
        window.history.replaceState({}, '', url.pathname + url.search)
      }

      startPaymentVerification()
    }
  }, [searchParams, startPaymentVerification])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      verifyTimeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  // Handle Cancel Action (open custom confirmation modal)

  const executeCancelOrder = async () => {
    if (!order) return
    try {
      await cancelMutation.mutateAsync({ orderId: order.id, reason: 'Dibatalkan oleh customer' })
      toast.success('Pesanan berhasil dibatalkan')
      refetch()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || 'Gagal membatalkan pesanan')
    } finally {
      setCancelConfirmOpen(false)
    }
  }

  // Handle Confirm Receipt Action (open custom confirmation modal)

  const executeConfirmDelivery = async () => {
    if (!order) return
    try {
      await confirmMutation.mutateAsync(order.id)
      toast.success('Pesanan berhasil diselesaikan!')
      refetch()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyelesaikan pesanan')
    } finally {
      setReceiptConfirmOpen(false)
    }
  }

  // Handle Pay Action (Retry Payment)
  const handlePayOrder = async () => {
    if (!order) return
    try {
      toast.loading('Membuka gerbang pembayaran...', { id: 'payment-loading' })
      const { token, redirect_url } = await generatePaymentTokenMutation.mutateAsync(
        order.order_number
      )
      toast.dismiss('payment-loading')

      if (token) {
        if (window.snap) {
          window.snap.pay(token, {
            onSuccess: () => {
              toast.success('Pembayaran berhasil! Memverifikasi...')
              startPaymentVerification()
            },
            onPending: () => {
              toast('Menunggu pembayaran diselesaikan.', { icon: 'ℹ️' })
              startPaymentVerification()
            },
            onError: () => {
              toast.error('Pembayaran gagal! Coba lagi.')
            },
            onClose: () => {
              // User closed Snap popup — start verifying in case payment was made
              startPaymentVerification()
            },
          })
        } else if (redirect_url) {
          window.location.href = redirect_url
        }
      } else {
        toast.error('Gagal memuat pembayaran. Coba lagi.')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.dismiss('payment-loading')
      toast.error(err.message || 'Gagal memproses pembayaran')
    }
  }

  // Handle Invoice Download
  const handleDownloadInvoice = async () => {
    if (!order) return
    setIsInvoiceLoading(true)
    try {
      const { data: invoiceRes, error } = await supabase.functions.invoke('generate-invoice', {
        body: { order_number: order.order_number },
      })

      if (error || !invoiceRes.success) {
        toast.error('Gagal menghasilkan invoice')
        return
      }

      // Resolve public storage URL
      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(`invoices/${order.order_number}.html`)

      if (urlData?.publicUrl) {
        window.open(urlData.publicUrl, '_blank')
      } else {
        toast.error('Gagal menemukan tautan unduh invoice')
      }
    } catch (err) {
      console.error(err)
      toast.error('Terjadi kesalahan saat mengunduh invoice')
    } finally {
      setIsInvoiceLoading(false)
    }
  }

  if (authLoading || orderLoading) {
    return <AuthLoading message="Memuat pesanan..." />
  }

  if (!isAuthenticated) {
    return null
  }

  if (!order) {
    return (
      <div className="bg-white min-h-screen">
        <PageHero eyebrow="Pesanan" title="Detail Pesanan" variant="cream" />
        <PageContainer size="md" className="py-12 page-content">
          <EmptyState
            icon={AlertCircle}
            title="Pesanan Tidak Ditemukan"
            description="Tautan tidak valid atau data telah dihapus."
            action={{ label: 'Kembali ke Daftar Pesanan', href: '/pesanan' }}
          />
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Pesanan Saya"
        title="Detail Pesanan"
        subtitle={`No. ${order.order_number} · ${formattedDate || '...'}`}
      >
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <Link
            href="/pesanan"
            className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-neutral-500 hover:text-brand-gold transition"
          >
            <ArrowLeft size={13} className="mr-1" /> Kembali
          </Link>
          {order.status !== 'pending_payment' && order.status !== 'cancelled' && (
            <Button
              onClick={handleDownloadInvoice}
              variant="outline"
              isLoading={isInvoiceLoading}
              className="flex items-center text-[10px] uppercase tracking-wider font-bold py-2 px-4"
            >
              <Download size={14} className="mr-2" /> Unduh Invoice
            </Button>
          )}
        </div>
      </PageHero>

      <PageContainer size="lg" className="py-10 page-content space-y-8">
        <OrderTrackingSection status={order.status} cancelReason={order.cancel_reason} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <OrderShippingSection orderShipping={order.order_shipping} notes={order.notes} />

          <OrderPaymentSection
            order={order}
            isVerifyingPayment={isVerifyingPayment}
            isGeneratingToken={generatePaymentTokenMutation.isPending}
            isCheckingPayment={checkPaymentMutation.isPending}
            onPayOrder={handlePayOrder}
            onCheckStatus={handleManualCheckStatus}
            onCancelOrder={() => setCancelConfirmOpen(true)}
            onConfirmDelivery={() => setReceiptConfirmOpen(true)}
          />
        </div>

        <OrderItemsList order={order} onOpenReviewModal={handleOpenReviewModal} />
      </PageContainer>

      <Modal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        title="Batalkan Pesanan"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-sm text-neutral-600">
            Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setCancelConfirmOpen(false)}
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

      <Modal
        isOpen={receiptConfirmOpen}
        onClose={() => setReceiptConfirmOpen(false)}
        title="Selesaikan Pesanan"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-sm text-neutral-600">
            Apakah Anda sudah menerima barang untuk pesanan ini dan yakin ingin menyelesaikannya?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setReceiptConfirmOpen(false)}
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

      <OrderReviewModal
        selectedReviewItem={selectedReviewItem}
        onClose={handleCloseReviewModal}
        user={user}
        submitReviewMutation={submitReviewMutation}
        refetch={refetch}
      />
    </div>
  )
}

export default function OrderDetailPage({ params }: OrderDetailPageProps): React.JSX.Element {
  return (
    <Suspense fallback={<AuthLoading message="Memuat pesanan..." />}>
      <OrderDetailContent params={params} />
    </Suspense>
  )
}
