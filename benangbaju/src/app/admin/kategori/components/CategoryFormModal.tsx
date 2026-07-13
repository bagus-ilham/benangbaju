import React from 'react'
import { Modal, Input, Select, Textarea, Switch, Button } from '@/shared/components'
import { uploadImage } from '@/lib/supabase/storage'
import toast from 'react-hot-toast'
import type { Database } from '@/shared/types/database'

type CategoryRow = Database['public']['Tables']['categories']['Row']

interface CategoryFormModalProps {
  isOpen: boolean
  setIsOpen: (val: boolean) => void
  editingCategory: CategoryRow | null
  name: string
  setName: (val: string) => void
  slug: string
  setSlug: (val: string) => void
  parent_id: string | null
  setParentId: (val: string | null) => void
  description: string
  setDescription: (val: string) => void
  image_url: string
  setImageUrl: (val: string) => void
  sort_order: number
  setSortOrder: (val: number) => void
  is_active: boolean
  setIsActive: (val: boolean) => void
  handleNameChange: (val: string) => void
  handleSubmit: (e: React.FormEvent) => void
  parentOptions: CategoryRow[]
  isPending: boolean
}

export function CategoryFormModal({
  isOpen,
  setIsOpen,
  editingCategory,
  name,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setName,
  slug,
  setSlug,
  parent_id,
  setParentId,
  description,
  setDescription,
  image_url,
  setImageUrl,
  sort_order,
  setSortOrder,
  is_active,
  setIsActive,
  handleNameChange,
  handleSubmit,
  parentOptions,
  isPending,
}: CategoryFormModalProps): React.JSX.Element {
  return (
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
            <Select
              label="Kategori Induk (Parent)"
              value={parent_id || ''}
              onChange={(val) => setParentId(val || null)}
              options={[
                { label: 'Tidak ada (Kategori Utama)', value: '' },
                ...parentOptions.map((c) => ({ label: c.name, value: c.id })),
              ]}
            />
          </div>

          <Input
            label="Nomor Urut Tampil*"
            type="number"
            value={sort_order}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            required
          />
        </div>

        <div className="space-y-1">
          <Input
            label="URL Gambar"
            value={image_url}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... atau unggah gambar"
          />
          <div className="flex items-center gap-2 mt-1">
            <input
              type="file"
              id="category-image-upload"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                const toastId = toast.loading('Mengunggah gambar kategori...')
                try {
                  const publicUrl = await uploadImage(file, 'products')
                  setImageUrl(publicUrl)
                  toast.success('Gambar kategori berhasil diunggah!', { id: toastId })
                } catch (err: unknown) {
                  const message =
                    err instanceof Error ? err.message : 'Gagal mengunggah gambar kategori'
                  toast.error(message, { id: toastId })
                }
              }}
            />
            <label
              htmlFor="category-image-upload"
              className="cursor-pointer inline-flex items-center text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 border border-neutral-800 text-neutral-850 hover:bg-neutral-900 hover:text-white transition duration-150 rounded-none bg-white"
            >
              Unggah Gambar
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <Textarea
            label="Deskripsi Kategori"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tulis deskripsi singkat..."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2 py-1">
          <Switch
            id="cat_is_active"
            checked={is_active}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor="cat_is_active"
            className="select-none text-[10px] text-neutral-700 font-semibold uppercase tracking-wider cursor-pointer"
          >
            Kategori Aktif
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" isLoading={isPending}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
