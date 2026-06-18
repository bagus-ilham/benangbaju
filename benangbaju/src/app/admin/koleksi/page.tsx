'use client'

import React, { useState, useEffect } from 'react'
import {
  useAdminCollections,
  useAdminCreateCollection,
  useAdminUpdateCollection,
  useAdminDeleteCollection,
} from '@/hooks/useAdmin'
import { Button, Input, Modal, AdminPageHeader } from '@/components/shared'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { formatLocalISO } from '@/lib/utils/format'

const supabase = createBrowserClient()

export default function AdminCollectionPage() {
  const { data: collections = [], isLoading, refetch } = useAdminCollections()
  
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
    }
  })

  // Modal control states
  const [isOpen, setIsOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<any | null>(null)

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

  const handleOpenEdit = (col: any) => {
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

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingCollection) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
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

  const handleToggleActive = async (col: any) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ is_active: !col.is_active })
        .eq('id', col.id)

      if (error) throw error
      toast.success('Status aktif berhasil diubah')
      refetch()
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

    const linkedProductIds = Object.keys(selectedProductIds).filter((pid) => selectedProductIds[pid])

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
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal menyimpan koleksi')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Koleksi Kurasi"
        subtitle="Kelola editorial tematik dan promosi musiman."
      >
        <Button onClick={handleOpenAdd} className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5">
          <Plus size={14} className="mr-1.5" /> Tambah Koleksi
        </Button>
      </AdminPageHeader>

      {/* Main Table */}
      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat koleksi...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 italic text-xs">
            Belum ada koleksi kurasi ditambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-3 px-5">Nama Koleksi</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4 text-center">Produk Terkait</th>
                  <th className="py-3 px-4 text-center">No. Urut</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                {collections.map((col: any) => (
                  <tr key={col.id} className="hover:bg-neutral-50/20 transition duration-150">
                    <td className="py-4 px-5">
                      <span className="font-semibold text-neutral-900 text-sm block">
                        {col.name}
                      </span>
                      {col.starts_at && (
                        <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                          Periode: {new Date(col.starts_at).toLocaleDateString()} -{' '}
                          {col.ends_at ? new Date(col.ends_at).toLocaleDateString() : 'Selamanya'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-neutral-500">
                      {col.slug}
                    </td>
                    <td className="py-4 px-4 text-center font-bold">
                      {col.product_ids?.length || 0} Produk
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-neutral-900">
                      {col.sort_order}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(col)}
                        className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${
                          col.is_active
                            ? 'bg-neutral-900 text-white border border-neutral-900'
                            : 'bg-white text-neutral-400 border border-neutral-200'
                        }`}
                      >
                        {col.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        onClick={() => handleOpenEdit(col)}
                        variant="outline"
                        className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(col.id)}
                        variant="outline"
                        className="p-2 border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form editor */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingCollection ? 'Ubah Koleksi' : 'Tambah Koleksi Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nama Koleksi*"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="cth: Edisi Lebaran 2026"
              required
            />
            <Input
              label="Slug URL*"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="cth: edisi-lebaran-2026"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai Tampil"
              type="datetime-local"
              value={starts_at}
              onChange={(e) => setStartsAt(e.target.value)}
            />
            <Input
              label="Tanggal Selesai Tampil"
              type="datetime-local"
              value={ends_at}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="URL Gambar Banner"
              value={image_url}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Nomor Urut Tampil*"
              type="number"
              value={sort_order}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Deskripsi Koleksi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tulis deskripsi singkat tentang koleksi..."
              className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none h-16 resize-none"
            />
          </div>

          {/* Linking Products Checkbox Grid */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Pilih Produk untuk Dikaitkan
            </label>
            <div className="border border-neutral-200 p-3 max-h-40 overflow-y-auto space-y-2 rounded-none">
              {allProducts.length === 0 ? (
                <p className="text-neutral-400 italic">Belum ada produk aktif.</p>
              ) : (
                allProducts.map((p) => (
                  <div key={p.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`link-prod-${p.id}`}
                      checked={!!selectedProductIds[p.id]}
                      onChange={() => handleToggleProduct(p.id)}
                      className="w-4 h-4 border-neutral-300 accent-neutral-900 rounded-none focus:ring-0"
                    />
                    <label htmlFor={`link-prod-${p.id}`} className="select-none text-neutral-700 cursor-pointer">
                      {p.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="col_is_active"
              checked={is_active}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 border-neutral-300 accent-neutral-900 rounded-none focus:ring-0"
            />
            <label htmlFor="col_is_active" className="select-none text-neutral-700 font-semibold uppercase tracking-wider">
              Koleksi Aktif
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
