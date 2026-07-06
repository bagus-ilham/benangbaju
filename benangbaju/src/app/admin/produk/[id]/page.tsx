'use client'

import React, { use, Suspense } from 'react'
import { ProductForm } from '@/modules/products/components/ProductForm'
import { useAdminUpdateProduct } from '@/app/admin/hooks/useAdmin'
import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { SmartLink as Link } from '@/shared/components'
import { Button } from '@/shared/components/Button'
import { ArrowLeft } from 'lucide-react'
import type { ProductPayload } from '@/modules/products/types'

const supabase = createBrowserClient()

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

function AdminProductEditContent({ params }: EditProductPageProps): React.JSX.Element {
  const { id: productId } = use(params)
  const updateMutation = useAdminUpdateProduct()

  // Fetch product detail for editing
  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'product-edit', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_variants (*, product_variant_attrs(*)),
          product_images (*),
          product_marketplace_links (*),
          collection_products (*)
        `
        )
        .eq('id', productId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!productId,
  })

  const handleUpdateProduct = async (payload: ProductPayload) => {
    toast.loading('Menyimpan perubahan...', { id: 'update-product' })
    try {
      await updateMutation.mutateAsync({
        productId,
        productData: payload.productData,
        variants: payload.variants,
        images: payload.images,
        links: payload.links,
        collectionIds: payload.collectionIds,
      })
      toast.success('Produk berhasil diperbarui!', { id: 'update-product' })
      refetch()
    } catch (err: unknown) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : 'Gagal memperbarui produk'
      toast.error(errorMessage, { id: 'update-product' })
      throw err
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
          Memuat detail produk...
        </p>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-500 text-sm">Gagal memuat detail produk untuk diedit.</p>
        <Link href="/admin/produk">
          <Button variant="outline" className="text-xs uppercase border-neutral-200">
            <ArrowLeft size={13} className="mr-1 inline" /> Kembali ke Daftar
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <ProductForm
      title="Ubah Produk"
      initialData={product}
      onSubmit={handleUpdateProduct}
      isSubmitting={updateMutation.isPending}
    />
  )
}

export default function AdminProductEditPage({ params }: EditProductPageProps): React.JSX.Element {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat produk...</div>}>
      <AdminProductEditContent params={params} />
    </Suspense>
  )
}
