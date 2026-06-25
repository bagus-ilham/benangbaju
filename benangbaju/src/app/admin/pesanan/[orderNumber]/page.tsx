'use client'

import React, { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrderDetail } from '@/hooks/useOrders'
import { useAdminUpdateOrderStatus, useAdminUpdateTrackingNumber } from '@/hooks/useAdmin'
import { Button, Input, AdminPageHeader, AdminPanel } from '@/components/shared'
import { createBrowserClient } from '@/lib/supabase/client'
import { ArrowLeft, Clock, Package, Truck, CheckCircle, XCircle, FileText, Download, Edit2, X, Check } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const supabase = createBrowserClient()

interface AdminOrderDetailPageProps {
  params: Promise<{
    orderNumber: string
  }>
}

function AdminOrderDetailContent({ params }: AdminOrderDetailPageProps) : React.JSX.Element {
  const { orderNumber } = use(params)
  const router = useRouter()

  const { data: order, isLoading, isError, refetch } = useOrderDetail(orderNumber)
  const updateStatusMutation = useAdminUpdateOrderStatus()
  const updateTrackingMutation = useAdminUpdateTrackingNumber()

  const [trackingNumber, setTrackingNumber] = useState('')
  const [isEditingResi, setIsEditingResi] = useState(false)
  const [editResiNumber, setEditResiNumber] = useState('')
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false)
  const [formattedDate, setFormattedDate] = useState('')

  useEffect(() => {
    if (order?.created_at) {
      setFormattedDate(
        new Date(order.created_at).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    }
  }, [order?.created_at])

  const handleUpdateStatus = async (status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled') => {
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
          trackingNumber: status === 'shipped' ? trackingNumber.trim() : undefined
        })
        toast.success('Status pesanan berhasil diubah', { id: 'status-update' })
        refetch()
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal mengubah status'
        toast.error(errorMessage, { id: 'status-update' })
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
        trackingNumber: editResiNumber.trim()
      })
      toast.success('Resi berhasil diperbarui', { id: 'resi-update' })
      setIsEditingResi(false)
      refetch()
    } catch (err: unknown) {
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
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat detail pesanan...</p>
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
            <Button variant="outline" className="p-2 border-neutral-200 text-neutral-500 hover:text-neutral-900">
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

          <AdminPanel title="Alamat Pengiriman">
            {order.order_shipping ? (
              <div className="text-sm space-y-2 text-neutral-600 font-medium">
                <p className="font-bold text-neutral-800">
                  {order.order_shipping.recipient_name} ({order.order_shipping.phone})
                </p>
                <p className="leading-relaxed">{order.order_shipping.full_address}</p>
                <p className="text-xs text-neutral-500">
                  Kecamatan {order.order_shipping.district_name}, {order.order_shipping.city_name}, {order.order_shipping.province_name} {order.order_shipping.postal_code}
                </p>
                <div className="pt-2 border-t border-neutral-100 mt-2 space-y-1 text-neutral-500 text-xs">
                  <p>Kurir: <span className="font-bold text-neutral-700 uppercase">{order.order_shipping.courier_name}</span></p>
                  {order.order_shipping.tracking_number && (
                    <div className="flex items-center gap-2">
                      <p>No. Resi: </p>
                      {isEditingResi ? (
                        <div className="flex items-center gap-1">
                          <input 
                            type="text" 
                            value={editResiNumber}
                            onChange={(e) => setEditResiNumber(e.target.value)}
                            className="border border-neutral-300 px-2 py-0.5 text-xs focus:outline-none focus:border-brand-gold w-32"
                            autoFocus
                          />
                          <button onClick={handleUpdateResi} disabled={updateTrackingMutation.isPending} className="text-green-600 hover:text-green-700 p-0.5" title="Simpan">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setIsEditingResi(false)} className="text-red-500 hover:text-red-600 p-0.5" title="Batal">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 select-all">
                            {order.order_shipping.tracking_number}
                          </span>
                          <button 
                            onClick={() => {
                              setEditResiNumber(order.order_shipping!.tracking_number!)
                              setIsEditingResi(true)
                            }} 
                            className="text-neutral-400 hover:text-brand-gold transition"
                            title="Edit Resi"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">Data pengiriman tidak ditemukan.</p>
            )}
          </AdminPanel>

          {order.notes && (
            <AdminPanel title="Catatan Pelanggan" className="bg-brand-cream/20">
              <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
            </AdminPanel>
          )}
        </div>

        <div className="space-y-8">
          <AdminPanel title="Status Alur Kerja">
            <div className="flex items-center space-x-2 text-sm text-neutral-800 font-bold uppercase tracking-wider">
              {order.status === 'pending_payment' && <Clock size={16} className="text-amber-500" />}
              {order.status === 'processing' && <Package size={16} className="text-neutral-800" />}
              {order.status === 'shipped' && <Truck size={16} className="text-neutral-800" />}
              {order.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
              {order.status === 'cancelled' && <XCircle size={16} className="text-red-500" />}
              <span>
                {order.status === 'pending_payment'
                  ? 'Belum Bayar'
                  : order.status === 'processing'
                  ? 'Diproses'
                  : order.status === 'shipped'
                  ? 'Dikirim'
                  : order.status === 'completed'
                  ? 'Selesai'
                  : 'Batal'}
              </span>
            </div>

            {/* Logical action workflow buttons */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              {order.status === 'pending_payment' && (
                <>
                  <Button
                    onClick={() => handleUpdateStatus('processing')}
                    className="w-full py-3 text-[10px] uppercase tracking-wider font-bold"
                  >
                    Konfirmasi Pembayaran Manual
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus('cancelled')}
                    variant="outline"
                    className="w-full py-3 text-[10px] uppercase tracking-wider font-bold border-red-150 text-red-500 hover:bg-red-50"
                  >
                    Batalkan Transaksi
                  </Button>
                </>
              )}

              {order.status === 'processing' && (
                <div className="space-y-4">
                  <Input
                    label="Nomor Resi Pengiriman (Aksi Kirim)*"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Masukkan no resi kurir..."
                  />
                  <Button
                    onClick={() => handleUpdateStatus('shipped')}
                    className="w-full py-3 text-[10px] uppercase tracking-wider font-bold"
                  >
                    Kirim & Input Resi
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus('cancelled')}
                    variant="outline"
                    className="w-full py-3 text-[10px] uppercase tracking-wider font-bold border-red-150 text-red-500 hover:bg-red-50"
                  >
                    Batalkan Transaksi
                  </Button>
                </div>
              )}

              {order.status === 'shipped' && (
                <Button
                  onClick={() => handleUpdateStatus('completed')}
                  className="w-full py-3 text-[10px] uppercase tracking-wider font-bold"
                >
                  Tandai Selesai (Diterima)
                </Button>
              )}

              {order.status === 'completed' && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold select-none rounded-none text-center">
                  Transaksi Selesai.
                </div>
              )}

              {order.status === 'cancelled' && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold select-none rounded-none text-center">
                  Pesanan Dibatalkan.
                </div>
              )}
            </div>
          </AdminPanel>

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
                  <span className="text-red-600">- Rp {order.discount_amount.toLocaleString('id-ID')}</span>
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

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) : React.JSX.Element {
  return (
    <React.Suspense fallback={<div className="p-8 text-center">Memuat data pesanan...</div>}>
      <AdminOrderDetailContent params={params} />
    </React.Suspense>
  )
}
