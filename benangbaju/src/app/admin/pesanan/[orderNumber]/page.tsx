'use client'

import React, { use, useState } from 'react'

import { useOrderDetail } from '@/modules/orders/hooks/useOrders'
import {
  useAdminUpdateOrderStatus,
  useAdminUpdateTrackingNumber,
} from '@/modules/orders/hooks/useAdminOrders'

import { Button, AdminPageHeader, AdminPanel } from '@/shared/components'
import { createBrowserClient } from '@/lib/supabase/client'
import { ArrowLeft, Download } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { AdminOrderShippingPanel } from './components/AdminOrderShippingPanel'
import { AdminOrderStatusPanel } from './components/AdminOrderStatusPanel'

const supabase = createBrowserClient()

interface AdminOrderDetailPageProps {
  params: Promise<{
    orderNumber: string
  }>
}

function AdminOrderDetailContent({ params }: AdminOrderDetailPageProps): React.JSX.Element {
  const { orderNumber } = use(params)

  const { data: orderResponse, isLoading, isError, refetch } = useOrderDetail(orderNumber as string)
  const order = orderResponse?.data
  const updateStatusMutation = useAdminUpdateOrderStatus()
  const updateTrackingMutation = useAdminUpdateTrackingNumber()

  const [trackingNumber, setTrackingNumber] = useState('')
  const [isEditingResi, setIsEditingResi] = useState(false)
  const [editResiNumber, setEditResiNumber] = useState('')
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false)
  const formattedDate = order?.created_at
    ? new Date(order.created_at).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'

  const handleUpdateStatus = async (
    status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  ) => {
    if (!order) return

    if (status === 'shipped' && !trackingNumber.trim()) {
      toast.error('Harap masukkan nomor resi pengiriman')
      return
    }

    if (confirm(`Apakah Anda yakin ingin mengubah status pesanan ke ${status}?`)) {
      toast.loading('Mengubah status pesanan...', { id: 'status-update' })
      try {
        await updateStatusMutation.mutateAsync({
          orderId: order.id,
          status,
          trackingNumber: status === 'shipped' ? trackingNumber.trim() : undefined,
        })
        toast.success('Status pesanan berhasil diubah', { id: 'status-update' })
        refetch()
      } catch {
        toast.error('Gagal mengubah status', { id: 'status-update' })
      }
    }
  }

  const handleUpdateResi = async () => {
    if (!order) return
    if (!editResiNumber.trim()) {
      toast.error('Nomor resi tidak boleh kosong')
      return
    }

    toast.loading('Menyimpan resi...', { id: 'resi-update' })
    try {
      await updateTrackingMutation.mutateAsync({
        orderId: order.id,
        trackingNumber: editResiNumber.trim(),
      })
      toast.success('Resi berhasil diperbarui', { id: 'resi-update' })
      setIsEditingResi(false)
      refetch()
    } catch {
      toast.error('Gagal memperbarui resi', { id: 'resi-update' })
    }
  }

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
      toast.error('Gagal mengunduh invoice')
    } finally {
      setIsInvoiceLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
          Memuat detail pesanan...
        </p>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-500 text-sm">Gagal memuat detail pesanan.</p>
        <Link href="/admin/pesanan">
          <Button variant="outline" className="text-xs uppercase border-neutral-200">
            <ArrowLeft size={13} className="mr-1 inline" /> Kembali ke Daftar
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans text-xs">
      <AdminPageHeader
        title={`Pesanan ${order.order_number}`}
        subtitle={formattedDate ? `Dibuat pada: ${formattedDate}` : 'Dibuat pada: ...'}
      >
        <div className="flex items-center gap-2">
          <Link href="/admin/pesanan">
            <Button
              variant="outline"
              className="p-2 border-neutral-200 text-neutral-500 hover:text-neutral-900"
            >
              <ArrowLeft size={14} />
            </Button>
          </Link>
          <Button
            onClick={handleDownloadInvoice}
            variant="outline"
            isLoading={isInvoiceLoading}
            className="text-[10px] font-bold uppercase py-2.5 px-4 border-neutral-800 text-neutral-800 hover:bg-neutral-50"
          >
            <Download size={13} className="mr-1.5" /> Unduh Invoice
          </Button>
        </div>
      </AdminPageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <AdminPanel title="Item Belanja">
            <div className="divide-y divide-neutral-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="py-3.5 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold text-neutral-800">{item.product_name}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Varian: {item.variant_name} | SKU: {item.sku}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="font-bold text-neutral-900 whitespace-nowrap">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminOrderShippingPanel
            orderShipping={order.order_shipping}
            isEditingResi={isEditingResi}
            editResiNumber={editResiNumber}
            setEditResiNumber={setEditResiNumber}
            setIsEditingResi={setIsEditingResi}
            handleUpdateResi={handleUpdateResi}
            isUpdatingTracking={updateTrackingMutation.isPending}
          />

          {order.notes && (
            <AdminPanel title="Catatan Pelanggan" className="bg-brand-cream/20">
              <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {order.notes}
              </p>
            </AdminPanel>
          )}
        </div>

        <div className="space-y-8">
          <AdminOrderStatusPanel
            status={order.status}
            trackingNumber={trackingNumber}
            setTrackingNumber={setTrackingNumber}
            handleUpdateStatus={handleUpdateStatus}
          />

          <AdminPanel title="Rincian Biaya">
            <div className="space-y-3 text-neutral-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-neutral-900">
                  Rp {order.subtotal.toLocaleString('id-ID')}
                </span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between font-semibold">
                  <span>Voucher Diskon</span>
                  <span className="text-red-600">
                    - Rp {order.discount_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span className="font-semibold text-neutral-900">
                  Rp {order.shipping_cost.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-900 border-t border-neutral-100 pt-3 mt-1.5 font-heading font-bold text-sm">
                <span>Total Bayar</span>
                <span className="text-base">Rp {order.total_amount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps): React.JSX.Element {
  return (
    <React.Suspense fallback={<div className="p-8 text-center">Memuat data pesanan...</div>}>
      <AdminOrderDetailContent params={params} />
    </React.Suspense>
  )
}
