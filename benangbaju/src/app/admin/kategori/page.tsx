'use client'

import React, { useState } from 'react'
import {
  useAdminCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
} from '@/hooks/useAdmin'
import { Button, Input, Modal, AdminPageHeader } from '@/components/shared'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/client'

const supabase = createBrowserClient()

export default function AdminCategoryPage() {
  const { data: categories = [], isLoading, refetch } = useAdminCategories()

  const createMutation = useAdminCreateCategory()
  const updateMutation = useAdminUpdateCategory()
  const deleteMutation = useAdminDeleteCategory()

  // Modal control states
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [parent_id, setParentId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [image_url, setImageUrl] = useState('')
  const [sort_order, setSortOrder] = useState(0)
  const [is_active, setIsActive] = useState(true)

  const handleOpenAdd = () => {
    setEditingCategory(null)
    setName('')
    setSlug('')
    setParentId(null)
    setDescription('')
    setImageUrl('')
    setSortOrder(0)
    setIsActive(true)
    setIsOpen(true)
  }

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat)
    setName(cat.name || '')
    setSlug(cat.slug || '')
    setParentId(cat.parent_id || '')
    setDescription(cat.description || '')
    setImageUrl(cat.image_url || '')
    setSortOrder(cat.sort_order || 0)
    setIsActive(cat.is_active !== false)
    setIsOpen(true)
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      )
    }
  }

  const handleToggleActive = async (cat: any) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !cat.is_active })
        .eq('id', cat.id)

      if (error) throw error
      toast.success('Status aktif berhasil diubah')
      refetch()
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan kategori ini?')) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success('Kategori dinonaktifkan')
        refetch()
      } catch (err) {
        toast.error('Gagal menonaktifkan kategori')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast.error('Nama dan Slug wajib diisi')
      return
    }

    const payload = {
      parent_id: parent_id === '' || parent_id === null ? null : parent_id,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      image_url: image_url.trim() || null,
      sort_order: Number(sort_order) || 0,
      is_active,
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          categoryId: editingCategory.id,
          categoryData: payload,
        })
        toast.success('Kategori berhasil diperbarui')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Kategori berhasil ditambahkan')
      }
      setIsOpen(false)
      refetch()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal menyimpan kategori')
    }
  }

  // Filter out the category itself to prevent self-reference
  const parentOptions = categories.filter((cat) => {
    if (!editingCategory) return true
    return cat.id !== editingCategory.id
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Kategori Produk"
        subtitle="Kelola hierarki kategori produk."
      >
        <Button onClick={handleOpenAdd} className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5">
          <Plus size={14} className="mr-1.5" /> Tambah Kategori
        </Button>
      </AdminPageHeader>

      {/* Main Table */}
      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat kategori...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 italic text-xs">
            Belum ada kategori ditambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-3 px-5">Nama Kategori</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4 text-center">No. Urut</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                {categories.map((cat) => {
                  const parent = categories.find((c) => c.id === cat.parent_id)
                  
                  return (
                    <tr key={cat.id} className="hover:bg-neutral-50/20 transition duration-150">
                      <td className="py-4 px-5">
                        <span className="font-semibold text-neutral-900 text-sm block">
                          {cat.name}
                        </span>
                        {parent && (
                          <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                            Sub dari: {parent.name}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-neutral-500">
                        {cat.slug}
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-neutral-900">
                        {cat.sort_order}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${
                            cat.is_active
                              ? 'bg-neutral-900 text-white border border-neutral-900'
                              : 'bg-white text-neutral-400 border border-neutral-200'
                          }`}
                        >
                          {cat.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          onClick={() => handleOpenEdit(cat)}
                          variant="outline"
                          className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          onClick={() => handleDelete(cat.id)}
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
      </div>

      {/* Modal Form editor */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingCategory ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nama Kategori*"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="cth: Kemeja Linen"
              required
            />
            <Input
              label="Slug URL*"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="cth: kemeja-linen"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Kategori Induk (Parent)
              </label>
              <select
                value={parent_id || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none bg-white font-medium"
              >
                <option value="">Tidak ada (Kategori Utama)</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Nomor Urut Tampil*"
              type="number"
              value={sort_order}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <Input
            label="URL Gambar"
            value={image_url}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Deskripsi Kategori
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tulis deskripsi singkat..."
              className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none h-20 resize-none"
            />
          </div>

          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="cat_is_active"
              checked={is_active}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 border-neutral-300 accent-neutral-900 rounded-none focus:ring-0"
            />
            <label htmlFor="cat_is_active" className="select-none text-neutral-700 font-semibold uppercase tracking-wider">
              Kategori Aktif
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
