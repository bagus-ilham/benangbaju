'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminCategories } from '@/entities/category/api/useAdminCategories'
import { useAdminCollections } from '@/entities/collection/api/useAdminCollections'
import { Button, AdminPageHeader } from '@/shared/components'
import { ArrowLeft } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { ProductImageManager } from './ProductImageManager'
import { ProductGeneralInfoSection } from './ProductGeneralInfoSection'
import { ProductVariantsSection } from './ProductVariantsSection'
import { ProductMarketplaceLinks } from './ProductMarketplaceLinks'
import { ProductSeoFields } from './ProductSeoFields'

import type {
  ProductPayload,
  ProductVariantPayload,
  ProductImagePayload,
  ProductLinkPayload,
} from '@/entities/product/model/product.types'

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

export interface InitialProductData {
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

export function ProductForm({
  initialData,
  onSubmit,
  isSubmitting,
  title,
}: ProductFormProps): React.JSX.Element {
  const router = useRouter()
  const { data: categories, isLoading: catsLoading } = useAdminCategories()
  const { data: collectionsRes, isLoading: colsLoading } = useAdminCollections()
  const collections = collectionsRes?.data || []

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

  // Populate data on edit mode (using derived state to avoid cascading renders)
  const [prevInitialData, setPrevInitialData] = useState<InitialProductData | undefined>(undefined)
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData)
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
            attrs:
              v.product_variant_attrs?.map((a: InitialProductVariantAttr) => ({
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
  }

  // Helper auto-generate slug
  const handleToggleCollection = (id: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedCollections((prev) => [...prev, id])
    } else {
      setSelectedCollections((prev) => prev.filter((colId) => colId !== id))
    }
  }

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

  const handleUpdateVariantField = (
    idx: number,
    field: string,
    value: string | number | boolean | null | Array<{ attr_name: string; attr_value: string }>
  ) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)))
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

  const handleUpdateVariantAttrField = (
    vIdx: number,
    aIdx: number,
    field: string,
    value: string
  ) => {
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

  const handleAddImage = (variantId?: string | null | React.MouseEvent) => {
    const vId = typeof variantId === 'string' ? variantId : null
    setImages((prev) => [
      ...prev,
      {
        url: '',
        alt_text: '',
        sort_order: prev.length,
        is_primary: !vId && prev.filter((i) => !i.variant_id).length === 0,
        variant_id: vId,
      },
    ])
  }

  const handleUpdateImageField = (
    idx: number,
    field: string,
    value: string | number | boolean | null
  ) => {
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
    setImages((prev) => {
      const isRemovingPrimary = prev[idx]?.is_primary
      const filtered = prev.filter((_, i) => i !== idx)
      
      if (isRemovingPrimary) {
        const firstMainIndex = filtered.findIndex((img) => !img.variant_id)
        if (firstMainIndex !== -1) {
          return filtered.map((img, i) =>
            i === firstMainIndex ? { ...img, is_primary: true } : img
          )
        }
      }
      return filtered
    })
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

    const cleanedVariants = variants.map((v) => ({
      ...v,
      attrs: v.attrs.filter((a) => a.attr_name.trim() !== '' && a.attr_value.trim() !== ''),
    }))

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
      variants: cleanedVariants,
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
            <Button
              variant="outline"
              className="p-2 border-neutral-200 text-neutral-500 hover:text-neutral-900"
            >
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
          <ProductGeneralInfoSection
            name={name}
            onNameChange={handleNameChange}
            slug={slug}
            onSlugChange={setSlug}
            categoryId={category_id}
            onCategoryChange={setCategoryId}
            weightGram={weight_gram}
            onWeightGramChange={setWeightGram}
            shortDescription={short_description}
            onShortDescriptionChange={setShortDescription}
            description={description}
            onDescriptionChange={setDescription}
            sizeGuide={size_guide}
            onSizeGuideChange={setSizeGuide}
            careGuide={care_guide}
            onCareGuideChange={setCareGuide}
            isActive={is_active}
            onIsActiveChange={setIsActive}
            isFeatured={is_featured}
            onIsFeaturedChange={setIsFeatured}
            categories={categories}
            catsLoading={catsLoading}
            collections={collections}
            colsLoading={colsLoading}
            selectedCollections={selectedCollections}
            onToggleCollection={handleToggleCollection}
          />

          <ProductVariantsSection
            variants={variants}
            images={images}
            onAddVariant={handleAddVariant}
            onUpdateVariantField={handleUpdateVariantField}
            onRemoveVariant={handleRemoveVariant}
            onAddVariantAttr={handleAddVariantAttr}
            onUpdateVariantAttrField={handleUpdateVariantAttrField}
            onRemoveVariantAttr={handleRemoveVariantAttr}
            onAddImage={handleAddImage}
            onUpdateImageField={handleUpdateImageField}
            onRemoveImage={handleRemoveImage}
          />
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
