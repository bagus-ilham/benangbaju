'use client'

import React from 'react'
import Image from 'next/image'
import { Modal, Input, Select, Switch, Button } from '@/shared/components'
import toast from 'react-hot-toast'
import { uploadImage } from '@/lib/supabase/storage'

export function BannerFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingBanner,
  title,
  setTitle,
  subtitle,
  setSubtitle,
  image_url,
  setImageUrl,
  image_mobile_url,
  setImageMobileUrl,
  link_url,
  setLinkUrl,
  position,
  setPosition,
  sort_order,
  setSortOrder,
  starts_at,
  setStartsAt,
  ends_at,
  setEndsAt,
  is_active,
  setIsActive,
  isPending,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBanner ? 'Ubah Banner' : 'Tambah Banner Baru'}
    >
      <form onSubmit={onSubmit} className="space-y-5 text-xs font-sans">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Judul Banner"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="cth: New Collection Edisi Summer"
          />
          <Input
            label="Sub-judul Banner"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="cth: Diskon hingga 30% untuk produk terpilih"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Desktop Banner Image Uploader & Preview */}
          <div className="border border-neutral-200 p-4 space-y-3 bg-neutral-50/10">
            <span className="block text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70">
              Gambar Desktop*
            </span>
            <div className="flex gap-3 items-start">
              <div className="w-20 h-10 bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                {image_url ? (
                  <Image
                    src={image_url}
                    alt="Desktop Preview"
                    fill
                    sizes="80px"
                    unoptimized
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/150?text=Error'
                    }}
                  />
                ) : (
                  <span className="text-[8px] text-neutral-400 uppercase font-semibold">
                    No Image
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  className="w-full px-2 py-1.5 border border-neutral-200 outline-none text-[11px] bg-white focus:border-neutral-800"
                  value={image_url}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... atau unggah gambar"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="banner-upload-desktop"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      const toastId = toast.loading('Mengunggah gambar desktop...')
                      try {
                        const publicUrl = await uploadImage(file, 'banners')
                        setImageUrl(publicUrl)
                        toast.success('Gambar desktop berhasil diunggah!', { id: toastId })
                      } catch (err: unknown) {
                        const message =
                          err instanceof Error ? err.message : 'Gagal mengunggah gambar desktop'
                        toast.error(message, { id: toastId })
                      }
                    }}
                  />
                  <label
                    htmlFor="banner-upload-desktop"
                    className="cursor-pointer inline-flex items-center text-[9px] font-bold uppercase tracking-wider py-1 px-2.5 border border-neutral-800 text-neutral-850 hover:bg-neutral-900 hover:text-white transition duration-150 rounded-none"
                  >
                    Unggah Desktop
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Banner Image Uploader & Preview */}
          <div className="border border-neutral-200 p-4 space-y-3 bg-neutral-50/10">
            <span className="block text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70">
              Gambar Mobile (Opsional)
            </span>
            <div className="flex gap-3 items-start">
              <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                {image_mobile_url ? (
                  <Image
                    src={image_mobile_url}
                    alt="Mobile Preview"
                    fill
                    sizes="40px"
                    unoptimized
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/150?text=Error'
                    }}
                  />
                ) : (
                  <span className="text-[8px] text-neutral-400 uppercase font-semibold">
                    No Image
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  className="w-full px-2 py-1.5 border border-neutral-200 outline-none text-[11px] bg-white focus:border-neutral-800"
                  value={image_mobile_url}
                  onChange={(e) => setImageMobileUrl(e.target.value)}
                  placeholder="https://... atau unggah gambar"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="banner-upload-mobile"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      const toastId = toast.loading('Mengunggah gambar mobile...')
                      try {
                        const publicUrl = await uploadImage(file, 'banners')
                        setImageMobileUrl(publicUrl)
                        toast.success('Gambar mobile berhasil diunggah!', { id: toastId })
                      } catch (err: unknown) {
                        const message =
                          err instanceof Error ? err.message : 'Gagal mengunggah gambar mobile'
                        toast.error(message, { id: toastId })
                      }
                    }}
                  />
                  <label
                    htmlFor="banner-upload-mobile"
                    className="cursor-pointer inline-flex items-center text-[9px] font-bold uppercase tracking-wider py-1 px-2.5 border border-neutral-800 text-neutral-850 hover:bg-neutral-900 hover:text-white transition duration-150 rounded-none"
                  >
                    Unggah Mobile
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1 col-span-1">
            <Select
              label="Posisi Tampil*"
              value={position}
              onChange={setPosition}
              options={[
                { label: 'Hero Slider Depan', value: 'homepage_hero' },
                { label: 'Banner Tengah Halaman', value: 'mid_banner' },
              ]}
              required
            />
          </div>

          <Input
            label="URL Link Tujuan Klik"
            value={link_url}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/produk atau /kategori/kemeja"
          />

          <Input
            label="Nomor Urut Tampil*"
            type="number"
            value={sort_order}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Mulai Aktif"
            type="datetime-local"
            value={starts_at}
            onChange={(e) => setStartsAt(e.target.value)}
          />
          <Input
            label="Selesai Berlaku"
            type="datetime-local"
            value={ends_at}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 py-1">
          <Switch
            id="banner_is_active"
            checked={is_active}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor="banner_is_active"
            className="select-none text-[10px] text-neutral-700 font-semibold uppercase tracking-wider cursor-pointer"
          >
            Banner Aktif & Ditampilkan
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
