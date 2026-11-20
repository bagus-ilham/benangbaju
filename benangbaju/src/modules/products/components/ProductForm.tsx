'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminCategories } from '@/modules/categories/hooks/useAdminCategories'
import { useAdminCollections } from '@/modules/collections/hooks/useAdminCollections'
import { Button, AdminPageHeader, HandDrawnIcon, SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { ProductImageManager } from './ProductImageManager'
import { ProductGeneralInfoSection } from './ProductGeneralInfoSection'
import { ProductVariantsSection } from './ProductVariantsSection'
import { ProductMarketplaceLinks } from './ProductMarketplaceLinks'
import { ProductSeoFields } from './ProductSeoFields'

import type { ProductPayload } from '@/modules/products/types'
import { productSchema, type ProductFormValues, mapInitialDataToForm } from './ProductForm.schema'
import {
  buildProductPayload,
  useProductFormHandlers,
} from '@/modules/products/hooks/useProductFormHandlers'

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
  price_myr?: number | string | null
  compare_price_myr?: number | string | null
  stock: number
  stock_my?: number
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
  short_description_en?: string | null
  description_en?: string | null
  care_guide_en?: string | null
  size_guide?: string | null
  size_guide_inch?: string | null
  hs_code?: string | null
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

  const { watch, setValue, getValues, handleSubmit, reset } = useForm<ProductFormValues>({
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
  // eslint-disable-next-line react-hooks/incompatible-library
  const productData = watch('productData')
  const variants = watch('variants')
  const images = watch('images')
  const links = watch('links')
  const collectionIds = watch('collectionIds')

  const handlers = useProductFormHandlers({
    isEdit: Boolean(initialData),
    setValue,
    getValues,
  })

  const handleValidSubmit = async (data: ProductFormValues) => {
    const payload = buildProductPayload(data)
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
              className="p-2 border-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center"
            >
              <HandDrawnIcon name="arrow-left" className="w-3.5 h-3.5" />
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
            onNameChange={handlers.handleNameChange}
            slug={productData.slug}
            onSlugChange={(val) => setValue('productData.slug', val)}
            categoryId={productData.category_id}
            onCategoryChange={(val) => setValue('productData.category_id', val)}
            weightGram={productData.weight_gram}
            onWeightGramChange={(val) => setValue('productData.weight_gram', val)}
            hsCode={productData.hs_code || ''}
            onHsCodeChange={(val) => setValue('productData.hs_code', val)}
            shortDescription={productData.short_description || ''}
            onShortDescriptionChange={(val) => setValue('productData.short_description', val)}
            shortDescriptionEn={productData.short_description_en || ''}
            onShortDescriptionEnChange={(val) => setValue('productData.short_description_en', val)}
            description={productData.description || ''}
            onDescriptionChange={(val) => setValue('productData.description', val)}
            descriptionEn={productData.description_en || ''}
            onDescriptionEnChange={(val) => setValue('productData.description_en', val)}
            sizeGuide={productData.size_guide || ''}
            onSizeGuideChange={(val) => setValue('productData.size_guide', val)}
            sizeGuideInch={productData.size_guide_inch || ''}
            onSizeGuideInchChange={(val) => setValue('productData.size_guide_inch', val)}
            careGuide={productData.care_guide || ''}
            onCareGuideChange={(val) => setValue('productData.care_guide', val)}
            careGuideEn={productData.care_guide_en || ''}
            onCareGuideEnChange={(val) => setValue('productData.care_guide_en', val)}
            isActive={productData.is_active}
            onIsActiveChange={(val) => setValue('productData.is_active', val)}
            isFeatured={productData.is_featured}
            onIsFeaturedChange={(val) => setValue('productData.is_featured', val)}
            categories={categories}
            catsLoading={catsLoading}
            collections={collections}
            colsLoading={colsLoading}
            selectedCollections={collectionIds}
            onToggleCollection={handlers.handleToggleCollection}
          />

          <ProductVariantsSection
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variants={variants as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            images={images as any}
            onAddVariant={handlers.handleAddVariant}
            onUpdateVariantField={handlers.handleUpdateVariantField}
            onRemoveVariant={handlers.handleRemoveVariant}
            onDuplicateVariant={handlers.handleDuplicateVariant}
            onAddVariantAttr={handlers.handleAddVariantAttr}
            onUpdateVariantAttrField={handlers.handleUpdateVariantAttrField}
            onRemoveVariantAttr={handlers.handleRemoveVariantAttr}
            onAddImage={handlers.handleAddImage}
            onUpdateImageField={handlers.handleUpdateImageField}
            onRemoveImage={handlers.handleRemoveImage}
          />
        </div>

        <div className="space-y-8">
          <ProductImageManager
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            images={images as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variants={variants as any}
            onAddImage={handlers.handleAddImage}
            onRemoveImage={handlers.handleRemoveImage}
            onUpdateImageField={handlers.handleUpdateImageField}
          />

          <ProductMarketplaceLinks
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            marketplaceLinks={links as any}
            onAddLink={handlers.handleAddLink}
            onRemoveLink={handlers.handleRemoveLink}
            onUpdateLinkField={handlers.handleUpdateLinkField}
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
