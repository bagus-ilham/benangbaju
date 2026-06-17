'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminCategories } from '@/hooks/useAdmin'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ProductFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  isSubmitting: boolean
  title: string
}

export function ProductForm({ initialData, onSubmit, isSubmitting, title }: ProductFormProps) {
  const router = useRouter()
  const { data: categories, isLoading: catsLoading } = useAdminCategories()

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

  // Variants state
  const [variants, setVariants] = useState<any[]>([])

  // Images state (multiple URLs)
  const [images, setImages] = useState<any[]>([])

  // Marketplace links state
  const [marketplaceLinks, setMarketplaceLinks] = useState<any[]>([])

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

      // Map variants
      if (initialData.product_variants) {
        setVariants(
          initialData.product_variants.map((v: any) => ({
            id: v.id,
            sku: v.sku || '',
            name: v.name || '',
            price: Number(v.price) || 0,
            compare_price: v.compare_price ? Number(v.compare_price) : null,
            stock: v.stock || 0,
            weight_gram: v.weight_gram || null,
            is_active: v.is_active !== false,
            // Parse attributes
            attrs: v.product_variant_attrs?.map((a: any) => ({
              attr_name: a.attr_name,
              attr_value: a.attr_value,
            })) || [],
          }))
        )
      }

      // Map images
      if (initialData.product_images) {
        setImages(
          initialData.product_images.map((img: any) => ({
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
          initialData.product_marketplace_links.map((link: any) => ({
            platform: link.platform || 'shopee',
            url: link.url || '',
            label: link.label || '',
            sort_order: link.sort_order || 0,
          }))
        )
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
          variant_id: '',
        },
      ])
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

  const handleUpdateVariantField = (idx: number, field: string, value: any) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    )
  }

  const handleRemoveVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx))
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
              attrs: v.attrs.map((attr: any, j: number) =>
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
              attrs: v.attrs.filter((_: any, j: number) => j !== aIdx),
            }
          : v
      )
    )
  }

  // Images handlers
  const handleAddImage = () => {
    setImages((prev) => [
      ...prev,
      {
        url: '',
        alt_text: '',
        sort_order: prev.length,
        is_primary: prev.length === 0,
        variant_id: '',
      },
    ])
  }

  const handleUpdateImageField = (idx: number, field: string, value: any) => {
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

  const handleUpdateLinkField = (idx: number, field: string, value: any) => {
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
      },
      variants,
      images: cleanedImages,
      links: cleanedLinks,
    }

    try {
      await onSubmit(payload)
      router.push('/admin/produk')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal menyimpan produk')
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-10 font-sans text-xs">
      {/* Top action header */}
      <div className="flex justify-between items-center border-b border-neutral-100 pb-5">
        <div className="flex items-center space-x-3">
          <Link href="/admin/produk">
            <Button variant="outline" className="p-2 border-neutral-200 text-neutral-500 hover:text-neutral-900">
              <ArrowLeft size={14} />
            </Button>
          </Link>
          <h2 className="text-xl font-serif text-neutral-900 tracking-tight">{title}</h2>
        </div>
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="text-xs uppercase font-bold tracking-widest py-3 px-6"
        >
          Simpan Produk
        </Button>
      </div>

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
                        {v.attrs.map((attr: any, aIdx: number) => (
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
          {/* Images Section */}
          <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
                Daftar URL Gambar
              </h3>
              <Button
                type="button"
                onClick={handleAddImage}
                variant="outline"
                className="text-[9px] font-bold uppercase py-0.5 px-2 border-neutral-850"
              >
                + Tambah URL
              </Button>
            </div>

            {images.length === 0 ? (
              <p className="text-[11px] text-neutral-400 italic">Belum ada gambar ditambahkan. Silakan tambah url gambar.</p>
            ) : (
              <div className="space-y-4">
                {images.map((img, idx) => (
                  <div key={idx} className="border border-neutral-200 p-3 relative rounded-none space-y-2 bg-neutral-50/10">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute right-2 top-2 text-neutral-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={12} />
                    </button>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-semibold text-neutral-400 uppercase">URL Gambar</label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 border border-neutral-200 outline-none text-[11px] bg-white focus:border-neutral-850"
                        value={img.url}
                        onChange={(e) => handleUpdateImageField(idx, 'url', e.target.value)}
                        placeholder="https://..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="block text-[9px] font-semibold text-neutral-400 uppercase">Alt Text</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-neutral-200 outline-none bg-white"
                          value={img.alt_text}
                          onChange={(e) => handleUpdateImageField(idx, 'alt_text', e.target.value)}
                          placeholder="Keterangan foto"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-neutral-400 uppercase">No. Urut</label>
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-neutral-200 outline-none bg-white text-center"
                          value={img.sort_order}
                          onChange={(e) => handleUpdateImageField(idx, 'sort_order', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-semibold text-neutral-400 uppercase">Tautkan ke Varian</label>
                      <select
                        className="w-full px-2 py-1.5 border border-neutral-200 bg-white text-[11px] font-medium"
                        value={img.variant_id || ''}
                        onChange={(e) => handleUpdateImageField(idx, 'variant_id', e.target.value || null)}
                      >
                        <option value="">Semua Varian (Gambar Umum)</option>
                        {variants.map((v, vIdx) => (
                          <option key={v.id || vIdx} value={v.id || `temp-${vIdx}`}>
                            {v.name || `Varian #${vIdx + 1}`} ({v.sku || 'Tanpa SKU'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5 pt-1">
                      <input
                        type="checkbox"
                        id={`img-primary-${idx}`}
                        checked={img.is_primary}
                        onChange={(e) => handleUpdateImageField(idx, 'is_primary', e.target.checked)}
                        className="w-3.5 h-3.5 border-neutral-300 accent-neutral-900 rounded-none"
                      />
                      <label htmlFor={`img-primary-${idx}`} className="select-none text-[10px] text-neutral-600 font-bold uppercase">
                        Gambar Utama
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Marketplace Links Section */}
          <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
              <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
                Platform Marketplace (E-Commerce)
              </h3>
              <Button
                type="button"
                onClick={handleAddLink}
                variant="outline"
                className="text-[9px] font-bold uppercase py-0.5 px-2 border-neutral-850"
              >
                + Tambah Link
              </Button>
            </div>

            {marketplaceLinks.length === 0 ? (
              <p className="text-[11px] text-neutral-400 italic">Belum ada link marketplace.</p>
            ) : (
              <div className="space-y-4">
                {marketplaceLinks.map((link, idx) => (
                  <div key={idx} className="border border-neutral-200 p-3 relative rounded-none space-y-2 bg-neutral-50/10">
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="absolute right-2 top-2 text-neutral-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={12} />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-semibold text-neutral-400 uppercase">Platform</label>
                        <select
                          className="w-full px-2 py-1.5 border border-neutral-200 bg-white"
                          value={link.platform}
                          onChange={(e) => handleUpdateLinkField(idx, 'platform', e.target.value)}
                        >
                          <option value="shopee">Shopee</option>
                          <option value="tiktok">TikTok Shop</option>
                          <option value="tokopedia">Tokopedia</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-semibold text-neutral-400 uppercase">Label Tombol</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1.5 border border-neutral-200 bg-white"
                          value={link.label}
                          onChange={(e) => handleUpdateLinkField(idx, 'label', e.target.value)}
                          placeholder="Cek di Shopee"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-semibold text-neutral-400 uppercase">URL Link</label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 border border-neutral-200 bg-white"
                        value={link.url}
                        onChange={(e) => handleUpdateLinkField(idx, 'url', e.target.value)}
                        placeholder="https://shopee.co.id/..."
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO Details Box */}
          <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 border-b border-neutral-100 pb-2.5">
              Meta SEO Tags (Opsional)
            </h3>
            <Input
              label="Meta Title (SEO)"
              value={meta_title}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="SEO Title produk"
            />
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Meta Description (SEO)
              </label>
              <textarea
                value={meta_description}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="SEO Description untuk mesin pencarian..."
                className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none h-20 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
