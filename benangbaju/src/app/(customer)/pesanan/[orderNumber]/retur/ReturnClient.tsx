'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/entities/user/model/authStore'
import { useOrderDetail } from '@/features/orders/hooks/useOrders'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  Button,
  Input,
  PageHero,
  PageContainer,
  EmptyState,
  AuthLoading,
  Select,
  Textarea,
} from '@/shared/components'
import { ArrowLeft, AlertTriangle, ShieldCheck, Image as ImageIcon, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { uploadImage } from '@/lib/supabase/storage'

const supabase = createBrowserClient()

const RETURN_REASONS = [
  { value: 'wrong_item', label: 'Salah Kirim Produk / Varian' },
  { value: 'damaged_item', label: 'Produk Rusak / Cacat' },
  { value: 'missing_item', label: 'Barang Kurang / Hilang' },
  { value: 'not_as_described', label: 'Produk Tidak Sesuai Deskripsi' },
  { value: 'size_issue', label: 'Ukuran Tidak Pas' },
  { value: 'other', label: 'Lainnya' },
]

interface ReturnPageProps {
  params: {
    orderNumber: string
  }
}

export default function ReturnPageClient({ params }: ReturnPageProps): React.JSX.Element | null {
  const { orderNumber } = params
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()

  // Form states
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('wrong_item')
  const [customerNotes, setCustomerNotes] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [returnFiles, setReturnFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/pesanan')
    }
  }, [isAuthenticated, authLoading, router])

  // 2. Fetch Order Details
  const { data: orderResponse, isLoading: orderLoading } = useOrderDetail(orderNumber, user?.id)
  const order = orderResponse?.data

  // 3. Check if order has existing return requests
  const { data: existingReturn, isLoading: checkReturnLoading } = useQuery({
    queryKey: ['order-return-request', order?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('return_requests')
        .select(
          'id, order_id, user_id, status, reason, customer_notes, admin_notes, refund_amount, refund_bank_name, refund_account_number, refund_account_name, refund_transferred_at, approved_at, rejected_at, completed_at, created_at, updated_at'
        )
        .eq('order_id', order!.id)
        .maybeSingle()
      return data
    },
    enabled: !!order?.id,
  })

  // Initialize checkboxes & quantities
  useEffect(() => {
    if (order?.order_items) {
      // Only initialize if we haven't set up the state yet to prevent resetting selections on background refetches
      if (Object.keys(selectedItems).length > 0) return

      const initialChecked: Record<string, boolean> = {}
      const initialQty: Record<string, number> = {}
      order.order_items.forEach((item) => {
        initialChecked[item.id] = false
        initialQty[item.id] = 1
      })
      setSelectedItems(initialChecked)
      setQuantities(initialQty)
    }
  }, [order, selectedItems])

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const handleQtyChange = (itemId: string, maxQty: number, val: number) => {
    const qty = Math.max(1, Math.min(val, maxQty))
    setQuantities((prev) => ({
      ...prev,
      [itemId]: qty,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files)

    // Validate max 2 files total
    if (returnFiles.length + newFiles.length > 2) {
      toast.error('Maksimal 2 foto retur diperbolehkan')
      return
    }

    // Validate size (max 2MB per file)
    const invalidFile = newFiles.find((f) => f.size > 2 * 1024 * 1024)
    if (invalidFile) {
      toast.error(`Ukuran file ${invalidFile.name} melebihi batas 2MB`)
      return
    }

    setReturnFiles((prev) => [...prev, ...newFiles])
  }

  const handleRemoveFile = (index: number) => {
    setReturnFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !order) return

    // Validate items selection
    const itemsToReturn = Object.keys(selectedItems).filter((key) => selectedItems[key])
    if (itemsToReturn.length === 0) {
      toast.error('Harap pilih minimal satu item yang ingin diretur')
      return
    }

    if (!bankName || !accountNumber || !accountName) {
      toast.error('Harap lengkapi detail rekening pengembalian dana')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Insert return request row
      const { data: returnReq, error: reqError } = await supabase
        .from('return_requests')
        .insert({
          order_id: order.id,
          user_id: user.id,
          reason: reason,
          customer_notes: customerNotes.trim() || null,
          refund_bank_name: bankName.trim(),
          refund_account_number: accountNumber.trim(),
          refund_account_name: accountName.trim(),
          status: 'pending',
        })
        .select('id')
        .single()

      if (reqError) throw reqError

      // 2. Insert return items rows
      const returnItemsData = itemsToReturn.map((itemId) => ({
        return_request_id: returnReq.id,
        order_item_id: itemId,
        quantity: quantities[itemId],
      }))

      const { error: itemsError } = await supabase.from('return_items').insert(returnItemsData)

      if (itemsError) throw itemsError

      // 3. Upload and insert return media
      if (returnFiles.length > 0) {
        toast.loading('Mengunggah foto bukti...', { id: 'return-media' })
        const mediaUrls: string[] = []
        for (const file of returnFiles) {
          try {
            // Upload to 'products' bucket to save quota/configuration
            const url = await uploadImage(file, 'products')
            if (url) mediaUrls.push(url)
          } catch (uploadErr) {
            console.error('Failed to upload a return file:', uploadErr)
            // continue with others
          }
        }

        if (mediaUrls.length > 0) {
          const mediaData = mediaUrls.map((url, idx) => ({
            return_request_id: returnReq.id,
            url: url,
            sort_order: idx,
          }))

          const { error: mediaError } = await supabase.from('return_media').insert(mediaData)

          if (mediaError) console.error('Error inserting return media:', mediaError)
        }
        toast.dismiss('return-media')
      }

      toast.success('Pengajuan retur berhasil dikirim!')
      router.push(`/pesanan/${order.order_number}`)
    } catch (err: unknown) {
      console.error('Error submitting return:', err)
      toast.error('Gagal mengirim pengajuan retur. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || orderLoading || checkReturnLoading) {
    return <AuthLoading message="Memuat form retur..." />
  }

  if (!isAuthenticated) return null

  // Security checks
  if (!order || order.status !== 'completed') {
    return (
      <div className="bg-white min-h-screen">
        <PageHero eyebrow="Retur" title="Pengajuan Retur" variant="cream" />
        <PageContainer size="md" className="py-12 page-content">
          <EmptyState
            icon={AlertTriangle}
            title="Akses Ditolak"
            description="Retur hanya bisa diajukan untuk pesanan dengan status Selesai."
            action={{ label: 'Kembali ke Pesanan', href: '/pesanan' }}
          />
        </PageContainer>
      </div>
    )
  }

  if (existingReturn) {
    return (
      <div className="bg-white min-h-screen">
        <PageHero eyebrow="Retur" title="Pengajuan Retur" variant="cream" />
        <PageContainer size="md" className="py-12 page-content">
          <EmptyState
            icon={ShieldCheck}
            title="Pengajuan Retur Sudah Ada"
            description={`Anda sudah mengajukan retur untuk pesanan ini. Status saat ini: ${existingReturn.status}`}
            action={{ label: 'Lihat Detail Pesanan', href: `/pesanan/${order.order_number}` }}
          />
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Garansi Kepuasan"
        title="Pengajuan Retur"
        subtitle={`Isi formulir pengembalian untuk pesanan ${order.order_number}`}
      >
        <Link
          href={`/pesanan/${order.order_number}`}
          className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-neutral-500 hover:text-brand-gold transition mt-2"
        >
          <ArrowLeft size={13} className="mr-1" /> Kembali ke Detail Pesanan
        </Link>
      </PageHero>

      <PageContainer size="md" className="py-10 page-content">
        <form onSubmit={handleSubmitReturn} className="space-y-8">
          <div className="border border-neutral-200 p-5 sm:p-6 card-hover-lift gold-border-hover bg-white space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
            <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold border-b border-neutral-100 pb-2">
              Pilih Produk yang Ingin Dikembalikan*
            </h2>
            <div className="divide-y divide-neutral-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="py-4 flex items-start space-x-4">
                  <input
                    type="checkbox"
                    id={`checkbox-${item.id}`}
                    checked={!!selectedItems[item.id]}
                    onChange={() => handleToggleItem(item.id)}
                    className="mt-1 w-4 h-4 border-neutral-300 accent-neutral-900 focus:ring-0 rounded-none"
                  />
                  <div className="flex-1 min-w-0 text-sm">
                    <label
                      htmlFor={`checkbox-${item.id}`}
                      className="font-semibold text-neutral-800 cursor-pointer block"
                    >
                      {item.product_name}
                    </label>
                    <p className="text-xs text-neutral-500 mt-1">
                      Varian: {item.variant_name} | SKU: {item.sku}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Jumlah Beli: {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {selectedItems[item.id] && (
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-neutral-500 font-semibold uppercase">
                        Jumlah Retur:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={quantities[item.id] || 1}
                        onChange={(e) =>
                          handleQtyChange(item.id, item.quantity, parseInt(e.target.value))
                        }
                        className="w-16 px-2 py-1.5 border border-neutral-200 text-center text-sm outline-none focus:border-neutral-900 rounded-none font-semibold"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Return Reason */}
          <div className="border border-neutral-200 p-5 sm:p-6 card-hover-lift gold-border-hover bg-white space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
            <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold border-b border-neutral-100 pb-2">
              Alasan Pengembalian*
            </h2>
            <div className="space-y-4">
              <Select value={reason} onChange={setReason} options={RETURN_REASONS} />
              <Textarea
                label="Deskripsi Tambahan / Detail Cacat"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Tuliskan alasan detail retur Anda..."
                rows={4}
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <label className="block text-xs uppercase tracking-widest font-semibold text-neutral-500">
                Lampirkan Bukti Foto (Opsional, Maks 2 Foto)
              </label>

              <div className="flex flex-wrap gap-4">
                {returnFiles.map((file, idx) => (
                  <div key={idx} className="relative w-24 h-24 border border-neutral-200 group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {returnFiles.length < 2 && (
                  <label className="w-24 h-24 border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-500 cursor-pointer hover:border-brand-gold hover:text-brand-gold transition group">
                    <ImageIcon
                      size={20}
                      className="mb-1 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Tambah</span>
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
              <p className="text-[10px] text-neutral-400">Format: JPG/PNG, maks 2MB per foto.</p>
            </div>
          </div>

          {/* 3. Refund Bank Info */}
          <div className="border border-neutral-200 p-5 sm:p-6 card-hover-lift gold-border-hover bg-white space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
            <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold border-b border-neutral-100 pb-2">
              Rekening Bank untuk Pengembalian Dana*
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Nama Bank*"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="cth: BCA, Mandiri"
                required
              />
              <Input
                label="Nomor Rekening*"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Nomor rekening bank"
                required
              />
              <Input
                label="Nama Pemilik Rekening*"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Nama pemilik sesuai buku tabungan"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
            <Link
              href={`/pesanan/${order.order_number}`}
              className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-neutral-500 hover:text-brand-gold transition"
            >
              <ArrowLeft size={13} className="mr-1" /> Batal
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="text-[10px] uppercase tracking-widest font-bold py-3 px-6"
            >
              Kirim Pengajuan
            </Button>
          </div>
        </form>
      </PageContainer>
    </div>
  )
}
