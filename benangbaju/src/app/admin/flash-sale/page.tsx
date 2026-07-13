'use client'

import React, { useState } from 'react'
import {
  useAdminFlashSales,
  useAdminCreateFlashSale,
  useAdminUpdateFlashSale,
  useAdminDeleteFlashSale,
} from '@/app/admin/hooks/useAdmin'
import type { AdminFlashSaleListItem } from '@/modules/flash-sales/types'
import { Button, AdminPageHeader } from '@/shared/components'
import { FlashSaleListTable, FlashSaleFormModal, type FlashSaleFormItem } from './components'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { formatLocalISO } from '@/lib/utils/format'

const supabase = createBrowserClient()

export interface VariantSimple {
  id: string
  name: string
  price: number
  stock: number
  sku: string
  products: {
    name: string
  } | null
}

export default function AdminFlashSalesPage(): React.JSX.Element {
  const { data: campaignsRes, isLoading, refetch } = useAdminFlashSales()
  const campaigns = campaignsRes?.data || []

  const createMutation = useAdminCreateFlashSale()
  const updateMutation = useAdminUpdateFlashSale()
  const deleteMutation = useAdminDeleteFlashSale()

  // Fetch all variants for choosing
  const { data: allVariants = [] } = useQuery({
    queryKey: ['admin', 'all-variants-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, name, price, stock, sku, products(name)')
        .eq('is_active', true)
        .order('sku')
      if (error) throw error
      return data || []
    },
  })

  // Modal control states
  const [isOpen, setIsOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<AdminFlashSaleListItem | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [banner_url, setBannerUrl] = useState('')
  const [starts_at, setStartsAt] = useState('')
  const [ends_at, setEndsAt] = useState('')
  const [is_active, setIsActive] = useState(true)

  // Campaign items state
  const [items, setItems] = useState<FlashSaleFormItem[]>([])

  const handleOpenAdd = () => {
    setEditingCampaign(null)
    setName('')
    setDescription('')
    setBannerUrl('')
    setStartsAt('')
    setEndsAt('')
    setIsActive(true)
    setItems([])
    setIsOpen(true)
  }

  const handleOpenEdit = (camp: AdminFlashSaleListItem) => {
    setEditingCampaign(camp)
    setName(camp.name || '')
    setDescription(camp.description || '')
    setBannerUrl(camp.banner_url || '')
    setStartsAt(formatLocalISO(camp.starts_at))
    setEndsAt(formatLocalISO(camp.ends_at))
    setIsActive(camp.is_active !== false)

    if (camp.flash_sale_items) {
      setItems(
        camp.flash_sale_items.map((i) => ({
          variant_id: i.variant_id,
          original_price: Number(i.original_price) || 0,
          sale_price: Number(i.sale_price) || 0,
          quota: i.quota || 0,
          name: i.product_variants?.name || '',
          prodName: i.product_variants?.products?.name || '',
        }))
      )
    } else {
      setItems([])
    }
    setIsOpen(true)
  }

  const handleDuplicate = (camp: AdminFlashSaleListItem) => {
    setEditingCampaign(null)
    setName((camp.name || '') + ' (Copy)')
    setDescription(camp.description || '')
    setBannerUrl(camp.banner_url || '')
    setStartsAt(formatLocalISO(camp.starts_at))
    setEndsAt(formatLocalISO(camp.ends_at))
    setIsActive(camp.is_active !== false)

    if (camp.flash_sale_items) {
      setItems(
        camp.flash_sale_items.map((i) => ({
          variant_id: i.variant_id,
          original_price: Number(i.original_price) || 0,
          sale_price: Number(i.sale_price) || 0,
          quota: i.quota || 0,
          name: i.product_variants?.name || '',
          prodName: i.product_variants?.products?.name || '',
        }))
      )
    } else {
      setItems([])
    }
    setIsOpen(true)
  }

  const handleToggleActive = async (camp: AdminFlashSaleListItem) => {
    try {
      const { error } = await supabase
        .from('flash_sales')
        .update({ is_active: !camp.is_active })
        .eq('id', camp.id)

      if (error) throw error
      toast.success('Status aktif berhasil diubah')
      refetch()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan Flash Sale ini?')) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success('Flash Sale dinonaktifkan')
        refetch()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        toast.error('Gagal menonaktifkan campaign')
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (payload: any) => {
    try {
      if (editingCampaign) {
        await updateMutation.mutateAsync({
          saleId: editingCampaign.id,
          ...payload,
        })
        toast.success('Flash Sale berhasil diperbarui')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Flash Sale berhasil ditambahkan')
      }
      setIsOpen(false)
      refetch()
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Gagal menyimpan Flash Sale'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Flash Sale" subtitle="Kelola promo kilat dengan slot waktu terbatas.">
        <Button
          onClick={handleOpenAdd}
          className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5"
        >
          <Plus size={14} className="mr-1.5" /> Tambah Flash Sale
        </Button>
      </AdminPageHeader>

      <FlashSaleListTable
        campaigns={campaigns}
        isLoading={isLoading}
        onToggleActive={handleToggleActive}
        onDuplicate={handleDuplicate}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <FlashSaleFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        editingCampaign={editingCampaign}
        onSubmit={handleSubmit}
        allVariants={allVariants as unknown as VariantSimple[]}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        banner_url={banner_url}
        setBannerUrl={setBannerUrl}
        starts_at={starts_at}
        setStartsAt={setStartsAt}
        ends_at={ends_at}
        setEndsAt={setEndsAt}
        is_active={is_active}
        setIsActive={setIsActive}
        items={items}
        setItems={setItems}
      />
    </div>
  )
}
