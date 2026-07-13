'use client'

import React, { useState } from 'react'
import {
  useAdminCollections,
  useAdminCreateCollection,
  useAdminUpdateCollection,
  useAdminDeleteCollection,
} from '@/app/admin/hooks/useAdmin'
import type { AdminCollectionItem } from '@/modules/collections/types'
import { Button, AdminPageHeader } from '@/shared/components'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { formatLocalISO } from '@/lib/utils/format'
import { CollectionListTable, CollectionFormModal } from './components'

const supabase = createBrowserClient()

export default function AdminCollectionPage(): React.JSX.Element {
  const { data: collectionsRes, isLoading, isError, refetch } = useAdminCollections()
  const collections = collectionsRes?.data || []

  const createMutation = useAdminCreateCollection()
  const updateMutation = useAdminUpdateCollection()
  const deleteMutation = useAdminDeleteCollection()

  // Fetch all products for linking
  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin', 'all-products-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data || []
    },
  })

  // Modal control states
  const [isOpen, setIsOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<AdminCollectionItem | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [image_url, setImageUrl] = useState('')
  const [sort_order, setSortOrder] = useState(0)
  const [starts_at, setStartsAt] = useState('')
  const [ends_at, setEndsAt] = useState('')
  const [is_active, setIsActive] = useState(true)
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, boolean>>({})

  const handleOpenAdd = () => {
    setEditingCollection(null)
    setName('')
    setSlug('')
    setDescription('')
    setImageUrl('')
    setSortOrder(0)
    setStartsAt('')
    setEndsAt('')
    setIsActive(true)
    setSelectedProductIds({})
    setIsOpen(true)
  }

  const handleOpenEdit = (col: AdminCollectionItem) => {
    setEditingCollection(col)
    setName(col.name || '')
    setSlug(col.slug || '')
    setDescription(col.description || '')
    setImageUrl(col.image_url || '')
    setSortOrder(col.sort_order || 0)
    setStartsAt(formatLocalISO(col.starts_at))
    setEndsAt(formatLocalISO(col.ends_at))
    setIsActive(col.is_active !== false)

    // Map selected products
    const initialSelected: Record<string, boolean> = {}
    col.product_ids?.forEach((pid: string) => {
      initialSelected[pid] = true
    })
    setSelectedProductIds(initialSelected)
    setIsOpen(true)
  }

  const handleDuplicate = (col: AdminCollectionItem) => {
    setEditingCollection(null)
    setName((col.name || '') + ' (Copy)')
    setSlug((col.slug || '') + '-copy')
    setDescription(col.description || '')
    setImageUrl(col.image_url || '')
    setSortOrder(col.sort_order || 0)
    setStartsAt(formatLocalISO(col.starts_at))
    setEndsAt(formatLocalISO(col.ends_at))
    setIsActive(col.is_active !== false)

    // Map selected products
    const initialSelected: Record<string, boolean> = {}
    col.product_ids?.forEach((pid: string) => {
      initialSelected[pid] = true
    })
    setSelectedProductIds(initialSelected)
    setIsOpen(true)
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingCollection) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\\s+/g, '-')
          .replace(/-+/g, '-')
      )
    }
  }

  const handleToggleProduct = (pid: string) => {
    setSelectedProductIds((prev) => ({
      ...prev,
      [pid]: !prev[pid],
    }))
  }

  const handleToggleActive = async (col: AdminCollectionItem) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ is_active: !col.is_active })
        .eq('id', col.id)

      if (error) throw error
      toast.success('Status aktif berhasil diubah')
      refetch()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan koleksi ini?')) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success('Koleksi dinonaktifkan')
        refetch()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        toast.error('Gagal menonaktifkan koleksi')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast.error('Nama dan Slug wajib diisi')
      return
    }

    const linkedProductIds = Object.keys(selectedProductIds).filter(
      (pid) => selectedProductIds[pid]
    )

    if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
      toast.error('Tanggal selesai tampil harus setelah tanggal mulai tampil')
      return
    }

    const payload = {
      collectionData: {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        image_url: image_url.trim() || null,
        sort_order: Number(sort_order) || 0,
        starts_at: starts_at ? new Date(starts_at).toISOString() : null,
        ends_at: ends_at ? new Date(ends_at).toISOString() : null,
        is_active,
      },
      productIds: linkedProductIds,
    }

    try {
      if (editingCollection) {
        await updateMutation.mutateAsync({
          collectionId: editingCollection.id,
          ...payload,
        })
        toast.success('Koleksi berhasil diperbarui')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Koleksi berhasil ditambahkan')
      }
      setIsOpen(false)
      refetch()
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Gagal menyimpan koleksi'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Koleksi Kurasi"
        subtitle="Kelola editorial tematik dan promosi musiman."
      >
        <Button
          onClick={handleOpenAdd}
          className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5"
        >
          <Plus size={14} className="mr-1.5" /> Tambah Koleksi
        </Button>
      </AdminPageHeader>

      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        <CollectionListTable
          collections={collections}
          isLoading={isLoading}
          isError={isError}
          onRefetch={refetch}
          onToggleActive={handleToggleActive}
          onEdit={handleOpenEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>

      <CollectionFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        editingCollection={editingCollection}
        name={name}
        handleNameChange={handleNameChange}
        slug={slug}
        setSlug={setSlug}
        description={description}
        setDescription={setDescription}
        image_url={image_url}
        setImageUrl={setImageUrl}
        sort_order={sort_order}
        setSortOrder={setSortOrder}
        starts_at={starts_at}
        setStartsAt={setStartsAt}
        ends_at={ends_at}
        setEndsAt={setEndsAt}
        is_active={is_active}
        setIsActive={setIsActive}
        selectedProductIds={selectedProductIds}
        handleToggleProduct={handleToggleProduct}
        allProducts={allProducts}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
