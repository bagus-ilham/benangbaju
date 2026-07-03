'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Search } from 'lucide-react'
import { Button, Input, Modal } from '@/shared/components'
import { uploadImage } from '@/lib/supabase/storage'
import toast from 'react-hot-toast'
import type { AdminFlashSaleListItem } from '@/features/marketing/services/flashSales'

export interface FlashSaleFormItem {
  variant_id: string
  original_price: number
  sale_price: number
  quota: number
  name: string
  prodName: string
}

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

interface FlashSaleFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingCampaign: AdminFlashSaleListItem | null
  onSubmit: (payload: any) => Promise<void>
  allVariants: VariantSimple[]
  
  // Form States provided by parent
  name: string; setName: (val: string) => void
  description: string; setDescription: (val: string) => void
  banner_url: string; setBannerUrl: (val: string) => void
  starts_at: string; setStartsAt: (val: string) => void
  ends_at: string; setEndsAt: (val: string) => void
  is_active: boolean; setIsActive: (val: boolean) => void
  items: FlashSaleFormItem[]; setItems: React.Dispatch<React.SetStateAction<FlashSaleFormItem[]>>
}

export function FlashSaleFormModal({
  isOpen,
  onClose,
  editingCampaign,
  onSubmit,
  allVariants,
  name, setName,
  description, setDescription,
  banner_url, setBannerUrl,
  starts_at, setStartsAt,
  ends_at, setEndsAt,
  is_active, setIsActive,
  items, setItems
}: FlashSaleFormModalProps) {
  
  const [variantSearch, setVariantSearch] = useState('')
  const [showVariantList, setShowVariantList] = useState(false)

  const handleAddVariantItem = (v: VariantSimple) => {
    if (items.some((item) => item.variant_id === v.id)) {
      toast.error('Varian ini sudah ditambahkan ke daftar')
      return
    }

    setItems((prev) => [
      ...prev,
      {
        variant_id: v.id,
        original_price: Number(v.price) || 0,
        sale_price: Math.floor(Number(v.price) * 0.9),
        quota: 5,
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

  const handleSubmit = (e: React.FormEvent) => {
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

    onSubmit(payload)
  }

  const filteredVariants = allVariants.filter((v) => {
    const term = variantSearch.toLowerCase()
    return (
      v.sku?.toLowerCase().includes(term) ||
      v.name?.toLowerCase().includes(term) ||
      v.products?.name?.toLowerCase().includes(term)
    )
  }).slice(0, 5)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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

        <div>
          <label className="block text-[10px] font-heading font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
            Banner Promosi (Opsional)
          </label>
          <div className="flex items-center space-x-3">
            {banner_url && (
              <div className="relative w-16 h-10 bg-neutral-100 border border-neutral-200">
                <Image src={banner_url} alt="Banner" fill className="object-cover" />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              className="flex-1 text-xs"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                toast.loading('Mengunggah banner...', { id: 'upload-banner' })
                try {
                  const url = await uploadImage(file, 'banners')
                  setBannerUrl(url)
                  toast.success('Banner berhasil diunggah', { id: 'upload-banner' })
                } catch (err) {
                  toast.error('Gagal mengunggah banner', { id: 'upload-banner' })
                }
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-heading font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
            Deskripsi (Opsional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-neutral-200 p-2.5 outline-none focus:border-neutral-800 transition min-h-[60px]"
            placeholder="Keterangan singkat..."
          />
        </div>

        <div className="pt-2 flex items-center space-x-2 border-t border-neutral-100">
          <input
            type="checkbox"
            id="active-campaign"
            checked={is_active}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-brand-gold focus:ring-brand-gold border-gray-300 rounded-none cursor-pointer"
          />
          <label htmlFor="active-campaign" className="text-xs font-semibold text-neutral-800 cursor-pointer select-none">
            Aktifkan Flash Sale ini?
          </label>
        </div>

        {/* Produk / Variant Section */}
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-heading font-bold uppercase tracking-widest text-brand-black text-[10px]">
              Daftar Produk Flash Sale*
            </h4>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowVariantList(!showVariantList)
                setVariantSearch('')
              }}
              className="py-1 px-3 text-[10px] uppercase font-bold tracking-wider"
            >
              <Plus size={12} className="mr-1" />
              Pilih Produk
            </Button>
          </div>

          {/* Pencarian Varian Cepat */}
          {showVariantList && (
            <div className="mb-4 border border-brand-gold/30 p-3 bg-brand-gold-muted/5 relative">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari SKU atau nama produk..."
                  className="w-full pl-8 pr-3 py-2 border border-neutral-200 focus:border-brand-gold outline-none text-xs"
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                  autoFocus
                />
              </div>
              {variantSearch.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                  {filteredVariants.map((v) => (
                    <div
                      key={v.id}
                      className="flex justify-between items-center p-2 border border-neutral-100 bg-white hover:border-brand-gold transition cursor-pointer"
                      onClick={() => handleAddVariantItem(v)}
                    >
                      <div>
                        <p className="font-bold text-[10px] uppercase tracking-wider text-brand-black">{v.sku}</p>
                        <p className="text-[10px] text-neutral-600 line-clamp-1">{v.products?.name} - {v.name}</p>
                      </div>
                      <div className="text-right pl-2 shrink-0">
                        <p className="text-[10px] font-bold text-neutral-800">Rp {v.price.toLocaleString()}</p>
                        <p className="text-[9px] text-neutral-400">Stok: {v.stock}</p>
                      </div>
                    </div>
                  ))}
                  {filteredVariants.length === 0 && (
                    <p className="text-[10px] text-center py-2 text-neutral-400">Tidak ada varian cocok.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Table List Items */}
          <div className="border border-neutral-200 bg-neutral-50/50">
            {items.length === 0 ? (
              <p className="text-center text-neutral-400 py-6 text-[10px] italic uppercase tracking-wider">
                Belum ada produk untuk promo ini
              </p>
            ) : (
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 border-b border-neutral-200 text-[9px] uppercase tracking-widest text-neutral-500 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Produk & Varian</th>
                      <th className="py-2 px-3">Harga Asli</th>
                      <th className="py-2 px-3">Harga Sale</th>
                      <th className="py-2 px-3">Kuota</th>
                      <th className="py-2 px-3">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-[11px] font-medium bg-white">
                    {items.map((it, idx) => (
                      <tr key={it.variant_id}>
                        <td className="py-2 px-3">
                          <span className="block font-bold text-neutral-800 line-clamp-1">{it.prodName}</span>
                          <span className="text-[9px] text-neutral-500 uppercase">{it.name}</span>
                        </td>
                        <td className="py-2 px-3 text-neutral-500">
                          Rp {it.original_price.toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            className="w-20 border border-neutral-200 p-1 outline-none focus:border-brand-gold text-[10px]"
                            value={it.sale_price}
                            onChange={(e) => handleUpdateItemField(idx, 'sale_price', Number(e.target.value))}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            className="w-16 border border-neutral-200 p-1 outline-none focus:border-brand-gold text-[10px]"
                            value={it.quota}
                            onChange={(e) => handleUpdateItemField(idx, 'quota', Number(e.target.value))}
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-400 hover:text-red-600 p-1 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose} className="px-5 py-2.5 text-xs font-bold uppercase">
            Batal
          </Button>
          <Button type="submit" variant="primary" className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest">
            Simpan Flash Sale
          </Button>
        </div>
      </form>
    </Modal>
  )
}
