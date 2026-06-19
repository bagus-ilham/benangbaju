'use client'
 
import React, { useState } from 'react'
import {
  useAdminProducts,
  useAdminDeleteProduct,
  useAdminUpdateProductActiveStatus,
  useAdminUpdateProductFeaturedStatus
} from '@/hooks/useAdmin'
import type { AdminProductListItem } from '@/services/products'
import { Button, AdminPageHeader } from '@/components/shared'
import { Input } from '@/components/shared/Input'
import { Plus, Search, Edit2, Trash2, ArrowLeft, ArrowRight, Eye, Star } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
 
export default function AdminProductListPage() : React.JSX.Element {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10
 
  const { data, isLoading, isError, refetch } = useAdminProducts(page, limit, search)
  const deleteMutation = useAdminDeleteProduct()
  const updateActiveStatusMutation = useAdminUpdateProductActiveStatus()
  const updateFeaturedStatusMutation = useAdminUpdateProductFeaturedStatus()
 
  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      await updateActiveStatusMutation.mutateAsync({ productId, isActive: !currentStatus })
      toast.success('Status aktif berhasil diubah')
      refetch()
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }
 
  const handleToggleFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      await updateFeaturedStatusMutation.mutateAsync({ productId, isFeatured: !currentStatus })
      toast.success('Status unggulan berhasil diubah')
      refetch()
    } catch (err) {
      toast.error('Gagal memperbarui status unggulan')
    }
  }
 
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan produk ini?')) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success('Produk dinonaktifkan')
        refetch()
      } catch (err) {
        toast.error('Gagal menonaktifkan produk')
      }
    }
  }

  const products = data?.products || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Daftar Produk"
        subtitle="Kelola katalog produk, harga, varian, dan stok."
      >
        <Link href="/admin/produk/tambah">
          <Button className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5">
            <Plus size={14} className="mr-1.5" /> Tambah Produk
          </Button>
        </Link>
      </AdminPageHeader>

      {/* Filters Toolbar */}
      <div className="flex bg-white border border-neutral-200 p-4 rounded-none items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 text-neutral-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Cari nama produk..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none transition"
            aria-label="Cari nama produk"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat produk...</p>
          </div>
        ) : isError ? (
          <div className="py-24 text-center">
            <p className="text-red-500 text-xs font-semibold uppercase">Gagal memuat produk dari server</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block">
              Coba Lagi
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 italic text-xs">
            Tidak ada produk ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-3 px-5">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Total Stok</th>
                  <th className="py-3 px-4 text-center">Unggulan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                {products.map((p: AdminProductListItem) => {
                  const totalStock = p.product_variants?.reduce((sum: number, v) => sum + v.stock, 0) || 0
                  
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/20 transition duration-150">
                      <td className="py-4 px-5">
                        <span className="font-semibold text-neutral-900 text-sm block hover:text-neutral-600 transition">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block font-mono uppercase">
                          Slug: {p.slug}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-neutral-600">
                        {p.categories?.name || '-'}
                      </td>
                      <td className="py-4 px-4 text-center font-bold">
                        <span className={totalStock === 0 ? 'text-red-500 bg-red-50 px-2 py-0.5 font-bold' : ''}>
                          {totalStock}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(p.id, p.is_featured)}
                          className={`inline-flex items-center justify-center p-1.5 transition ${
                            p.is_featured ? 'text-amber-500' : 'text-neutral-300 hover:text-neutral-500'
                          }`}
                        >
                          <Star size={16} fill={p.is_featured ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(p.id, p.is_active)}
                          className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${
                            p.is_active
                              ? 'bg-neutral-900 text-white border border-neutral-900'
                              : 'bg-white text-neutral-400 border border-neutral-200'
                          }`}
                        >
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <Link href={`/produk/${p.slug}`} target="_blank">
                          <Button variant="outline" className="p-2 border-neutral-200 text-neutral-500 hover:text-neutral-900">
                            <Eye size={13} />
                          </Button>
                        </Link>
                        <Link href={`/admin/produk/${p.id}`}>
                          <Button variant="outline" className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900">
                            <Edit2 size={13} />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleDeleteProduct(p.id)}
                          variant="outline"
                          className="p-2 border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-150 px-5 py-4 text-xs font-semibold text-neutral-500">
            <span>Menampilkan halaman {page} dari {totalPages}</span>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-2 border-neutral-200"
              >
                <ArrowLeft size={14} />
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="p-2 border-neutral-200"
              >
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
