'use client'

import React from 'react'
import { ProductForm } from '@/components/admin/ProductForm'
import { useAdminCreateProduct } from '@/hooks/useAdmin'
import type { ProductPayload } from '@/types/product'
import toast from 'react-hot-toast'

export default function AdminProductTambahPage() : React.JSX.Element {
  const createMutation = useAdminCreateProduct()

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

  return (
    <ProductForm
      title="Tambah Produk Baru"
      onSubmit={handleCreateProduct}
      isSubmitting={createMutation.isPending}
    />
  )
}
