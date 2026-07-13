'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminCategories } from '@/modules/categories/hooks/useAdminCategories'
import { useAdminCollections } from '@/modules/collections/hooks/useAdminCollections'
import { Button, AdminPageHeader } from '@/shared/components'
import { ArrowLeft } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { ProductImageManager } from './ProductImageManager'
import { ProductGeneralInfoSection } from './ProductGeneralInfoSection'
import { ProductVariantsSection } from './ProductVariantsSection'
import { ProductMarketplaceLinks } from './ProductMarketplaceLinks'
import { ProductSeoFields } from './ProductSeoFields'

import type { ProductPayload } from '@/modules/products/types'
import { productSchema, ProductFormValues, mapInitialDataToForm } from './ProductForm.schema'

export interface InitialProductVariantAttr {
  attr_name: string
  attr_value: string
}

export interface InitialProductVariant {
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

export interface InitialProductImage {
  id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  variant_id: string | null
}

export interface InitialProductLink {
  platform: string
  url: string
  label: string | null
  sort_order: number
}

export interface InitialCollectionProduct {
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
  const { data: catsRes, isLoading: catsLoading } = useAdminCategories()
  const categories = catsRes?.data || []
  const { data: collectionsRes, isLoading: colsLoading } = useAdminCollections()
  const collections = collectionsRes?.data || []

  const { watch, setValue, handleSubmit, reset } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: mapInitialDataToForm(initialData),
  })

  // Reset form when initialData is loaded asynchronously
  useEffect(() => {
    if (initialData) {
      reset(mapInitialDataToForm(initialData))
    }
  }, [initialData, reset])

  // Watch root objects to pass to sub-components
  const productData = watch('productData')
  const variants = watch('variants')
  const images = watch('images')
  const links = watch('links')
  const collectionIds = watch('collectionIds')

  // --- Handlers for Sub-Components ---
  // (We use setValue to update RHF state, so we don't need to rewrite all sub-components)

  const handleNameChange = (val: string) => {
    setValue('productData.name', val, { shouldValidate: true })
    if (!initialData) {
      setValue(
        'productData.slug',
        val
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-'),
        { shouldValidate: true }
      )
    }
  }

  const handleToggleCollection = (id: string, isChecked: boolean) => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const current = watch('collectionIds')
    if (isChecked) {
      setValue('collectionIds', [...current, id])
    } else {
      setValue(
        'collectionIds',
        current.filter((colId) => colId !== id)
      )
    }
  }

  const handleAddVariant = () => {
    const current = watch('variants')
    setValue('variants', [
      ...current,
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
    const current = watch('variants')
    setValue(
      'variants',
      current.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    )
  }

  const handleRemoveVariant = (idx: number) => {
    const currentVariants = watch('variants')
    const currentImages = watch('images')
    const variantToRemove = currentVariants[idx]

    setValue(
      'variants',
      currentVariants.filter((_, i) => i !== idx)
    )

    if (variantToRemove?.id) {
      setValue(
        'images',
        currentImages.filter((img) => img.variant_id !== variantToRemove.id)
      )
    }
  }

  const handleDuplicateVariant = (idx: number) => {
    const currentVariants = watch('variants')
    const currentImages = watch('images')
    const variantToCopy = currentVariants[idx]
    if (!variantToCopy) return

    const newId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    const copy = {
      ...variantToCopy,
      id: newId,
      sku: variantToCopy.sku ? `${variantToCopy.sku}-COPY` : '',
      name: variantToCopy.name ? `${variantToCopy.name} (Copy)` : '',
      attrs: variantToCopy.attrs.map((a) => ({ ...a })),
    }

    setValue('variants', [...currentVariants, copy])

    const variantImages = currentImages.filter((img) => img.variant_id === variantToCopy.id)
    if (variantImages.length > 0) {
      const newImages = variantImages.map((img) => ({
        ...img,
        variant_id: newId,
      }))
      setValue('images', [...currentImages, ...newImages])
    }
    toast.success('Varian berhasil diduplikat')
  }

  const handleAddVariantAttr = (vIdx: number) => {
    const currentVariants = watch('variants')
    setValue(
      'variants',
      currentVariants.map((v, i) =>
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
    const currentVariants = watch('variants')
    setValue(
      'variants',
      currentVariants.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              attrs: v.attrs.map((attr, j) => (j === aIdx ? { ...attr, [field]: value } : attr)),
            }
          : v
      )
    )
  }

  const handleRemoveVariantAttr = (vIdx: number, aIdx: number) => {
    const currentVariants = watch('variants')
    setValue(
      'variants',
      currentVariants.map((v, i) =>
        i === vIdx
          ? {
              ...v,
              attrs: v.attrs.filter((_, j) => j !== aIdx),
            }
          : v
      )
    )
  }

  const handleAddImage = (variantId?: string | null | React.MouseEvent) => {
    const vId = typeof variantId === 'string' ? variantId : null
    const currentImages = watch('images')
    setValue('images', [
      ...currentImages,
      {
        url: '',
        alt_text: '',
        sort_order: currentImages.length,
        is_primary: !vId && currentImages.filter((i) => !i.variant_id).length === 0,
        variant_id: vId,
      },
    ])
  }

  const handleUpdateImageField = (
    idx: number,
    field: string,
    value: string | number | boolean | null
  ) => {
    const currentImages = watch('images')
    setValue(
      'images',
      currentImages.map((img, i) => {
        if (field === 'is_primary' && value === true) {
          return { ...img, [field]: i === idx }
        }
        return i === idx ? { ...img, [field]: value } : img
      })
    )
  }

  const handleRemoveImage = (idx: number) => {
    const currentImages = watch('images')
    const isRemovingPrimary = currentImages[idx]?.is_primary
    const filtered = currentImages.filter((_, i) => i !== idx)

    if (isRemovingPrimary) {
      const firstMainIndex = filtered.findIndex((img) => !img.variant_id)
      if (firstMainIndex !== -1) {
        setValue(
          'images',
          filtered.map((img, i) => (i === firstMainIndex ? { ...img, is_primary: true } : img))
        )
        return
      }
    }
    setValue('images', filtered)
  }

  const handleAddLink = () => {
    const currentLinks = watch('links')
    setValue('links', [
      ...currentLinks,
      {
        platform: 'shopee',
        url: '',
        label: 'Cek di Shopee',
        sort_order: currentLinks.length,
      },
    ])
  }

  const handleUpdateLinkField = (idx: number, field: string, value: string | number | null) => {
    const currentLinks = watch('links')
    setValue(
      'links',
      currentLinks.map((link, i) => (i === idx ? { ...link, [field]: value } : link))
    )
  }

  const handleRemoveLink = (idx: number) => {
    const currentLinks = watch('links')
    setValue(
      'links',
      currentLinks.filter((_, i) => i !== idx)
    )
  }

  // Submit Handler
  const handleValidSubmit = async (data: ProductFormValues) => {
    const cleanedVariants = data.variants.map((v) => ({
      ...v,
      compare_price: v.compare_price ?? null,
      weight_gram: v.weight_gram ?? null,
      attrs: v.attrs.filter((a) => a.attr_name.trim() !== '' && a.attr_value.trim() !== ''),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any

    const payload: ProductPayload = {
      productData: {
        category_id: data.productData.category_id,
        name: data.productData.name.trim(),
        slug: data.productData.slug.trim(),
        description: data.productData.description?.trim() || null,
        short_description: data.productData.short_description?.trim() || null,
        weight_gram: data.productData.weight_gram,
        is_active: data.productData.is_active,
        is_featured: data.productData.is_featured,
        meta_title: data.productData.meta_title?.trim() || null,
        meta_description: data.productData.meta_description?.trim() || null,
        size_guide: data.productData.size_guide?.trim() || null,
        care_guide: data.productData.care_guide?.trim() || null,
      },
      variants: cleanedVariants,
      images: data.images
        .filter((img) => img.url.trim() !== '')
        .map((img) => ({
          ...img,
          alt_text: img.alt_text ?? null,
          variant_id: img.variant_id ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any,
      links: data.links
        .filter((link) => link.url.trim() !== '')
        .map((link) => ({
          ...link,
          label: link.label ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any,
      collectionIds: data.collectionIds,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInvalidSubmit = (errors: any) => {
    console.error('Form validation errors:', errors)
    // Display the first error message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstError = Object.values(errors)[0] as any
    if (firstError?.message) {
      toast.error(firstError.message)
    } else if (firstError?.root?.message) {
      toast.error(firstError.root.message)
    } else {
      toast.error('Terdapat data yang belum lengkap atau tidak valid')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      className="space-y-10 font-sans text-xs"
    >
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ProductGeneralInfoSection
            name={productData.name}
            onNameChange={handleNameChange}
            slug={productData.slug}
            onSlugChange={(val) => setValue('productData.slug', val)}
            categoryId={productData.category_id}
            onCategoryChange={(val) => setValue('productData.category_id', val)}
            weightGram={productData.weight_gram}
            onWeightGramChange={(val) => setValue('productData.weight_gram', val)}
            shortDescription={productData.short_description || ''}
            onShortDescriptionChange={(val) => setValue('productData.short_description', val)}
            description={productData.description || ''}
            onDescriptionChange={(val) => setValue('productData.description', val)}
            sizeGuide={productData.size_guide || ''}
            onSizeGuideChange={(val) => setValue('productData.size_guide', val)}
            careGuide={productData.care_guide || ''}
            onCareGuideChange={(val) => setValue('productData.care_guide', val)}
            isActive={productData.is_active}
            onIsActiveChange={(val) => setValue('productData.is_active', val)}
            isFeatured={productData.is_featured}
            onIsFeaturedChange={(val) => setValue('productData.is_featured', val)}
            categories={categories}
            catsLoading={catsLoading}
            collections={collections}
            colsLoading={colsLoading}
            selectedCollections={collectionIds}
            onToggleCollection={handleToggleCollection}
          />

          <ProductVariantsSection
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variants={variants as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            images={images as any}
            onAddVariant={handleAddVariant}
            onUpdateVariantField={handleUpdateVariantField}
            onRemoveVariant={handleRemoveVariant}
            onDuplicateVariant={handleDuplicateVariant}
            onAddVariantAttr={handleAddVariantAttr}
            onUpdateVariantAttrField={handleUpdateVariantAttrField}
            onRemoveVariantAttr={handleRemoveVariantAttr}
            onAddImage={handleAddImage}
            onUpdateImageField={handleUpdateImageField}
            onRemoveImage={handleRemoveImage}
          />
        </div>

        <div className="space-y-8">
          <ProductImageManager
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            images={images as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variants={variants as any}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
            onUpdateImageField={handleUpdateImageField}
          />

          <ProductMarketplaceLinks
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            marketplaceLinks={links as any}
            onAddLink={handleAddLink}
            onRemoveLink={handleRemoveLink}
            onUpdateLinkField={handleUpdateLinkField}
          />

          <ProductSeoFields
            metaTitle={productData.meta_title || ''}
            setMetaTitle={(val) => setValue('productData.meta_title', val)}
            metaDescription={productData.meta_description || ''}
            setMetaDescription={(val) => setValue('productData.meta_description', val)}
          />
        </div>
      </div>
    </form>
  )
}
