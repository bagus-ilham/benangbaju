'use client'

import React, { use, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useOrderDetail, useCancelOrder, useConfirmDelivery, useGeneratePaymentToken, useCheckPaymentStatus } from '@/hooks/useOrders'
import { useSubmitReview } from '@/hooks/useReviews'
import { createBrowserClient } from '@/lib/supabase/client'
import { AuthLoading } from '@/components/shared/AuthLoading'
import { Button, PageHero, PageContainer, EmptyState, Modal } from '@/components/shared'
import { ArrowLeft, Clock, Package, Truck, CheckCircle2, XCircle, Download, AlertCircle, Loader2, Image as ImageIcon, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { uploadImage } from '@/lib/supabase/storage'

const supabase = createBrowserClient()

interface OrderDetailPageProps {
  params: Promise<{
    orderNumber: string
  }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) : React.JSX.Element | null {
  const { orderNumber } = use(params)
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const searchParams = useSearchParams()
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [receiptConfirmOpen, setReceiptConfirmOpen] = useState(false)
  const [selectedReviewItem, setSelectedReviewItem] = useState<any | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewAnonymous, setReviewAnonymous] = useState(false)
  const [reviewFiles, setReviewFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(() => searchParams.get('verifying') === '1')
  const verifyTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  const hasTriggeredVerification = useRef(false)

  // 1. Fetch Order Details
  const { data: order, isLoading: orderLoading, refetch } = useOrderDetail(orderNumber, user?.id)

  const [formattedDate, setFormattedDate] = useState('')

  useEffect(() => {
    if (order?.created_at) {
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
        if (result.success && result.order_status && result.order_status !== 'pending_payment') {
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
          toast('Verifikasi otomatis selesai. Jika pembayaran belum terupdate, silakan gunakan tombol cek manual.', { icon: 'ℹ️' })
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
      
      if (result.success && result.order_status) {
        if (result.order_status !== 'pending_payment') {
          toast.success('Pembayaran terverifikasi! Status pesanan diperbarui.')
        } else {
          toast('Pembayaran belum diterima/diproses. Silakan coba sesaat lagi.', { icon: 'ℹ️' })
        }
      } else {
        toast.error(result.message || 'Gagal memverifikasi status pembayaran.')
      }
      refetch()
    } catch (err) {
      toast.dismiss('manual-check')
      toast.error('Terjadi kesalahan saat memverifikasi pembayaran')
    }
  }

  // Review handlers
  const handleOpenReviewModal = (item: any) => {
    setSelectedReviewItem(item)
    setReviewRating(5)
    setReviewTitle('')
    setReviewBody('')
    setReviewAnonymous(false)
    setReviewFiles([])
  }

  const handleCloseReviewModal = () => {
    setSelectedReviewItem(null)
    setReviewFiles([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      if (reviewFiles.length + selected.length > 2) {
        toast.error('Maksimal hanya 2 foto yang diperbolehkan')
        return
      }
      
      const validFiles = selected.filter(f => f.type.startsWith('image/'))
      if (validFiles.length !== selected.length) {
        toast.error('Hanya file gambar yang diperbolehkan')
      }
      
      const smallFiles = validFiles.filter(f => f.size <= 2 * 1024 * 1024)
      if (smallFiles.length !== validFiles.length) {
        toast.error('Ukuran maksimal per foto adalah 2MB')
      }

      setReviewFiles(prev => [...prev, ...smallFiles].slice(0, 2))
    }
  }

  const removeFile = (idx: number) => {
    setReviewFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReviewItem || !user?.id) return
    if (!reviewBody.trim()) {
      toast.error('Silakan isi ulasan Anda')
      return
    }

    try {
      let finalProductId = selectedReviewItem.product_id

      // If product_id is not directly on item, fetch it from variant
      if (!finalProductId && selectedReviewItem.variant_id) {
        const { data: variantData } = await supabase
          .from('product_variants')
          .select('product_id')
          .eq('id', selectedReviewItem.variant_id)
          .single()
        if (variantData) {
          finalProductId = variantData.product_id
        }
      }

      if (!finalProductId) {
        toast.error('Gagal memverifikasi informasi produk')
        return
      }

      setIsUploading(true)
      const mediaUrls: string[] = []
      
      try {
        for (const file of reviewFiles) {
          const url = await uploadImage(file, 'products')
          mediaUrls.push(url)
        }
      } catch (uploadErr: any) {
        toast.error(uploadErr.message || 'Gagal mengunggah foto review')
        setIsUploading(false)
        return
      }

      const res = await submitReviewMutation.mutateAsync({
        orderItemId: selectedReviewItem.id,
        productId: finalProductId,
        variantId: selectedReviewItem.variant_id || null,
        userId: user.id,
        rating: reviewRating,
        title: reviewTitle || undefined,
        body: reviewBody,
        isAnonymous: reviewAnonymous,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      })

      setIsUploading(false)

      if (res && res.id) {
        toast.success('Ulasan berhasil dikirim!')
        refetch()
        handleCloseReviewModal()
      } else {
        toast.error('Gagal mengirimkan ulasan')
      }
    } catch (err) {
      console.error(err)
      setIsUploading(false)
      toast.error('Terjadi kesalahan saat mengirimkan ulasan')
    }
  }

  // Load Midtrans Snap.js Script dynamically
  useEffect(() => {
    const snapScriptUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js'
    const existingScript = document.querySelector(`script[src="${snapScriptUrl}"]`)
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = snapScriptUrl
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

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
  const handleCancelOrder = () => {
    setCancelConfirmOpen(true)
  }

  const executeCancelOrder = async () => {
    if (!order) return
    try {
      const res = await cancelMutation.mutateAsync({ orderId: order.id, reason: 'Dibatalkan oleh customer' })
      if (res.success) {
        toast.success('Pesanan berhasil dibatalkan')
        refetch()
      } else {
        toast.error(res.message || 'Gagal membatalkan pesanan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat membatalkan pesanan')
    } finally {
      setCancelConfirmOpen(false)
    }
  }

  // Handle Confirm Receipt Action (open custom confirmation modal)
  const handleConfirmDelivery = () => {
    setReceiptConfirmOpen(true)
  }

  const executeConfirmDelivery = async () => {
    if (!order) return
    try {
      const res = await confirmMutation.mutateAsync(order.id)
      if (res.success) {
        toast.success('Pesanan berhasil diselesaikan!')
        refetch()
      } else {
        toast.error(res.message || 'Gagal menyelesaikan pesanan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menyelesaikan pesanan')
    } finally {
      setReceiptConfirmOpen(false)
    }
  }



  // Handle Pay Action (Retry Payment)
  const handlePayOrder = async () => {
    if (!order) return
    try {
      toast.loading('Membuka gerbang pembayaran...', { id: 'payment-loading' })
      const paymentRes = await generatePaymentTokenMutation.mutateAsync(order.order_number)
      toast.dismiss('payment-loading')

      if (!paymentRes.success || !paymentRes.token) {
        toast.error(paymentRes.message || 'Gagal memuat pembayaran. Coba lagi.')
        return
      }

      if (window.snap) {
        window.snap.pay(paymentRes.token, {
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

  // Helper: Status timeline renderer
  const renderTimeline = (status: string) => {
    const steps = [
      { id: 'pending_payment', label: 'Menunggu Pembayaran', icon: <Clock size={16} /> },
      { id: 'processing', label: 'Diproses', icon: <Package size={16} /> },
      { id: 'shipped', label: 'Dikirim', icon: <Truck size={16} /> },
      { id: 'completed', label: 'Selesai', icon: <CheckCircle2 size={16} /> },
    ]

    const statusIndex = steps.findIndex((step) => step.id === status)

    if (status === 'cancelled') {
      return (
      <div className="border border-error-border p-5 bg-error-bg card-hover-lift gold-border-hover">
        <p className="text-[10px] uppercase tracking-widest font-heading font-medium text-error mb-4">Status Pesanan</p>
        <div className="flex items-center space-x-3 text-error text-xs font-semibold">
          <XCircle size={18} />
          <div>
            <p className="font-bold uppercase tracking-wider text-xs">Pesanan Dibatalkan</p>
            {order?.cancel_reason && <p className="font-normal text-error/80 mt-1">Alasan: {order.cancel_reason}</p>}
          </div>
        </div>
      </div>
    )
    }

    return (
      <div className="border border-neutral-200 p-5 bg-brand-cream/30 card-hover-lift gold-border-hover">
        <p className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold mb-6">Status Pesanan</p>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
          {steps.map((step, idx) => {
            const isCompleted = idx <= statusIndex
            const isActive = idx === statusIndex

            return (
              <div key={step.id} className="flex md:flex-col items-center flex-1 w-full relative z-10">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition duration-200 ${
                    isCompleted
                      ? 'bg-brand-gold border-brand-gold text-white'
                      : 'bg-white border-neutral-200 text-neutral-400'
                  } ${isActive ? 'ring-4 ring-brand-gold/20' : ''}`}
                >
                  {step.icon}
                </div>

                <span
                  className={`ml-4 md:ml-0 md:mt-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                    isActive ? 'text-brand-gold font-bold' : isCompleted ? 'text-brand-black' : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>

                {idx < steps.length - 1 && (
                  <div
                    className={`hidden md:block absolute top-4 left-[50%] right-[-50%] h-[2px] transition duration-200 -z-10 ${
                      idx < statusIndex ? 'bg-brand-gold' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
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
        {renderTimeline(order.status)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="border border-neutral-200 p-5 card-hover-lift gold-border-hover bg-white space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
              <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold border-b border-neutral-100 pb-2">
                Informasi Pengiriman
              </h2>
              {order.order_shipping ? (
                <div className="text-sm space-y-2 text-neutral-600">
                  <p className="font-semibold text-neutral-800">
                    {order.order_shipping.recipient_name} ({order.order_shipping.phone})
                  </p>
                  <p>{order.order_shipping.full_address}</p>
                  <p className="text-xs text-neutral-500 font-medium">
                    {order.order_shipping.district_name}, {order.order_shipping.city_name},{' '}
                    {order.order_shipping.province_name} {order.order_shipping.postal_code}
                  </p>
                  <div className="pt-2 text-xs border-t border-neutral-100 mt-2 space-y-1 text-neutral-500">
                    <p>
                      Kurir:{' '}
                      <span className="font-semibold text-neutral-700 uppercase">
                        {order.order_shipping.courier_name}
                      </span>
                    </p>
                    {order.order_shipping.tracking_number && (
                      <p>
                        No. Resi:{' '}
                        <span className="font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 select-all">
                          {order.order_shipping.tracking_number}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500 italic">Data pengiriman tidak ditemukan.</p>
              )}
            </div>

            {/* Notes Section if exists */}
            {order.notes && (
              <div className="border border-neutral-200 p-5 card-hover-lift gold-border-hover bg-brand-cream/30 space-y-2">
                <h3 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold">Catatan dari Anda</h3>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Pricing Breakdowns */}
          <div className="border border-neutral-200 p-5 card-hover-lift gold-border-hover bg-white h-fit space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
            <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold border-b border-neutral-100 pb-2">
              Rincian Pembayaran
            </h2>
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-neutral-900">
                  Rp {order.subtotal.toLocaleString('id-ID')}
                </span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-neutral-800 font-semibold">
                  <span>Diskon Voucher</span>
                  <span className="text-red-600">- Rp {order.discount_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span className="font-semibold text-neutral-900">
                  Rp {order.shipping_cost.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center text-brand-black font-heading border-t border-neutral-100 pt-4 mt-2">
                <span className="text-sm font-semibold">Total Pembayaran</span>
                <span className="text-lg font-bold">Rp {order.total_amount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Status-specific triggers */}
            <div className="pt-2 flex flex-col gap-2">
              {order.status === 'pending_payment' && (
                <>
                  {isVerifyingPayment ? (
                    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Memverifikasi pembayaran...</span>
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={handlePayOrder}
                        isLoading={generatePaymentTokenMutation.isPending}
                        disabled={generatePaymentTokenMutation.isPending}
                        className="w-full py-3 text-xs uppercase tracking-widest font-semibold"
                      >
                        Bayar Sekarang
                      </Button>
                      <Button
                        onClick={handleManualCheckStatus}
                        isLoading={checkPaymentMutation.isPending}
                        disabled={checkPaymentMutation.isPending}
                        variant="outline"
                        className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      >
                        Cek Status Pembayaran
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={handleCancelOrder}
                    variant="outline"
                    disabled={isVerifyingPayment}
                    className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-red-200 text-red-500 hover:bg-red-50"
                  >
                    Batalkan Pesanan
                  </Button>
                </>
              )}

              {order.status === 'shipped' && (
                <Button
                  onClick={handleConfirmDelivery}
                  className="w-full py-3 text-xs uppercase tracking-widest font-semibold"
                >
                  Konfirmasi Penerimaan Barang
                </Button>
              )}

              {order.status === 'completed' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center text-xs text-green-700 bg-green-50 p-3 border border-green-200">
                    <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
                    <span>Pesanan selesai. Terima kasih telah berbelanja di Benangbaju!</span>
                  </div>
                  <Link href={`/pesanan/${order.order_number}/retur`} className="w-full">
                    <Button variant="outline" className="w-full py-3 text-xs uppercase tracking-widest font-semibold border-neutral-800 text-neutral-800 hover:bg-neutral-50">
                      Ajukan Retur Barang
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order items snapshots list */}
        <div className="border border-neutral-200 p-5 sm:p-6 card-hover-lift gold-border-hover bg-white space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
          <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold border-b border-neutral-100 pb-2">
            Item Pesanan
          </h2>
          <div className="divide-y divide-neutral-100">
            {order.order_items.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-800 truncate">{item.product_name}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Varian: {item.variant_name} | SKU: {item.sku}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                  </p>
                  {order.status === 'completed' && (
                    <div className="mt-2">
                      {item.product_reviews ? (
                        <div className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 border border-green-200 inline-block">
                          Ulasan Anda ({item.product_reviews.rating}⭐): "{item.product_reviews.body}"
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleOpenReviewModal(item)}
                          variant="outline"
                          className="text-[10px] py-1 px-3 h-fit uppercase tracking-wider font-semibold border-neutral-300 hover:bg-neutral-50"
                        >
                          Tulis Ulasan
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-left sm:text-right whitespace-nowrap">
                  <p className="font-bold text-neutral-900">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>

      {/* Modal Konfirmasi Batal */}
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

      {/* Modal Konfirmasi Penerimaan */}
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

      {/* Modal Tulis Ulasan */}
      <Modal
        isOpen={selectedReviewItem !== null}
        onClose={handleCloseReviewModal}
        title="Tulis Ulasan Produk"
        size="md"
      >
        {selectedReviewItem && (
          <form onSubmit={handleSubmitReview} className="space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-gold font-semibold mb-1">Nama Produk</p>
              <h4 className="text-sm font-semibold text-neutral-800 font-heading">
                {selectedReviewItem.product_name}
              </h4>
              {selectedReviewItem.variant_name && (
                <p className="text-xs text-neutral-500 mt-0.5">Varian: {selectedReviewItem.variant_name}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-2">
                Rating Produk
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <span className={`text-2xl ${star <= reviewRating ? 'text-amber-400' : 'text-neutral-200'}`}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
                Judul Ulasan (Opsional)
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Contoh: Kualitas sangat baik!"
                className="w-full border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
                Isi Ulasan
              </label>
              <textarea
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                rows={4}
                required
                placeholder="Tulis pendapat Anda tentang produk ini..."
                className="w-full border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-anonymous"
                checked={reviewAnonymous}
                onChange={(e) => setReviewAnonymous(e.target.checked)}
                className="rounded border-neutral-300 text-brand-gold focus:ring-brand-gold"
              />
              <label htmlFor="is-anonymous" className="text-xs text-neutral-600 select-none">
                Kirim sebagai Anonim (Sembunyikan nama Anda)
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
                Lampirkan Foto (Maks 2 Foto, 2MB/Foto)
              </label>
              
              <div className="flex flex-wrap gap-3">
                {reviewFiles.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 border border-neutral-200">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Preview ${idx}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                
                {reviewFiles.length < 2 && (
                  <label className="w-20 h-20 border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 hover:text-brand-gold hover:border-brand-gold cursor-pointer transition-colors">
                    <ImageIcon size={20} className="mb-1" />
                    <span className="text-[9px] uppercase tracking-wider font-semibold">Tambah</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={handleCloseReviewModal}
                variant="outline"
                className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              >
                Batal
              </Button>
              <Button
                type="submit"
                isLoading={submitReviewMutation.isPending || isUploading}
                disabled={submitReviewMutation.isPending || isUploading}
                className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold"
              >
                {isUploading ? 'Mengunggah...' : 'Kirim Ulasan'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
