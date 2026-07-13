'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  useAdminProducts,
  useAdminDeleteProduct,
  useAdminUpdateProductActiveStatus,
  useAdminUpdateProductFeaturedStatus,
} from '@/app/admin/hooks/useAdmin'
import type { AdminProductListItem } from '@/modules/products/types'
import {
  Button,
  AdminPageHeader,
  DataTable,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/components'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Eye,
  Star,
  Copy,
  MoreHorizontal,
} from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import type { Column } from '@/shared/components/DataTable'

export default function AdminProductListPage(): React.JSX.Element {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const { data: dataRes, isLoading, isError, refetch } = useAdminProducts(page, limit, search)

  const deleteMutation = useAdminDeleteProduct()
  const updateActiveStatusMutation = useAdminUpdateProductActiveStatus()
  const updateFeaturedStatusMutation = useAdminUpdateProductFeaturedStatus()

  const handleToggleActive = useCallback(
    async (productId: string, currentStatus: boolean) => {
      try {
        await updateActiveStatusMutation.mutateAsync({ productId, isActive: !currentStatus })
        toast.success('Status aktif berhasil diubah')
        refetch()
      } catch {
        toast.error('Gagal memperbarui status')
      }
    },
    [updateActiveStatusMutation, refetch]
  )

  const handleToggleFeatured = useCallback(
    async (productId: string, currentStatus: boolean) => {
      try {
        await updateFeaturedStatusMutation.mutateAsync({ productId, isFeatured: !currentStatus })
        toast.success('Status unggulan berhasil diubah')
        refetch()
      } catch {
        toast.error('Gagal memperbarui status unggulan')
      }
    },
    [updateFeaturedStatusMutation, refetch]
  )

  const handleDeleteProduct = useCallback(
    async (id: string) => {
      if (confirm('Apakah Anda yakin ingin menonaktifkan produk ini?')) {
        try {
          await deleteMutation.mutateAsync(id)
          toast.success('Produk dinonaktifkan')
          refetch()
        } catch {
          toast.error('Gagal menonaktifkan produk')
        }
      }
    },
    [deleteMutation, refetch]
  )

  const products = dataRes?.data || []
  const totalCount = dataRes?.pagination?.total_count || 0
  const totalPages = Math.ceil(totalCount / limit)

  const columns: Column<AdminProductListItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Nama Produk',
        render: (p) => (
          <div>
            <span className="font-semibold text-neutral-900 text-sm block hover:text-neutral-600 transition">
              {p.name}
            </span>
            <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block font-mono uppercase">
              Slug: {p.slug}
            </span>
          </div>
        ),
      },
      {
        key: 'categories',
        header: 'Kategori',
        render: (p) => p.categories?.name || '-',
      },
      {
        key: 'stock',
        header: <div className="text-center w-full">Total Stok</div>,
        className: 'text-center',
        render: (p) => {
          const totalStock = p.product_variants?.reduce((sum: number, v) => sum + v.stock, 0) || 0
          return (
            <span
              className={
                totalStock === 0 ? 'text-red-500 bg-red-50 px-2 py-0.5 font-bold' : 'font-bold'
              }
            >
              {totalStock}
            </span>
          )
        },
      },
      {
        key: 'featured',
        header: <div className="text-center w-full">Unggulan</div>,
        className: 'text-center',
        render: (p) => (
          <button
            onClick={() => handleToggleFeatured(p.id, p.is_featured)}
            className={`inline-flex items-center justify-center p-1.5 transition ${
              p.is_featured ? 'text-amber-500' : 'text-neutral-300 hover:text-neutral-500'
            }`}
          >
            <Star size={16} fill={p.is_featured ? 'currentColor' : 'none'} />
          </button>
        ),
      },
      {
        key: 'status',
        header: <div className="text-center w-full">Status</div>,
        className: 'text-center',
        render: (p) => (
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
        ),
      },
      {
        key: 'actions',
        header: <div className="text-right w-full">Aksi</div>,
        className: 'text-right',
        render: (p) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                  title="Opsi"
                >
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="right">
                <Link href={`/produk/${p.slug}`} target="_blank">
                  <DropdownMenuItem>
                    <Eye size={14} className="text-neutral-500" /> Lihat di Web
                  </DropdownMenuItem>
                </Link>
                <Link href={`/admin/produk/tambah?duplicate=${p.id}`}>
                  <DropdownMenuItem>
                    <Copy size={14} className="text-neutral-500" /> Duplikat
                  </DropdownMenuItem>
                </Link>
                <Link href={`/admin/produk/${p.id}`}>
                  <DropdownMenuItem>
                    <Edit2 size={14} className="text-neutral-500" /> Edit
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem destructive onClick={() => handleDeleteProduct(p.id)}>
                  <Trash2 size={14} /> Nonaktifkan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [handleToggleActive, handleToggleFeatured, handleDeleteProduct]
  )

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
        {isError ? (
          <div className="py-24 text-center">
            <p className="text-red-500 text-xs font-semibold uppercase">
              Gagal memuat produk dari server
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block"
            >
              Coba Lagi
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            emptyTitle="Tidak ada produk ditemukan"
            emptyDescription={
              search
                ? 'Coba gunakan kata kunci pencarian yang berbeda.'
                : 'Katalog produk masih kosong.'
            }
            className="border-0"
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-150 px-5 py-4 text-xs font-semibold text-neutral-500">
            <span>
              Menampilkan halaman {page} dari {totalPages}
            </span>
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
