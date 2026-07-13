'use client'

import React, { useState } from 'react'
import type { Database } from '@/shared/types/database'
import {
  useAdminCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
} from '@/app/admin/hooks/useAdmin'
import {
  Button,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Input,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Modal,
  AdminPageHeader,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DataTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Select,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Textarea,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Switch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DropdownMenu,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DropdownMenuTrigger,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DropdownMenuContent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DropdownMenuItem,
  TableSkeleton,
} from '@/shared/components'
import { Plus, Edit2, Trash2, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/client'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { uploadImage } from '@/lib/supabase/storage'
import { CategoryFormModal } from './components/CategoryFormModal'
import type {} from '@/shared/components/DataTable'

const supabase = createBrowserClient()

type CategoryRow = Database['public']['Tables']['categories']['Row']

export default function AdminCategoryPage(): React.JSX.Element {
  const { data: categoriesResponse, isLoading, isError, refetch } = useAdminCategories()
  const categories = categoriesResponse?.data || []

  const createMutation = useAdminCreateCategory()
  const updateMutation = useAdminUpdateCategory()
  const deleteMutation = useAdminDeleteCategory()

  // Modal control states
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)

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

  const handleOpenEdit = (cat: CategoryRow) => {
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

  const handleDuplicate = (cat: CategoryRow) => {
    setEditingCategory(null)
    setName((cat.name || '') + ' (Copy)')
    setSlug((cat.slug || '') + '-copy')
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

  const handleToggleActive = async (cat: CategoryRow) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !cat.is_active })
        .eq('id', cat.id)

      if (error) throw error
      toast.success('Status aktif berhasil diubah')
      refetch()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }

  const handleDelete = async (id: string) => {
    if (
      confirm(
        'Apakah Anda yakin ingin menghapus kategori ini? (Tidak bisa dihapus jika masih ada produk di dalamnya)'
      )
    ) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success('Kategori berhasil dihapus')
        refetch()
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Gagal menghapus kategori'
        toast.error(errMsg)
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
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Gagal menyimpan kategori'
      toast.error(message)
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
      <AdminPageHeader title="Kategori Produk" subtitle="Kelola hierarki kategori produk.">
        <Button
          onClick={handleOpenAdd}
          className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5"
        >
          <Plus size={14} className="mr-1.5" /> Tambah Kategori
        </Button>
      </AdminPageHeader>

      {/* Main Table */}
      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-8 bg-white border border-neutral-200">
            <TableSkeleton columns={5} rows={5} />
          </div>
        ) : isError ? (
          <div className="py-24 text-center">
            <p className="text-red-500 text-xs font-semibold uppercase">
              Gagal memuat kategori dari server
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block"
            >
              Coba Lagi
            </Button>
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
                      <td className="py-4 px-4 font-mono text-neutral-500">{cat.slug}</td>
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
                          onClick={() => handleDuplicate(cat)}
                          variant="outline"
                          className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                          title="Duplikat Kategori"
                        >
                          <Copy size={13} />
                        </Button>
                        <Button
                          onClick={() => handleOpenEdit(cat)}
                          variant="outline"
                          className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                          title="Edit Kategori"
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
      <CategoryFormModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        editingCategory={editingCategory}
        name={name}
        setName={setName}
        slug={slug}
        setSlug={setSlug}
        parent_id={parent_id}
        setParentId={setParentId}
        description={description}
        setDescription={setDescription}
        image_url={image_url}
        setImageUrl={setImageUrl}
        sort_order={sort_order}
        setSortOrder={setSortOrder}
        is_active={is_active}
        setIsActive={setIsActive}
        handleNameChange={handleNameChange}
        handleSubmit={handleSubmit}
        parentOptions={parentOptions}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
