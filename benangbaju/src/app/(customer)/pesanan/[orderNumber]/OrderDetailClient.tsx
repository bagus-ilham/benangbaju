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
import { Button, PageHero, PageContainer, EmptyState, Modal, HandDrawnIcon } from '@/shared/components'
import { OrderTrackingSection } from './components/OrderTrackingSection'
import { OrderReturnTrackingSection } from './components/OrderReturnTrackingSection'
import { OrderPaymentSection } from './components/OrderPaymentSection'
import { OrderItemsList } from './components/OrderItemsList'
import { OrderReviewModal } from './components/OrderReviewModal'
import { OrderShippingSection } from './components/OrderShippingSection'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { useDokuCheckoutScript } from '@/shared/hooks/useDokuCheckoutScript'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { useQuery } from '@tanstack/react-query'

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

  const addItem = useCartStore((state) => state.addItem)
  const setCartDrawerOpen = useCartStore((state) => state.setCartDrawerOpen)

  // Re-order handler
  const handleReorder = async () => {
    if (!order || !order.order_items || order.order_items.length === 0) return
    try {
      toast.loading('Menambahkan produk ke keranjang...', { id: 'reorder' })
      for (const item of order.order_items) {
        if (item.variant_id) {
          await addItem(
            {
              variantId: item.variant_id,
              productName: item.product_name || 'Produk',
              variantName: item.variant_name || 'Default',
              name: item.product_name || 'Produk',
              sku: item.sku || '',
              price: Number(item.price),
              comparePrice: null,
              imageUrl: null,
              slug: '',
              stock: item.quantity || 1,
            },
            item.quantity || 1
          )
        }
      }
      toast.success('Produk berhasil ditambahkan ke keranjang!', { id: 'reorder' })
      setCartDrawerOpen(true)
    } catch {
      toast.error('Gagal menambahkan ke keranjang.', { id: 'reorder' })
    }
  }

  // 1. Fetch Order Details
  const {
    data: orderResponse,
    isLoading: orderLoading,
    refetch,
  } = useOrderDetail(orderNumber, user?.id)
  const order = orderResponse?.data

  // Fetch return request if order exists
  const { data: returnRequest } = useQuery({
    queryKey: ['order-return-request', order?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('return_requests')
        .select('*')
        .eq('order_id', order!.id)
        .maybeSingle()
      return data
    },
    enabled: !!order?.id,
  })

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

  const checkPaymentMutationRef = useRef(checkPaymentMutation)
  useEffect(() => {
    checkPaymentMutationRef.current = checkPaymentMutation
  }, [checkPaymentMutation])

  // Start payment verification — actively check with Midtrans API in 3 attempts (3s, 10s, 25s)
  const startPaymentVerification = useCallback(() => {
    if (verifyTimeoutsRef.current.length > 0) return

    setIsVerifyingPayment(true)

    const doCheck = async (attempt: number) => {
      try {
        const result = await checkPaymentMutationRef.current.mutateAsync(orderNumber)
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
  }, [orderNumber, refetch])

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

  // Load DOKU Checkout Script dynamically
  useDokuCheckoutScript()

  // Trigger verification and auto payment launch if page is loaded after checkout
  useEffect(() => {
    const isAutoPay = searchParams.get('autoPay') === '1'
    const isVerifying = searchParams.get('verifying') === '1'

    if ((isAutoPay || isVerifying) && !hasTriggeredVerification.current && order) {
      hasTriggeredVerification.current = true

      // Clean up URL parameters to prevent looping or accidental re-trigger on reload
      const url = new URL(window.location.href)
      let needsReplace = false
      if (url.searchParams.has('verifying')) {
        url.searchParams.delete('verifying')
        needsReplace = true
      }
      if (url.searchParams.has('autoPay')) {
        url.searchParams.delete('autoPay')
        needsReplace = true
      }
      if (needsReplace) {
        window.history.replaceState({}, '', url.pathname + url.search)
      }

      startPaymentVerification()

      if (isAutoPay && order.status === 'pending_payment') {
        generatePaymentTokenMutation
          .mutateAsync(order.order_number)
          .then((res) => {
            const redirectUrl = res?.redirect_url
            if (redirectUrl) {
              const popup = window.open(redirectUrl, '_blank')
              if (!popup) {
                toast(
                  (t) => (
                    <div className="flex flex-col gap-2">
                      <span className="font-semibold text-xs text-brand-plum">Instruksi Pembayaran Siap</span>
                      <a
                        href={redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 bg-brand-gold text-brand-plum text-xs font-bold rounded-lg text-center shadow-xs hover:bg-amber-400"
                      >
                        Buka Halaman Pembayaran
                      </a>
                    </div>
                  ),
                  { duration: 10000, icon: '💳' }
                )
              }
            }
          })
          .catch((err) => {
            console.error('Error auto-generating payment token:', err)
          })
      }
    }
  }, [searchParams, order, startPaymentVerification, generatePaymentTokenMutation])

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
    const payWindow = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null
    try {
      toast.loading('Membuka gerbang pembayaran...', { id: 'payment-loading' })
      const { redirect_url } = await generatePaymentTokenMutation.mutateAsync(order.order_number)
      toast.dismiss('payment-loading')

      if (redirect_url) {
        if (payWindow) {
          payWindow.location.href = redirect_url
        } else {
          window.open(redirect_url, '_blank')
        }
      } else {
        if (payWindow) payWindow.close()
        toast.error('Gagal memuat pembayaran. Coba lagi.')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (payWindow) payWindow.close()
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

      const htmlContent = invoiceRes.data?.html
      if (htmlContent) {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.open()
          printWindow.document.write(htmlContent)
          printWindow.document.close()
        } else {
          toast.error('Pop-up terblokir browser. Harap izinkan pop-up.')
        }
      } else {
        const { data: urlData } = supabase.storage
          .from('invoices')
          .getPublicUrl(`${order.order_number}.html`)

        if (urlData?.publicUrl) {
          window.open(urlData.publicUrl, '_blank')
        } else {
          toast.error('Gagal menemukan tautan unduh invoice')
        }
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
      <div className="bg-brand-cream min-h-screen">
        <PageHero eyebrow="Pesanan" title="Detail Pesanan" variant="cream" />
        <PageContainer size="md" className="py-12 page-content">
          <EmptyState
            handDrawnIcon="alert-triangle"
            title="Pesanan Tidak Ditemukan"
            description="Tautan tidak valid atau data telah dihapus."
            action={{ label: 'Kembali ke Daftar Pesanan', href: '/pesanan' }}
          />
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow="Pesanan Saya"
        title="Detail Pesanan"
        subtitle={`No. ${order.order_number} · ${formattedDate || '...'}`}
      >
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <Link
            href="/pesanan"
            className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold text-neutral-600 hover:text-brand-plum transition"
          >
            <HandDrawnIcon name="arrow-left" className="w-3.5 h-3.5 mr-1" /> Kembali
          </Link>
          {order.status !== 'pending_payment' && order.status !== 'cancelled' && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleDownloadInvoice}
                variant="outline"
                isLoading={isInvoiceLoading}
                className="flex items-center text-[10px] uppercase tracking-wider font-bold py-2 px-4"
              >
                <HandDrawnIcon name="download" className="h-3.5 w-3.5 mr-2" /> Unduh Invoice
              </Button>
              <Button
                onClick={handleReorder}
                variant="accent"
                className="flex items-center text-[10px] uppercase tracking-wider font-bold py-2 px-4"
              >
                <HandDrawnIcon name="refresh" className="h-3.5 w-3.5 mr-1.5" /> Beli Lagi
              </Button>
            </div>
          )}
        </div>
      </PageHero>

      <PageContainer size="lg" className="py-10 page-content space-y-8">
        {searchParams.get('return_submitted') === '1' && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs">
            <div className="flex items-center space-x-2">
              <HandDrawnIcon name="check-circle" className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Pengajuan retur berhasil dikirim! Tim kami sedang meninjau pengajuan Anda.</span>
            </div>
          </div>
        )}

        <OrderTrackingSection status={order.status} cancelReason={order.cancel_reason} />

        <OrderReturnTrackingSection returnRequest={returnRequest} orderNumber={order.order_number} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <OrderShippingSection orderShipping={order.order_shipping} notes={order.notes} />

          <OrderPaymentSection
            order={order}
            returnRequest={returnRequest}
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
