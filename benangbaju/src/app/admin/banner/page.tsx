'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import type { Database } from '@/types/database'
import {
  useAdminBanners,
  useAdminCreateBanner,
  useAdminUpdateBanner,
  useAdminDeleteBanner,
} from '@/hooks/useAdmin'
import { Button, Input, Modal, AdminPageHeader, Select, Switch } from '@/components/shared'
import { Plus, Edit2, Trash2, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/client'
import { formatLocalISO } from '@/lib/utils/format'
import { uploadImage } from '@/lib/supabase/storage'

const supabase = createBrowserClient()

type BannerRow = Database['public']['Tables']['banners']['Row']

export default function AdminBannersPage() : React.JSX.Element {
  const { data: banners = [], isLoading, isError, refetch } = useAdminBanners()

  const createMutation = useAdminCreateBanner()
  const updateMutation = useAdminUpdateBanner()
  const deleteMutation = useAdminDeleteBanner()

  // Modal control states
  const [isOpen, setIsOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [image_url, setImageUrl] = useState('')
  const [image_mobile_url, setImageMobileUrl] = useState('')
  const [link_url, setLinkUrl] = useState('')
  const [position, setPosition] = useState('homepage_hero')
  const [sort_order, setSortOrder] = useState(0)
  const [starts_at, setStartsAt] = useState('')
  const [ends_at, setEndsAt] = useState('')
  const [is_active, setIsActive] = useState(true)

  const handleOpenAdd = () => {
    setEditingBanner(null)
    setTitle('')
    setSubtitle('')
    setImageUrl('')
    setImageMobileUrl('')
    setLinkUrl('')
    setPosition('homepage_hero')
    setSortOrder(0)
    setStartsAt('')
    setEndsAt('')
    setIsActive(true)
    setIsOpen(true)
  }

  const handleOpenEdit = (b: BannerRow) => {
    setEditingBanner(b)
    setTitle(b.title || '')
    setSubtitle(b.subtitle || '')
    setImageUrl(b.image_url || '')
    setImageMobileUrl(b.image_mobile_url || '')
    setLinkUrl(b.link_url || '')
    setPosition(b.position || 'homepage_hero')
    setSortOrder(b.sort_order || 0)
    setStartsAt(formatLocalISO(b.starts_at))
    setEndsAt(formatLocalISO(b.ends_at))
    setIsActive(b.is_active !== false)
    setIsOpen(true)
  }

  const handleDuplicate = (b: BannerRow) => {
    setEditingBanner(null)
    setTitle((b.title || 'Untitled Banner') + ' (Copy)')
    setSubtitle(b.subtitle || '')
    setImageUrl(b.image_url || '')
    setImageMobileUrl(b.image_mobile_url || '')
    setLinkUrl(b.link_url || '')
    setPosition(b.position || 'homepage_hero')
    setSortOrder(b.sort_order || 0)
    setStartsAt(formatLocalISO(b.starts_at))
    setEndsAt(formatLocalISO(b.ends_at))
    setIsActive(b.is_active !== false)
    setIsOpen(true)
  }

  const handleToggleActive = async (b: BannerRow) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !b.is_active })
        .eq('id', b.id)

      if (error) throw error
      toast.success('Status aktif berhasil diubah')
      refetch()
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan banner ini?')) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success('Banner dinonaktifkan')
        refetch()
      } catch (err) {
        toast.error('Gagal menonaktifkan banner')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image_url.trim()) {
      toast.error('URL Gambar Desktop wajib diisi')
      return
    }

    if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
      toast.error('Tanggal selesai berlaku harus setelah tanggal mulai aktif')
      return
    }

    const payload = {
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
      image_url: image_url.trim(),
      image_mobile_url: image_mobile_url.trim() || null,
      link_url: link_url.trim() || null,
      position,
      sort_order: Number(sort_order) || 0,
      starts_at: starts_at ? new Date(starts_at).toISOString() : null,
      ends_at: ends_at ? new Date(ends_at).toISOString() : null,
      is_active,
    }

    try {
      if (editingBanner) {
        await updateMutation.mutateAsync({
          bannerId: editingBanner.id,
          bannerData: payload,
        })
        toast.success('Banner berhasil diperbarui')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Banner berhasil ditambahkan')
      }
      setIsOpen(false)
      refetch()
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Gagal menyimpan banner'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Banner Promosi"
        subtitle="Kelola slide promosi halaman depan toko."
      >
        <Button onClick={handleOpenAdd} className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5">
          <Plus size={14} className="mr-1.5" /> Tambah Banner
        </Button>
      </AdminPageHeader>

      {/* Main Table */}
      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat banner...</p>
          </div>
        ) : isError ? (
          <div className="py-24 text-center">
            <p className="text-red-500 text-xs font-semibold uppercase">Gagal memuat banner dari server</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block">
              Coba Lagi
            </Button>
          </div>
        ) : banners.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 italic text-xs">
            Belum ada banner promosi ditambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-3 px-5">Banner Preview</th>
                  <th className="py-3 px-4">Posisi</th>
                  <th className="py-3 px-4 text-center">No. Urut</th>
                  <th className="py-3 px-4 text-center">Periode Aktif</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                {banners.map((b: BannerRow) => (
                  <tr key={b.id} className="hover:bg-neutral-50/20 transition duration-150">
                    <td className="py-4 px-5 flex items-center space-x-3.5">
                      <div className="w-24 h-12 bg-neutral-100 border border-neutral-200 flex-shrink-0 relative overflow-hidden select-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <Image
                          src={b.image_url || ''}
                          alt={b.title || ''}
                          fill
                          sizes="96px"
                          unoptimized
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/600x300?text=No+Image'
                          }}
                        />
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-900 text-sm block">
                          {b.title || 'Untitled Banner'}
                        </span>
                        {b.subtitle && (
                          <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                            {b.subtitle}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-neutral-500 uppercase text-[10px] tracking-wider font-semibold">
                      {b.position === 'homepage_hero' ? 'Hero Slider' : 'Mid Banner'}
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-neutral-900">
                      {b.sort_order}
                    </td>
                    <td className="py-4 px-4 text-center text-neutral-500">
                      {b.starts_at ? (
                        <>
                          <p>{new Date(b.starts_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-neutral-400">s.d {b.ends_at ? new Date(b.ends_at).toLocaleDateString() : 'Selamanya'}</p>
                        </>
                      ) : (
                        'Selamanya'
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(b)}
                        className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${
                          b.is_active
                            ? 'bg-neutral-900 text-white border border-neutral-900'
                            : 'bg-white text-neutral-400 border border-neutral-200'
                        }`}
                      >
                        {b.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        onClick={() => handleDuplicate(b)}
                        variant="outline"
                        className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                        title="Duplikat Banner"
                      >
                        <Copy size={13} />
                      </Button>
                      <Button
                        onClick={() => handleOpenEdit(b)}
                        variant="outline"
                        className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                        title="Edit Banner"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(b.id)}
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
        title={editingBanner ? 'Ubah Banner' : 'Tambah Banner Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                      src={image_url}
                      alt="Desktop Preview"
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/150?text=Error'
                      }}
                    />
                  ) : (
                    <span className="text-[8px] text-neutral-400 uppercase font-semibold">No Image</span>
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
                          const message = err instanceof Error ? err.message : 'Gagal mengunggah gambar desktop'
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
                <div className="w-12 h-16 bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                  {image_mobile_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                      src={image_mobile_url}
                      alt="Mobile Preview"
                      fill
                      sizes="40px"
                      unoptimized
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/150?text=Error'
                      }}
                    />
                  ) : (
                    <span className="text-[8px] text-neutral-400 uppercase font-semibold">No Image</span>
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
                          const message = err instanceof Error ? err.message : 'Gagal mengunggah gambar mobile'
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
                  { label: 'Banner Tengah Halaman', value: 'mid_banner' }
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
            <label htmlFor="banner_is_active" className="select-none text-[10px] text-neutral-700 font-semibold uppercase tracking-wider cursor-pointer">
              Banner Aktif & Ditampilkan
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
