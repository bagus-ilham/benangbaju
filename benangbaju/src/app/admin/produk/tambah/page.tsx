'use client'

import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'
import { useAdminCreateProduct } from '@/hooks/useAdmin'
import type { ProductPayload } from '@/types/product'
import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const supabase = createBrowserClient()

export default function AdminProductTambahPage() : React.JSX.Element {
  const searchParams = useSearchParams()
  const duplicateId = searchParams.get('duplicate')
  const createMutation = useAdminCreateProduct()

  const { data: duplicateProduct, isLoading } = useQuery({
    queryKey: ['admin', 'product-duplicate', duplicateId],
    queryFn: async () => {
      if (!duplicateId) return null
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*, product_variant_attrs(*)),
          product_images (*),
          product_marketplace_links (*),
          collection_products (*)
        `)
        .eq('id', duplicateId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!duplicateId
  })

  const initialData = useMemo(() => {
    if (!duplicateProduct) return undefined
    
    // Create a copy and clean up specific fields
    const copy = { ...duplicateProduct }
    copy.name = `${copy.name} (Copy)`
    copy.slug = `${copy.slug}-copy`
    
    if (copy.product_variants) {
      const oldToNewIdMap = new Map<string, string>()
      copy.product_variants = copy.product_variants.map((v: any) => {
        const newId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        oldToNewIdMap.set(v.id, newId)
        return {
          ...v,
          id: newId,
          sku: v.sku ? `${v.sku}-COPY` : ''
        }
      })
      if (copy.product_images) {
        copy.product_images = copy.product_images.map((img: any) => {
          if (img.variant_id && oldToNewIdMap.has(img.variant_id)) {
            return {
              ...img,
              variant_id: oldToNewIdMap.get(img.variant_id)
            }
          }
          return img
        })
      }
    }
    
    return copy
  }, [duplicateProduct])

  const handleCreateProduct = async (payload: ProductPayload) => {
    toast.loading('Menambahkan produk...', { id: 'create-product' })
    try {
      await createMutation.mutateAsync(payload)
      toast.success('Produk berhasil ditambahkan!', { id: 'create-product' })
    } catch (err: unknown) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : 'Gagal menambahkan produk'
      toast.error(errorMessage, { id: 'create-product' })
      throw err
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat data duplikasi...</p>
      </div>
    )
  }

  return (
    <ProductForm
      title={duplicateId ? "Duplikat Produk" : "Tambah Produk Baru"}
      initialData={initialData}
      onSubmit={handleCreateProduct}
      isSubmitting={createMutation.isPending}
    />
  )
}

