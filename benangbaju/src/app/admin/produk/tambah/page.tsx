'use client'

import React from 'react'
import { ProductForm } from '@/components/admin/ProductForm'
import { useAdminCreateProduct } from '@/hooks/useAdmin'
import toast from 'react-hot-toast'

export default function AdminProductTambahPage() {
  const createMutation = useAdminCreateProduct()

  const handleCreateProduct = async (payload: any) => {
    toast.loading('Menambahkan produk...', { id: 'create-product' })
    try {
      const res = await createMutation.mutateAsync(payload)
      toast.success('Produk berhasil ditambahkan!', { id: 'create-product' })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal menambahkan produk', { id: 'create-product' })
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
