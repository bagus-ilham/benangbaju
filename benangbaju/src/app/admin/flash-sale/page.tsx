'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  useAdminFlashSales,
  useAdminCreateFlashSale,
  useAdminUpdateFlashSale,
  useAdminDeleteFlashSale,
} from '@/hooks/useAdmin'
import type { AdminFlashSaleListItem } from '@/services/flashSales'
import { Button, Input, Modal, AdminPageHeader } from '@/components/shared'
import { Plus, Edit2, Trash2, Search, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { formatLocalISO } from '@/lib/utils/format'
import { uploadImage } from '@/lib/supabase/storage'

const supabase = createBrowserClient()

interface FlashSaleFormItem {
  variant_id: string
  original_price: number
  sale_price: number
  quota: number
  name: string
  prodName: string
}

interface VariantSimple {
  id: string
  name: string
  price: number
  stock: number
  sku: string
  products: {
    name: string
  } | null
}

export default function AdminFlashSalesPage() : React.JSX.Element {
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
    }
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

  // Search simple state inside modal
  const [variantSearch, setVariantSearch] = useState('')
  const [showVariantList, setShowVariantList] = useState(false)

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

    // Map items
    if (camp.flash_sale_items) {
      setItems(
        camp.flash_sale_items.map((i) => ({
          variant_id: i.variant_id,
          original_price: Number(i.original_price) || 0,
          sale_price: Number(i.sale_price) || 0,
          quota: i.quota || 0,
          // metadata for label
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

    // Map items
    if (camp.flash_sale_items) {
      setItems(
        camp.flash_sale_items.map((i) => ({
          variant_id: i.variant_id,
          original_price: Number(i.original_price) || 0,
          sale_price: Number(i.sale_price) || 0,
          quota: i.quota || 0,
          // metadata for label
          name: i.product_variants?.name || '',
          prodName: i.product_variants?.products?.name || '',
        }))
      )
    } else {
      setItems([])
    }
    setIsOpen(true)
  }

  const handleAddVariantItem = (v: VariantSimple) => {
    // Avoid duplicate
    if (items.some((item) => item.variant_id === v.id)) {
      toast.error('Varian ini sudah ditambahkan ke daftar')
      return
    }

    setItems((prev) => [
      ...prev,
      {
        variant_id: v.id,
        original_price: Number(v.price) || 0,
        sale_price: Math.floor(Number(v.price) * 0.9), // Default 10% off
        quota: 5, // Default quota
        name: v.name,
        prodName: v.products?.name || '',
      },
    ])
    setShowVariantList(false)
    setVariantSearch('')
  }

  const handleUpdateItemField = (idx: number, field: keyof FlashSaleFormItem, value: number | string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )
  }

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
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
      } catch (err) {
        toast.error('Gagal menonaktifkan campaign')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !starts_at || !ends_at) {
      toast.error('Nama, Tanggal Mulai, dan Tanggal Selesai wajib diisi')
      return
    }

    if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
      toast.error('Waktu selesai harus setelah waktu mulai')
      return
    }

    if (items.length === 0) {
      toast.error('Wajib menambahkan minimal satu produk flash sale')
      return
    }

    for (const item of items) {
      if (item.sale_price <= 0 || item.sale_price >= item.original_price) {
        toast.error('Harga flash sale harus lebih dari 0 dan kurang dari harga asli')
        return
      }
    }

    const payload = {
      saleData: {
        name: name.trim(),
        description: description.trim() || null,
        banner_url: banner_url.trim() || null,
        starts_at: new Date(starts_at).toISOString(),
        ends_at: new Date(ends_at).toISOString(),
        is_active,
      },
      items,
    }

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

  // Filter variant search list
  const filteredVariants = allVariants.filter((v) => {
    const term = variantSearch.toLowerCase()
    return (
      v.sku?.toLowerCase().includes(term) ||
      v.name?.toLowerCase().includes(term) ||
      v.products?.name?.toLowerCase().includes(term)
    )
  }).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Flash Sale"
        subtitle="Kelola promo kilat dengan slot waktu terbatas."
      >
        <Button onClick={handleOpenAdd} className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5">
          <Plus size={14} className="mr-1.5" /> Tambah Flash Sale
        </Button>
      </AdminPageHeader>

      {/* Main Table */}
      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat flash sale...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 italic text-xs">
            Belum ada promo flash sale ditambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-3 px-5">Nama Kampanye</th>
                  <th className="py-3 px-4">Slot Jadwal</th>
                  <th className="py-3 px-4 text-center">Item Promo</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                {campaigns.map((camp: AdminFlashSaleListItem) => {
                  const now = new Date()
                  const start = new Date(camp.starts_at)
                  const end = new Date(camp.ends_at)
                  const isRunning = camp.is_active && start <= now && end >= now
                  
                  return (
                    <tr key={camp.id} className="hover:bg-neutral-50/20 transition duration-150">
                      <td className="py-4 px-5">
                        <span className="font-semibold text-neutral-900 text-sm block">
                          {camp.name}
                        </span>
                        {isRunning && (
                          <span className="inline-block mt-1 text-[8px] bg-red-600 text-white font-bold tracking-wider uppercase px-2 py-0.5 rounded-none">
                            Sedang Berjalan (LIVE)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-neutral-600 font-medium leading-relaxed">
                        <p>Mulai: {new Date(camp.starts_at).toLocaleString()}</p>
                        <p className="text-[10px] text-neutral-400">Selesai: {new Date(camp.ends_at).toLocaleString()}</p>
                      </td>
                      <td className="py-4 px-4 text-center font-bold">
                        {camp.flash_sale_items?.length || 0} Produk Varian
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(camp)}
                          className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${
                            camp.is_active
                              ? 'bg-neutral-900 text-white border border-neutral-900'
                              : 'bg-white text-neutral-400 border border-neutral-200'
                          }`}
                        >
                          {camp.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          onClick={() => handleDuplicate(camp)}
                          variant="outline"
                          className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                          title="Duplikat Flash Sale"
                        >
                          <Copy size={13} />
                        </Button>
                        <Button
                          onClick={() => handleOpenEdit(camp)}
                          variant="outline"
                          className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                          title="Edit Flash Sale"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          onClick={() => handleDelete(camp.id)}
                          variant="outline"
                          className="p-2 border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form editor */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingCampaign ? 'Ubah Flash Sale' : 'Tambah Flash Sale Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
          <Input
            label="Nama Kampanye Flash Sale*"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth: Flash Sale Akhir Bulan Juni"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Waktu Mulai*"
              type="datetime-local"
              value={starts_at}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
            <Input
              label="Waktu Selesai*"
              type="datetime-local"
              value={ends_at}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Banner Image Uploader & Preview */}
            <div className="border border-neutral-200 p-4 space-y-3 bg-neutral-50/10">
              <span className="block text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70">
                Gambar Banner Flash Sale (Opsional)
              </span>
              <div className="flex gap-3 items-start">
                <div className="w-20 h-10 bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                  {banner_url ? (
                    <Image
                      src={banner_url}
                      alt="Banner Preview"
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/150?text=Error'
                      }}
                    />
                  ) : (
                    <span className="text-[8px] text-neutral-400 uppercase font-semibold">No Image</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-neutral-200 outline-none text-[11px] bg-white focus:border-neutral-800"
                    value={banner_url}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://... atau unggah gambar"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="flash-sale-upload-banner"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        const toastId = toast.loading('Mengunggah gambar banner...')
                        try {
                          const publicUrl = await uploadImage(file, 'banners')
                          setBannerUrl(publicUrl)
                          toast.success('Gambar banner berhasil diunggah!', { id: toastId })
                        } catch (err: unknown) {
                          const message = err instanceof Error ? err.message : 'Gagal mengunggah gambar banner'
                          toast.error(message, { id: toastId })
                        }
                      }}
                    />
                    <label
                      htmlFor="flash-sale-upload-banner"
                      className="cursor-pointer inline-flex items-center text-[9px] font-bold uppercase tracking-wider py-1 px-2.5 border border-neutral-800 text-neutral-850 hover:bg-neutral-900 hover:text-white transition duration-150 rounded-none"
                    >
                      Unggah Banner
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Deskripsi Singkat
              </label>
              <input
                type="text"
                className="w-full px-4 py-3.5 border border-neutral-200 outline-none text-xs bg-white focus:border-neutral-800"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="cth: Promo kilat diskon hingga 50%"
              />
            </div>
          </div>

          {/* Autocomplete Variant Picker inside Modal */}
          <div className="space-y-2 pt-2 border-t border-neutral-100 relative">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Cari & Tambah Produk Varian Promo*
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-neutral-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari SKU atau nama varian..."
                value={variantSearch}
                onChange={(e) => {
                  setVariantSearch(e.target.value)
                  setShowVariantList(true)
                }}
                onFocus={() => setShowVariantList(true)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none"
              />

              {showVariantList && variantSearch.trim().length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 max-h-40 overflow-y-auto rounded-none shadow-lg divide-y divide-neutral-100">
                  {filteredVariants.length === 0 ? (
                    <div className="px-4 py-3 text-neutral-400 italic">Varian tidak ditemukan</div>
                  ) : (
                    filteredVariants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleAddVariantItem(v)}
                        className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 flex justify-between font-medium text-[11px]"
                      >
                        <div>
                          <p className="text-neutral-850 font-bold">{v.products?.name}</p>
                          <p className="text-[10px] text-neutral-400">{v.name} | SKU: {v.sku}</p>
                        </div>
                        <span className="font-bold text-neutral-900">Rp {Number(v.price).toLocaleString()}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items configured list */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Daftar Item Flash Sale
            </label>
            {items.length === 0 ? (
              <p className="text-[11px] text-neutral-400 italic py-4 text-center border border-dashed border-neutral-200">
                Silakan cari dan tambahkan produk varian di atas.
              </p>
            ) : (
              <div className="border border-neutral-200 divide-y divide-neutral-100 rounded-none bg-white max-h-48 overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between relative gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-800 truncate text-[11px]">{item.prodName}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{item.name} | Asli: Rp {item.original_price.toLocaleString()}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <Input
                          label="Harga Promo (Rp)*"
                          type="number"
                          value={item.sale_price}
                          onChange={(e) => handleUpdateItemField(idx, 'sale_price', Math.max(0, parseFloat(e.target.value) || 0))}
                          required
                        />
                        <Input
                          label="Kuota Promo*"
                          type="number"
                          value={item.quota}
                          onChange={(e) => handleUpdateItemField(idx, 'quota', Math.max(0, parseInt(e.target.value) || 0))}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-neutral-400 hover:text-red-500 p-1 self-start"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="fs_is_active"
              checked={is_active}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 border-neutral-300 accent-neutral-900 rounded-none focus:ring-0"
            />
            <label htmlFor="fs_is_active" className="select-none text-neutral-700 font-semibold uppercase tracking-wider">
              Flash Sale Aktif
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
