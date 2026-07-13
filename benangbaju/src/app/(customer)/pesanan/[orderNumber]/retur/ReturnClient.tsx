'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { useOrderDetail } from '@/modules/orders/hooks/useOrders'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  Button,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Input,
  PageHero,
  PageContainer,
  EmptyState,
  AuthLoading,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Select,
} from '@/shared/components'
import { ArrowLeft, AlertTriangle, ShieldCheck } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { uploadImage } from '@/lib/supabase/storage'
import { RefundBankForm } from './components/RefundBankForm'
import { ReturnItemSelection } from './components/ReturnItemSelection'
import { ReturnReasonForm } from './components/ReturnReasonForm'

const supabase = createBrowserClient()

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedItems(initialChecked)
      setQuantities(initialQty)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <ReturnItemSelection
            orderItems={order.order_items}
            selectedItems={selectedItems}
            quantities={quantities}
            onToggleItem={handleToggleItem}
            onQtyChange={handleQtyChange}
          />

          {/* 2. Return Reason */}
          <ReturnReasonForm
            reason={reason}
            setReason={setReason}
            customerNotes={customerNotes}
            setCustomerNotes={setCustomerNotes}
            returnFiles={returnFiles}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
          />

          {/* 3. Refund Bank Info */}
          <RefundBankForm
            bankName={bankName}
            setBankName={setBankName}
            accountNumber={accountNumber}
            setAccountNumber={setAccountNumber}
            accountName={accountName}
            setAccountName={setAccountName}
          />

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
