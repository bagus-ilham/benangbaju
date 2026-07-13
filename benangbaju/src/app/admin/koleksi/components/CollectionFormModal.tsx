'use client'

import React from 'react'
import { Modal, Input, Textarea, Checkbox, Switch, Button } from '@/shared/components'
import toast from 'react-hot-toast'
import { uploadImage } from '@/lib/supabase/storage'

export function CollectionFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingCollection,
  name,
  handleNameChange,
  slug,
  setSlug,
  description,
  setDescription,
  image_url,
  setImageUrl,
  sort_order,
  setSortOrder,
  starts_at,
  setStartsAt,
  ends_at,
  setEndsAt,
  is_active,
  setIsActive,
  selectedProductIds,
  handleToggleProduct,
  allProducts,
  isPending,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCollection ? 'Ubah Koleksi' : 'Tambah Koleksi Baru'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-5 text-xs font-sans">
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

        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="space-y-1">
            <Input
              label="URL Gambar Banner"
              value={image_url}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... atau unggah gambar"
            />
            <div className="flex items-center gap-2 mt-1">
              <input
                type="file"
                id="collection-image-upload"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  const toastId = toast.loading('Mengunggah gambar...')
                  try {
                    const publicUrl = await uploadImage(file, 'banners')
                    setImageUrl(publicUrl)
                    toast.success('Gambar berhasil diunggah!', { id: toastId })
                  } catch (err: unknown) {
                    const message =
                      err instanceof Error ? err.message : 'Gagal mengunggah gambar koleksi'
                    toast.error(message, { id: toastId })
                  }
                }}
              />
              <label
                htmlFor="collection-image-upload"
                className="cursor-pointer inline-flex items-center text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 border border-neutral-800 text-neutral-850 hover:bg-neutral-900 hover:text-white transition duration-150 rounded-none bg-white"
              >
                Unggah Gambar
              </label>
            </div>
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
          <Textarea
            label="Deskripsi Koleksi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tulis deskripsi singkat tentang koleksi..."
            rows={3}
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              allProducts.map((p: any) => (
                <div key={p.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`link-prod-${p.id}`}
                    checked={!!selectedProductIds[p.id]}
                    onChange={() => handleToggleProduct(p.id)}
                  />
                  <label
                    htmlFor={`link-prod-${p.id}`}
                    className="select-none text-neutral-700 cursor-pointer"
                  >
                    {p.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 py-1">
          <Switch
            id="col_is_active"
            checked={is_active}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor="col_is_active"
            className="select-none text-[10px] text-neutral-700 font-semibold uppercase tracking-wider cursor-pointer"
          >
            Koleksi Aktif
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
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
