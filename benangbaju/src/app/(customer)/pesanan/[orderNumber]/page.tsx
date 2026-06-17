'use client'

import React, { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useOrderDetail, useCancelOrder, useConfirmDelivery, useGeneratePaymentToken } from '@/hooks/useOrders'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { ArrowLeft, Clock, Package, Truck, CheckCircle2, XCircle, Download, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const supabase = createBrowserClient()

interface OrderDetailPageProps {
  params: Promise<{
    orderNumber: string
  }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderNumber } = use(params)
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false)

  // 1. Fetch Order Details
  const { data: order, isLoading: orderLoading, refetch } = useOrderDetail(orderNumber)

  const cancelMutation = useCancelOrder()
  const confirmMutation = useConfirmDelivery()
  const generatePaymentTokenMutation = useGeneratePaymentToken()

  // Handle Cancel Action
  const handleCancelOrder = async () => {
    if (!order) return
    if (confirm(`Apakah Anda yakin ingin membatalkan pesanan ini?`)) {
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
      }
    }
  }

  // Handle Confirm Receipt Action
  const handleConfirmDelivery = async () => {
    if (!order) return
    if (confirm(`Apakah Anda sudah menerima barang untuk pesanan ini?`)) {
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
      }
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
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-none">
          <XCircle size={18} />
          <div>
            <p className="font-bold uppercase tracking-wider text-xs">Pesanan Dibatalkan</p>
            {order?.cancel_reason && <p className="font-normal text-red-600 mt-1">Alasan: {order.cancel_reason}</p>}
          </div>
        </div>
      )
    }

    return (
      <div className="border border-neutral-200 p-5 bg-neutral-50/50 rounded-none">
        <p className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-6">Status Pesanan</p>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
          {steps.map((step, idx) => {
            const isCompleted = idx <= statusIndex
            const isActive = idx === statusIndex

            return (
              <div key={step.id} className="flex md:flex-col items-center flex-1 w-full relative z-10">
                {/* Step circle */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition duration-200 ${
                    isCompleted
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'bg-white border-neutral-200 text-neutral-400'
                  } ${isActive ? 'ring-4 ring-neutral-100' : ''}`}
                >
                  {step.icon}
                </div>

                {/* Step label */}
                <span
                  className={`ml-4 md:ml-0 md:mt-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                    isActive ? 'text-neutral-900 font-bold' : isCompleted ? 'text-neutral-700' : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>

                {/* Progress bar line (horizontal desktop, skip last) */}
                {idx < steps.length - 1 && (
                  <div
                    className={`hidden md:block absolute top-4 left-[50%] right-[-50%] h-[2px] transition duration-200 -z-10 ${
                      idx < statusIndex ? 'bg-neutral-900' : 'bg-neutral-200'
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
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
        <p className="text-neutral-400 text-sm tracking-widest uppercase animate-pulse">Memuat pesanan...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white py-16 px-4 flex flex-col items-center justify-center font-sans text-center">
        <AlertCircle size={40} className="text-red-500 mb-4 animate-bounce" />
        <h1 className="text-xl font-serif text-neutral-800 mb-2">Pesanan Tidak Ditemukan</h1>
        <p className="text-neutral-500 text-sm mb-6">Tautan tidak valid atau data telah dihapus.</p>
        <Link href="/pesanan">
          <Button className="text-xs uppercase font-semibold">Kembali ke Daftar Pesanan</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-neutral-400">
            <Link href="/akun" className="hover:text-neutral-900 transition">Akun Saya</Link>
            <span>/</span>
            <Link href="/pesanan" className="hover:text-neutral-900 transition">Pesanan Saya</Link>
            <span>/</span>
            <span className="text-neutral-900 font-semibold">{order.order_number}</span>
          </div>

          <Link
            href="/pesanan"
            className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-neutral-600 hover:text-neutral-950 transition"
          >
            <ArrowLeft size={13} className="mr-1" /> Kembali
          </Link>
        </div>

        {/* Header Title block */}
        <div className="border-b border-neutral-100 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-neutral-900 mb-1">
              Detail Pesanan
            </h1>
            <p className="text-xs text-neutral-400">
              No. Pesanan: <span className="font-semibold text-neutral-700">{order.order_number}</span> | Tanggal:{' '}
              {new Date(order.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Action invoice download */}
          {order.status !== 'pending_payment' && order.status !== 'cancelled' && (
            <Button
              onClick={handleDownloadInvoice}
              variant="outline"
              isLoading={isInvoiceLoading}
              className="flex items-center text-xs uppercase tracking-wider font-bold py-2.5 px-4"
            >
              <Download size={14} className="mr-2" /> Unduh Invoice
            </Button>
          )}
        </div>

        {/* Timeline Status */}
        {renderTimeline(order.status)}

        {/* Grid: Delivery details & Price breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shipping & Payment Info */}
          <div className="space-y-6">
            <div className="border border-neutral-200 p-5 rounded-none space-y-4">
              <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-400 border-b border-neutral-100 pb-2">
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
              <div className="border border-neutral-200 p-5 rounded-none bg-stone-50/50 space-y-2">
                <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400">Catatan dari Anda</h3>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Pricing Breakdowns */}
          <div className="border border-neutral-200 p-5 rounded-none h-fit space-y-5">
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-400 border-b border-neutral-100 pb-2">
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
              <div className="flex justify-between items-center text-neutral-900 font-serif border-t border-neutral-100 pt-4 mt-2">
                <span className="text-sm font-semibold">Total Pembayaran</span>
                <span className="text-lg font-bold">Rp {order.total_amount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Status-specific triggers */}
            <div className="pt-2 flex flex-col gap-2">
              {order.status === 'pending_payment' && (
                <>
                  <Button
                    onClick={handlePayOrder}
                    className="w-full py-3 text-xs uppercase tracking-widest font-semibold"
                  >
                    Bayar Sekarang
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    variant="outline"
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
        <div className="border border-neutral-200 p-5 sm:p-6 rounded-none space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-400 border-b border-neutral-100 pb-2">
            Item Pesanan
          </h2>
          <div className="divide-y divide-neutral-100">
            {order.order_items.map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between text-sm gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-800 truncate">{item.product_name}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Varian: {item.variant_name} | SKU: {item.sku}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="font-bold text-neutral-900">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
