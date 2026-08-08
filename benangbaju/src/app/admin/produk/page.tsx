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
  Pagination,
  AdminSearchInput,
} from '@/shared/components'
import { SmartLink as Link, HandDrawnIcon } from '@/shared/components'
import { cn } from '@/lib/utils'
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
            type="button"
            className={cn(
              'inline-flex items-center justify-center p-1.5 rounded-lg transition duration-200 focus:outline-none',
              p.is_featured
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-500'
                : 'hover:bg-neutral-100 text-neutral-400'
            )}
            title={p.is_featured ? 'Hapus dari Produk Unggulan' : 'Jadikan Produk Unggulan'}
          >
            <HandDrawnIcon
              name={p.is_featured ? 'star-filled' : 'star'}
              size={20}
              className="w-5 h-5"
            />
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
            className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${p.is_active
                ? 'bg-neutral-900 text-white border border-neutral-900'
                : 'bg-brand-cream text-neutral-400 border border-neutral-200'
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
                  <HandDrawnIcon name="more-horizontal" className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="right">
                <Link href={`/produk/${p.slug}`} target="_blank">
                  <DropdownMenuItem>
                    <HandDrawnIcon name="eye" className="h-3.5 w-3.5 mr-1" /> Lihat di Web
                  </DropdownMenuItem>
                </Link>
                <Link href={`/admin/produk/tambah?duplicate=${p.id}`}>
                  <DropdownMenuItem>
                    <HandDrawnIcon name="copy" className="h-3.5 w-3.5 mr-1" /> Duplikat
                  </DropdownMenuItem>
                </Link>
                <Link href={`/admin/produk/${p.id}`}>
                  <DropdownMenuItem>
                    <HandDrawnIcon name="edit" className="h-3.5 w-3.5 mr-1" /> Edit
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem destructive onClick={() => handleDeleteProduct(p.id)}>
                  <HandDrawnIcon name="trash" className="h-3.5 w-3.5 mr-1" /> Nonaktifkan
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
            <HandDrawnIcon name="plus" className="h-3.5 w-3.5 mr-1.5" /> Tambah Produk
          </Button>
        </Link>
      </AdminPageHeader>

      {/* Filters Toolbar */}
      <div className="flex bg-brand-cream border border-neutral-200 p-4 rounded-2xl items-center space-x-3 shadow-sm">
        <AdminSearchInput
          placeholder="Cari nama produk..."
          value={search}
          onChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
        />
      </div>

      {/* Main Table */}
      <div className="border border-neutral-200 bg-brand-cream rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
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
          <div className="border-t border-neutral-150 px-5 py-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              showInfo
              totalItems={totalCount}
            />
          </div>
        )}
      </div>
    </div>
  )
}
