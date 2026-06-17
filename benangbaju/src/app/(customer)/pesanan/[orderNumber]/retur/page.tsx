'use client'

import React, { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useOrderDetail } from '@/hooks/useOrders'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { ArrowLeft, AlertTriangle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'

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
  params: Promise<{
    orderNumber: string
  }>
}

export default function ReturnPage({ params }: ReturnPageProps) {
  const { orderNumber } = use(params)
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/pesanan')
    }
  }, [isAuthenticated, authLoading, router])

  // 2. Fetch Order Details
  const { data: order, isLoading: orderLoading } = useOrderDetail(orderNumber)

  // 3. Check if order has existing return requests
  const { data: existingReturn, isLoading: checkReturnLoading } = useQuery({
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

  // Initialize checkboxes & quantities
  useEffect(() => {
    if (order?.order_items) {
      const initialChecked: Record<string, boolean> = {}
      const initialQty: Record<string, number> = {}
      order.order_items.forEach((item) => {
        initialChecked[item.id] = false
        initialQty[item.id] = 1
      })
      setSelectedItems(initialChecked)
      setQuantities(initialQty)
    }
  }, [order])

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

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItemsData)

      if (itemsError) throw itemsError

      toast.success('Pengajuan retur berhasil dikirim!')
      router.push(`/pesanan/${order.order_number}`)
    } catch (err: any) {
      console.error('Error submitting return:', err)
      toast.error(err.message || 'Gagal mengirim pengajuan retur')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || orderLoading || checkReturnLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
        <p className="text-neutral-400 text-sm tracking-widest uppercase animate-pulse">Memuat form retur...</p>
      </div>
    )
  }

  if (!isAuthenticated) return null

  // Security checks
  if (!order || order.status !== 'completed') {
    return (
      <div className="min-h-screen bg-white py-16 px-4 flex flex-col items-center justify-center font-sans text-center">
        <AlertTriangle size={40} className="text-amber-500 mb-4" />
        <h1 className="text-xl font-serif text-neutral-800 mb-2">Akses Ditolak</h1>
        <p className="text-neutral-500 text-sm mb-6">Retur hanya bisa diajukan untuk pesanan dengan status Selesai.</p>
        <Link href="/pesanan">
          <Button className="text-xs uppercase font-semibold">Kembali</Button>
        </Link>
      </div>
    )
  }

  if (existingReturn) {
    return (
      <div className="min-h-screen bg-white py-16 px-4 flex flex-col items-center justify-center font-sans text-center">
        <ShieldCheck size={40} className="text-neutral-800 mb-4" />
        <h1 className="text-xl font-serif text-neutral-800 mb-2">Pengajuan Retur Sudah Ada</h1>
        <p className="text-neutral-500 text-sm mb-2">
          Anda sudah mengajukan retur untuk pesanan ini.
        </p>
        <p className="text-xs text-neutral-400 mb-6 uppercase tracking-widest font-semibold">
          Status saat ini: {existingReturn.status}
        </p>
        <Link href={`/pesanan/${order.order_number}`}>
          <Button className="text-xs uppercase font-semibold">Lihat Detail Pesanan</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center space-x-2 text-xs uppercase tracking-wider text-neutral-400">
          <Link href="/akun" className="hover:text-neutral-900 transition">Akun Saya</Link>
          <span>/</span>
          <Link href="/pesanan" className="hover:text-neutral-900 transition">Pesanan Saya</Link>
          <span>/</span>
          <Link href={`/pesanan/${order.order_number}`} className="hover:text-neutral-900 transition">{order.order_number}</Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">Ajukan Retur</span>
        </div>

        <div className="border-b border-neutral-200 pb-5 mb-8">
          <h1 className="text-3xl font-serif tracking-tight text-neutral-900 mb-1">Pengajuan Retur Barang</h1>
          <p className="text-sm text-neutral-500">Isi formulir pengembalian produk dan dana untuk pesanan {order.order_number}.</p>
        </div>

        <form onSubmit={handleSubmitReturn} className="space-y-8">
          {/* 1. Select Items */}
          <div className="border border-neutral-200 p-5 sm:p-6 rounded-none space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-400 border-b border-neutral-100 pb-2">
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
                    <label htmlFor={`checkbox-${item.id}`} className="font-semibold text-neutral-800 cursor-pointer block">
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
                      <label className="text-xs text-neutral-500 font-semibold uppercase">Jumlah Retur:</label>
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={quantities[item.id] || 1}
                        onChange={(e) => handleQtyChange(item.id, item.quantity, parseInt(e.target.value))}
                        className="w-16 px-2 py-1.5 border border-neutral-200 text-center text-sm outline-none focus:border-neutral-900 rounded-none font-semibold"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Return Reason */}
          <div className="border border-neutral-200 p-5 sm:p-6 rounded-none space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-400 border-b border-neutral-100 pb-2">
              Alasan Pengembalian*
            </h2>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none rounded-none text-sm transition appearance-none bg-white font-medium"
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-widest font-semibold text-neutral-500">
                Deskripsi Tambahan / Detail Cacat
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Tuliskan alasan detail retur Anda..."
                className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none rounded-none text-sm transition h-28 resize-none"
              />
            </div>
          </div>

          {/* 3. Refund Bank Info */}
          <div className="border border-neutral-200 p-5 sm:p-6 rounded-none space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-400 border-b border-neutral-100 pb-2">
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
              className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-neutral-600 hover:text-neutral-950 transition"
            >
              <ArrowLeft size={13} className="mr-1" /> Batal
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="text-xs uppercase tracking-widest font-bold py-3 px-6"
            >
              Kirim Pengajuan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
