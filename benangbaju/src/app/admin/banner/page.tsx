'use client'

import React, { useState } from 'react'
import type { Database } from '@/shared/types/database'
import {
  useAdminBanners,
  useAdminCreateBanner,
  useAdminUpdateBanner,
  useAdminDeleteBanner,
} from '@/app/admin/hooks/useAdmin'
import { Button, AdminPageHeader } from '@/shared/components'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/client'
import { formatLocalISO } from '@/lib/utils/format'
import { BannerListTable, BannerFormModal } from './components'

const supabase = createBrowserClient()

type BannerRow = Database['public']['Tables']['banners']['Row']

export default function AdminBannersPage(): React.JSX.Element {
  const { data: bannersRes, isLoading, isError, refetch } = useAdminBanners()
  const banners = bannersRes?.data || []

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      title: title.trim(),
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
      <AdminPageHeader title="Banner Promosi" subtitle="Kelola slide promosi halaman depan toko.">
        <Button
          onClick={handleOpenAdd}
          className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5"
        >
          <Plus size={14} className="mr-1.5" /> Tambah Banner
        </Button>
      </AdminPageHeader>

      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        <BannerListTable
          banners={banners}
          isLoading={isLoading}
          isError={isError}
          onRefetch={refetch}
          onToggleActive={handleToggleActive}
          onEdit={handleOpenEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>

      <BannerFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        editingBanner={editingBanner}
        title={title}
        setTitle={setTitle}
        subtitle={subtitle}
        setSubtitle={setSubtitle}
        image_url={image_url}
        setImageUrl={setImageUrl}
        image_mobile_url={image_mobile_url}
        setImageMobileUrl={setImageMobileUrl}
        link_url={link_url}
        setLinkUrl={setLinkUrl}
        position={position}
        setPosition={setPosition}
        sort_order={sort_order}
        setSortOrder={setSortOrder}
        starts_at={starts_at}
        setStartsAt={setStartsAt}
        ends_at={ends_at}
        setEndsAt={setEndsAt}
        is_active={is_active}
        setIsActive={setIsActive}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
