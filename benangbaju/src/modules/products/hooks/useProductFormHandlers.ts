'use client'

import type React from 'react'
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form'
import toast from 'react-hot-toast'
import { generateSlug } from '@/lib/utils'
import type { ProductPayload } from '@/modules/products/types'
import type { ProductFormValues } from '../components/ProductForm.schema'

function generateTempVariantId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function buildProductPayload(data: ProductFormValues): ProductPayload {
  const cleanedVariants = data.variants.map((v) => ({
    ...v,
    compare_price: v.compare_price ?? null,
    price_myr: v.price_myr != null && Number(v.price_myr) > 0 ? Number(v.price_myr) : null,
    compare_price_myr:
      v.compare_price_myr != null && Number(v.compare_price_myr) > 0
        ? Number(v.compare_price_myr)
        : null,
    stock_my: Math.max(0, Number(v.stock_my) || 0),
    weight_gram: v.weight_gram ?? null,
    attrs: v.attrs.filter((a) => a.attr_name.trim() !== '' && a.attr_value.trim() !== ''),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any

  return {
    productData: {
      category_id: data.productData.category_id,
      name: data.productData.name.trim(),
      slug: data.productData.slug.trim(),
      description: data.productData.description?.trim() || null,
      short_description: data.productData.short_description?.trim() || null,
      short_description_en: data.productData.short_description_en?.trim() || null,
      description_en: data.productData.description_en?.trim() || null,
      care_guide_en: data.productData.care_guide_en?.trim() || null,
      weight_gram: data.productData.weight_gram,
      is_active: data.productData.is_active,
      is_featured: data.productData.is_featured,
      meta_title: data.productData.meta_title?.trim() || null,
      meta_description: data.productData.meta_description?.trim() || null,
      size_guide: data.productData.size_guide?.trim() || null,
      size_guide_inch: data.productData.size_guide_inch?.trim() || null,
      hs_code: data.productData.hs_code?.trim() || null,
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
}

interface UseProductFormHandlersParams {
  isEdit: boolean
  setValue: UseFormSetValue<ProductFormValues>
  getValues: UseFormGetValues<ProductFormValues>
}

export function useProductFormHandlers({
  isEdit,
  setValue,
  getValues,
}: UseProductFormHandlersParams) {
  const handleNameChange = (val: string) => {
    setValue('productData.name', val, { shouldValidate: true })
    if (!isEdit) {
      setValue('productData.slug', generateSlug(val), { shouldValidate: true })
    }
  }

  const handleToggleCollection = (id: string, isChecked: boolean) => {
    const current = getValues('collectionIds')
    setValue(
      'collectionIds',
      isChecked ? [...current, id] : current.filter((colId) => colId !== id)
    )
  }

  const handleAddVariant = () => {
    const current = getValues('variants')
    setValue('variants', [
      ...current,
      {
        id: generateTempVariantId(),
        sku: '',
        name: '',
        price: 0,
        compare_price: null,
        price_myr: null,
        compare_price_myr: null,
        stock: 0,
        stock_my: 0,
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
    const current = getValues('variants')
    setValue(
      'variants',
      current.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    )
  }

  const handleRemoveVariant = (idx: number) => {
    const currentVariants = getValues('variants')
    const currentImages = getValues('images')
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
    const currentVariants = getValues('variants')
    const currentImages = getValues('images')
    const variantToCopy = currentVariants[idx]
    if (!variantToCopy) return

    const newId = generateTempVariantId()
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
    const currentVariants = getValues('variants')
    setValue(
      'variants',
      currentVariants.map((v, i) =>
        i === vIdx ? { ...v, attrs: [...v.attrs, { attr_name: 'Warna', attr_value: '' }] } : v
      )
    )
  }

  const handleUpdateVariantAttrField = (
    vIdx: number,
    aIdx: number,
    field: string,
    value: string
  ) => {
    const currentVariants = getValues('variants')
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
    const currentVariants = getValues('variants')
    setValue(
      'variants',
      currentVariants.map((v, i) =>
        i === vIdx ? { ...v, attrs: v.attrs.filter((_, j) => j !== aIdx) } : v
      )
    )
  }

  const handleAddImage = (variantId?: string | null | React.MouseEvent) => {
    const vId = typeof variantId === 'string' ? variantId : null
    const currentImages = getValues('images')
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
    const currentImages = getValues('images')
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
    const currentImages = getValues('images')
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
    const currentLinks = getValues('links')
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
    const currentLinks = getValues('links')
    setValue(
      'links',
      currentLinks.map((link, i) => (i === idx ? { ...link, [field]: value } : link)),
      { shouldDirty: true }
    )
  }

  const handleRemoveLink = (idx: number) => {
    const currentLinks = getValues('links')
    setValue(
      'links',
      currentLinks.filter((_, i) => i !== idx),
      { shouldDirty: true }
    )
  }

  return {
    handleNameChange,
    handleToggleCollection,
    handleAddVariant,
    handleUpdateVariantField,
    handleRemoveVariant,
    handleDuplicateVariant,
    handleAddVariantAttr,
    handleUpdateVariantAttrField,
    handleRemoveVariantAttr,
    handleAddImage,
    handleUpdateImageField,
    handleRemoveImage,
    handleAddLink,
    handleUpdateLinkField,
    handleRemoveLink,
  }
}
