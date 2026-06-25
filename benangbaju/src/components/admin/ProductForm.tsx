'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminCategories, useAdminCollections } from '@/hooks/useAdmin'
import { Button, Input, AdminPageHeader } from '@/components/shared'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { ProductImageManager } from './ProductImageManager'
import { ProductMarketplaceLinks } from './ProductMarketplaceLinks'
import { ProductSeoFields } from './ProductSeoFields'

import { uploadImage } from '@/lib/supabase/storage'

import type { ProductPayload, ProductVariantPayload, ProductImagePayload, ProductLinkPayload } from '@/types/product'

interface InitialProductVariantAttr {
  attr_name: string
  attr_value: string
}

interface InitialProductVariant {
  id: string
  sku: string | null
  name: string | null
  price: number | string
  compare_price: number | string | null
  stock: number
  weight_gram: number | null
  is_active: boolean
  product_variant_attrs?: InitialProductVariantAttr[]
}

interface InitialProductImage {
  id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  variant_id: string | null
}

interface InitialProductLink {
  platform: string
  url: string
  label: string | null
  sort_order: number
}

interface InitialCollectionProduct {
  collection_id: string
}

interface InitialProductData {
  id: string
  name: string
  slug: string
  category_id: string
  description: string | null
  short_description: string | null
  weight_gram: number
  is_active: boolean
  is_featured: boolean
  meta_title: string | null
  meta_description: string | null
  size_guide?: string | null
  care_guide?: string | null
  product_variants?: InitialProductVariant[]
  product_images?: InitialProductImage[]
  product_marketplace_links?: InitialProductLink[]
  collection_products?: InitialCollectionProduct[]
}

interface ProductFormProps {
  initialData?: InitialProductData
  onSubmit: (data: ProductPayload) => Promise<void>
  isSubmitting: boolean
  title: string
}

export function ProductForm({ initialData, onSubmit, isSubmitting, title }: ProductFormProps) : React.JSX.Element {
  const router = useRouter()
  const { data: categories, isLoading: catsLoading } = useAdminCategories()
  const { data: collections, isLoading: colsLoading } = useAdminCollections()

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category_id, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [short_description, setShortDescription] = useState('')
  const [weight_gram, setWeightGram] = useState(100)
  const [is_active, setIsActive] = useState(true)
  const [is_featured, setIsFeatured] = useState(false)
  const [meta_title, setMetaTitle] = useState('')
  const [meta_description, setMetaDescription] = useState('')
  const [size_guide, setSizeGuide] = useState('')
  const [care_guide, setCareGuide] = useState('')

  // Variants state
  const [variants, setVariants] = useState<ProductVariantPayload[]>([])

  // Images state (multiple URLs)
  const [images, setImages] = useState<ProductImagePayload[]>([])

  // Marketplace links state
  const [marketplaceLinks, setMarketplaceLinks] = useState<ProductLinkPayload[]>([])

  // Selected collections state
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])

  // Populate data on edit mode
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setSlug(initialData.slug || '')
      setCategoryId(initialData.category_id || '')
      setDescription(initialData.description || '')
      setShortDescription(initialData.short_description || '')
      setWeightGram(initialData.weight_gram || 100)
      setIsActive(initialData.is_active !== false)
      setIsFeatured(!!initialData.is_featured)
      setMetaTitle(initialData.meta_title || '')
      setMetaDescription(initialData.meta_description || '')
      setSizeGuide(initialData.size_guide || '')
      setCareGuide(initialData.care_guide || '')

      // Map variants
      if (initialData.product_variants) {
        setVariants(
          initialData.product_variants.map((v: InitialProductVariant) => ({
            id: v.id,
            sku: v.sku || '',
            name: v.name || '',
            price: Number(v.price) || 0,
            compare_price: v.compare_price ? Number(v.compare_price) : null,
            stock: v.stock || 0,
            weight_gram: v.weight_gram || null,
            is_active: v.is_active !== false,
            // Parse attributes
            attrs: v.product_variant_attrs?.map((a: InitialProductVariantAttr) => ({
              attr_name: a.attr_name,
              attr_value: a.attr_value,
            })) || [],
          }))
        )
      }

      // Map images
      if (initialData.product_images) {
        setImages(
          initialData.product_images.map((img: InitialProductImage) => ({
            url: img.url || '',
            alt_text: img.alt_text || '',
            sort_order: img.sort_order || 0,
            is_primary: !!img.is_primary,
            variant_id: img.variant_id || '',
          }))
        )
      }

      // Map marketplace links
      if (initialData.product_marketplace_links) {
        setMarketplaceLinks(
          initialData.product_marketplace_links.map((link: InitialProductLink) => ({
            platform: link.platform || 'shopee',
            url: link.url || '',
            label: link.label || '',
            sort_order: link.sort_order || 0,
          }))
        )
      }

      // Map collections
      if (initialData.collection_products) {
        setSelectedCollections(
          initialData.collection_products.map((cp: InitialCollectionProduct) => cp.collection_id)
        )
      } else {
        setSelectedCollections([])
      }
    } else {
      // Add default variant for new product
      setVariants([
        {
          id: 'temp-default',
          sku: '',
          name: 'Default',
          price: 0,
          compare_price: null,
          stock: 10,
          weight_gram: null,
          is_active: true,
          attrs: [],
        },
      ])
      setImages([
        {
          url: '',
          alt_text: '',
          sort_order: 0,
          is_primary: true,
          variant_id: null,
        },
      ])
      setSelectedCollections([])
      setSizeGuide('')
      setCareGuide('')
    }
  }, [initialData])

  // Helper auto-generate slug
  const handleNameChange = (val: string) => {
    setName(val)
    if (!initialData) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      )
    }
  }

  // Variants handlers
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sku: '',
        name: '',
        price: 0,
        compare_price: null,
        stock: 0,
        weight_gram: null,
        is_active: true,
        attrs: [],
      },
    ])
  }

  const handleUpdateVariantField = (idx: number, field: string, value: string | number | boolean | null | Array<{ attr_name: string; attr_value: string }>) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    )
  }

  const handleRemoveVariant = (idx: number) => {
    const variantToRemove = variants[idx]
    setVariants((prev) => prev.filter((_, i) => i !== idx))
    if (variantToRemove?.id) {
      setImages((prev) => prev.filter((img) => img.variant_id !== variantToRemove.id))
    }
  }

  // Variant attributes handlers
  const handleAddVariantAttr = (vIdx: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              attrs: [...v.attrs, { attr_name: 'Warna', attr_value: '' }],
            }
          : v
      )
    )
  }

  const handleUpdateVariantAttrField = (vIdx: number, aIdx: number, field: string, value: string) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              attrs: v.attrs.map((attr, j: number) =>
                j === aIdx ? { ...attr, [field]: value } : attr
              ),
            }
          : v
      )
    )
  }

  const handleRemoveVariantAttr = (vIdx: number, aIdx: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              attrs: v.attrs.filter((_, j: number) => j !== aIdx),
            }
          : v
      )
    )
  }

  const handleAddImage = () => {
    setImages((prev) => [
      ...prev,
      {
        url: '',
        alt_text: '',
        sort_order: prev.length,
        is_primary: prev.length === 0,
        variant_id: null,
      },
    ])
  }

  const handleUpdateImageField = (idx: number, field: string, value: string | number | boolean | null) => {
    setImages((prev) =>
      prev.map((img, i) => {
        if (field === 'is_primary' && value === true) {
          return { ...img, [field]: i === idx }
        }
        return i === idx ? { ...img, [field]: value } : img
      })
    )
  }

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  // Marketplace links handlers
  const handleAddLink = () => {
    setMarketplaceLinks((prev) => [
      ...prev,
      {
        platform: 'shopee',
        url: '',
        label: 'Cek di Shopee',
        sort_order: prev.length,
      },
    ])
  }

  const handleUpdateLinkField = (idx: number, field: string, value: string | number | null) => {
    setMarketplaceLinks((prev) =>
      prev.map((link, i) => (i === idx ? { ...link, [field]: value } : link))
    )
  }

  const handleRemoveLink = (idx: number) => {
    setMarketplaceLinks((prev) => prev.filter((_, i) => i !== idx))
  }

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !slug.trim() || !category_id) {
      toast.error('Nama, Slug, dan Kategori wajib diisi')
      return
    }

    if (variants.length === 0) {
      toast.error('Produk wajib memiliki minimal satu varian')
      return
    }

    // Validate SKUs and Prices
    for (const v of variants) {
      if (!v.sku.trim()) {
        toast.error('Semua varian wajib memiliki SKU')
        return
      }
      if (v.price <= 0) {
        toast.error('Harga varian harus lebih dari 0')
        return
      }
    }

    // Clean image objects
    const cleanedImages = images.filter((img) => img.url.trim() !== '')
    
    // Clean marketplace links
    const cleanedLinks = marketplaceLinks.filter((link) => link.url.trim() !== '')

    const payload = {
      productData: {
        category_id,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        short_description: short_description.trim() || null,
        weight_gram: Number(weight_gram) || 100,
        is_active,
        is_featured,
        meta_title: meta_title.trim() || null,
        meta_description: meta_description.trim() || null,
        size_guide: size_guide.trim() || null,
        care_guide: care_guide.trim() || null,
      },
      variants,
      images: cleanedImages,
      links: cleanedLinks,
      collectionIds: selectedCollections,
    }

    try {
      await onSubmit(payload)
      router.push('/admin/produk')
    } catch (err: unknown) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan produk'
      toast.error(errorMessage)
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-10 font-sans text-xs">
      <AdminPageHeader title={title}>
        <div className="flex items-center gap-2">
          <Link href="/admin/produk">
            <Button variant="outline" className="p-2 border-neutral-200 text-neutral-500 hover:text-neutral-900">
              <ArrowLeft size={14} />
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="text-xs uppercase font-bold tracking-widest py-3 px-6"
          >
            Simpan Produk
          </Button>
        </div>
      </AdminPageHeader>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: General Fields & Variants */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Details Box */}
          <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-5">
            <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 border-b border-neutral-100 pb-2.5">
              Informasi Umum
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Produk*"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="cth: Kemeja Linen Oversized"
                required
              />
              <Input
                label="Slug URL*"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="cth: kemeja-linen-oversized"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Kategori*
                </label>
                <select
                  value={category_id}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none bg-white font-medium"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {catsLoading ? (
                    <option disabled>Memuat kategori...</option>
                  ) : (
                    categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <Input
                label="Berat Default (Gram)*"
                type="number"
                value={weight_gram}
                onChange={(e) => setWeightGram(Math.max(1, parseInt(e.target.value) || 0))}
                required
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Koleksi Kurasi (Opsional)
              </label>
              {colsLoading ? (
                <p className="text-neutral-400 italic text-[11px] animate-pulse">Memuat daftar koleksi...</p>
              ) : !collections || collections.length === 0 ? (
                <p className="text-neutral-400 italic text-[11px]">Belum ada koleksi yang dibuat.</p>
              ) : (
                <div className="flex flex-wrap gap-x-6 gap-y-2.5 p-3 border border-neutral-200 bg-neutral-50/20">
                  {collections.map((col) => {
                    const isChecked = selectedCollections.includes(col.id)
                    return (
                      <div key={col.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`col-select-${col.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCollections((prev) => [...prev, col.id])
                            } else {
                              setSelectedCollections((prev) => prev.filter((id) => id !== col.id))
                            }
                          }}
                          className="w-4 h-4 border-neutral-300 accent-neutral-900 rounded-none focus:ring-0 cursor-pointer"
                        />
                        <label
                          htmlFor={`col-select-${col.id}`}
                          className="select-none text-neutral-700 font-semibold cursor-pointer text-xs animate-none"
                        >
                          {col.name}
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Deskripsi Singkat
              </label>
              <textarea
                value={short_description}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Tulis deskripsi singkat..."
                className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none h-16 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Deskripsi Lengkap
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tulis spesifikasi lengkap, bahan, dan cara perawatan..."
                className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none h-32 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Panduan Ukuran (Size Guide)
              </label>
              <textarea
                value={size_guide}
                onChange={(e) => setSizeGuide(e.target.value)}
                placeholder="Tulis panduan ukuran produk..."
                className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none h-24 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Panduan Perawatan (Care Guide)
              </label>
              <textarea
                value={care_guide}
                onChange={(e) => setCareGuide(e.target.value)}
                placeholder="Tulis petunjuk perawatan produk..."
                className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none h-24 resize-none"
              />
            </div>

            <div className="flex items-center space-x-6 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="product_is_active"
                  checked={is_active}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 border-neutral-300 accent-neutral-900 rounded-none focus:ring-0"
                />
                <label htmlFor="product_is_active" className="select-none text-neutral-700 font-semibold uppercase tracking-wider">
                  Aktifkan Katalog
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="product_is_featured"
                  checked={is_featured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 border-neutral-300 accent-neutral-900 rounded-none focus:ring-0"
                />
                <label htmlFor="product_is_featured" className="select-none text-neutral-700 font-semibold uppercase tracking-wider">
                  Produk Unggulan (Featured)
                </label>
              </div>
            </div>
          </div>

          {/* Variants Form */}
          <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
                Spesifikasi Varian Produk
              </h3>
              <Button
                type="button"
                onClick={handleAddVariant}
                variant="outline"
                className="text-[10px] font-bold uppercase py-1 px-3 border-neutral-800 text-neutral-800 hover:bg-neutral-50"
              >
                <Plus size={12} className="mr-1 inline" /> Tambah Varian
              </Button>
            </div>

            <div className="space-y-6">
              {variants.map((v, vIdx) => (
                <div key={vIdx} className="border border-neutral-200 p-4 relative bg-neutral-50/20 space-y-4 rounded-none">
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(vIdx)}
                      className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <p className="font-semibold text-neutral-900 uppercase tracking-widest text-[10px]">
                    Varian #{vIdx + 1}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Input
                      label="Nama Varian*"
                      value={v.name}
                      onChange={(e) => handleUpdateVariantField(vIdx, 'name', e.target.value)}
                      placeholder="cth: Hitam - S / All Size"
                      required
                    />
                    <Input
                      label="SKU Varian*"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariantField(vIdx, 'sku', e.target.value)}
                      placeholder="cth: BBJ-LNN-BLK-S"
                      required
                    />
                    <Input
                      label="Stok*"
                      type="number"
                      value={v.stock}
                      onChange={(e) => handleUpdateVariantField(vIdx, 'stock', Math.max(0, parseInt(e.target.value) || 0))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Harga Jual (Rupiah)*"
                      type="number"
                      value={v.price}
                      onChange={(e) => handleUpdateVariantField(vIdx, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                      required
                    />
                    <Input
                      label="Harga Coret (Compare Price)"
                      type="number"
                      value={v.compare_price || ''}
                      onChange={(e) => handleUpdateVariantField(vIdx, 'compare_price', e.target.value ? Math.max(0, parseFloat(e.target.value) || 0) : null)}
                    />
                    <Input
                      label="Berat Varian (Gram)"
                      type="number"
                      value={v.weight_gram || ''}
                      onChange={(e) => handleUpdateVariantField(vIdx, 'weight_gram', e.target.value ? Math.max(1, parseInt(e.target.value) || 0) : null)}
                    />
                  </div>

                  {/* Status checkbox for variant */}
                  <div className="flex items-center space-x-2 pt-1 pb-1">
                    <input
                      type="checkbox"
                      id={`variant-active-${vIdx}`}
                      checked={v.is_active}
                      onChange={(e) => handleUpdateVariantField(vIdx, 'is_active', e.target.checked)}
                      className="w-4 h-4 border-neutral-300 accent-neutral-900 rounded-none focus:ring-0 cursor-pointer"
                    />
                    <label
                      htmlFor={`variant-active-${vIdx}`}
                      className="select-none text-neutral-700 font-bold uppercase cursor-pointer tracking-wider text-[10px]"
                    >
                      Aktifkan Varian
                    </label>
                  </div>

                  {/* Variant Images Sub-section */}
                  <div className="space-y-3 pt-2 border-t border-neutral-100">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Gambar Varian</p>
                      <button
                        type="button"
                        onClick={() => {
                          setImages((prev) => [
                            ...prev,
                            {
                              url: '',
                              alt_text: '',
                              sort_order: prev.length,
                              is_primary: false,
                              variant_id: v.id || null,
                            },
                          ])
                        }}
                        className="text-[9px] uppercase font-bold text-neutral-800 hover:underline inline"
                      >
                        + Tambah Gambar Varian
                      </button>
                    </div>

                    {images.filter((img) => img.variant_id === v.id).length > 0 && (
                      <div className="space-y-2.5">
                        {images.map((img, imgIdx) => {
                          if (img.variant_id !== v.id) return null
                          return (
                            <div key={imgIdx} className="flex gap-2 items-center border border-neutral-100 p-2 bg-white">
                              {/* Thumbnail preview */}
                              <div className="w-10 h-10 bg-neutral-50 border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                                {img.url ? (
                                  <Image
                                    src={img.url}
                                    alt={img.alt_text || 'Preview'}
                                    fill
                                    sizes="40px"
                                    unoptimized
                                    className="object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = 'https://placehold.co/150?text=Error'
                                    }}
                                  />
                                ) : (
                                  <span className="text-[7px] text-neutral-400 uppercase font-semibold">No Img</span>
                                )}
                              </div>

                              {/* Input URL */}
                              <input
                                type="text"
                                className="flex-1 px-2 py-1 border border-neutral-200 outline-none text-[10px] bg-white focus:border-neutral-800"
                                value={img.url}
                                onChange={(e) => handleUpdateImageField(imgIdx, 'url', e.target.value)}
                                placeholder="https://... atau unggah"
                                required
                              />

                              {/* File Upload Button */}
                              <input
                                type="file"
                                id={`variant-${vIdx}-file-upload-${imgIdx}`}
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  
                                  const toastId = toast.loading('Mengunggah gambar...')
                                  try {
                                    const publicUrl = await uploadImage(file, 'products')
                                    handleUpdateImageField(imgIdx, 'url', publicUrl)
                                    toast.success('Gambar berhasil diunggah!', { id: toastId })
                                  } catch (err: unknown) {
                                    const errorMessage = err instanceof Error ? err.message : 'Gagal mengunggah gambar'
                                    toast.error(errorMessage, { id: toastId })
                                  }
                                }}
                              />
                              <label
                                htmlFor={`variant-${vIdx}-file-upload-${imgIdx}`}
                                className="cursor-pointer inline-flex items-center text-[8px] font-bold uppercase tracking-wider py-1 px-2 border border-neutral-800 text-neutral-850 hover:bg-neutral-900 hover:text-white transition duration-150 rounded-none bg-white"
                              >
                                Unggah
                              </label>

                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(imgIdx)}
                                className="text-neutral-400 hover:text-red-500 p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Attributes Sub-section */}
                  <div className="space-y-3 pt-2 border-t border-neutral-100">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Atribut Varian (cth: Ukuran/Warna)</p>
                      <button
                        type="button"
                        onClick={() => handleAddVariantAttr(vIdx)}
                        className="text-[9px] uppercase font-bold text-neutral-800 hover:underline inline"
                      >
                        + Tambah Atribut
                      </button>
                    </div>

                    {v.attrs.length > 0 && (
                      <div className="space-y-2">
                        {v.attrs.map((attr, aIdx: number) => (
                          <div key={aIdx} className="flex items-center space-x-2">
                            <input
                              type="text"
                              className="px-2 py-1.5 border border-neutral-200 outline-none text-xs w-28 bg-white focus:border-neutral-800 font-medium"
                              value={attr.attr_name}
                              onChange={(e) => handleUpdateVariantAttrField(vIdx, aIdx, 'attr_name', e.target.value)}
                              placeholder="Nama Atribut"
                            />
                            <input
                              type="text"
                              className="flex-1 px-2 py-1.5 border border-neutral-200 outline-none text-xs bg-white focus:border-neutral-800 font-medium"
                              value={attr.attr_value}
                              onChange={(e) => handleUpdateVariantAttrField(vIdx, aIdx, 'attr_value', e.target.value)}
                              placeholder="Nilai Atribut"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantAttr(vIdx, aIdx)}
                              className="text-neutral-400 hover:text-red-500 p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Images & Platform links & SEO */}
        <div className="space-y-8">
          <ProductImageManager
            images={images}
            variants={variants}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
            onUpdateImageField={handleUpdateImageField}
          />

          <ProductMarketplaceLinks
            marketplaceLinks={marketplaceLinks}
            onAddLink={handleAddLink}
            onRemoveLink={handleRemoveLink}
            onUpdateLinkField={handleUpdateLinkField}
          />

          <ProductSeoFields
            metaTitle={meta_title}
            setMetaTitle={setMetaTitle}
            metaDescription={meta_description}
            setMetaDescription={setMetaDescription}
          />
        </div>
      </div>
    </form>
  )
}
