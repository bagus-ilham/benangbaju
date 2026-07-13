import React from 'react'
import { Input, Select, Checkbox, Textarea, Switch } from '@/shared/components'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { uploadImage } from '@/lib/supabase/storage'

interface ProductGeneralInfoSectionProps {
  name: string
  onNameChange: (val: string) => void
  slug: string
  onSlugChange: (val: string) => void
  categoryId: string
  onCategoryChange: (val: string) => void
  weightGram: number
  onWeightGramChange: (val: number) => void
  shortDescription: string
  onShortDescriptionChange: (val: string) => void
  description: string
  onDescriptionChange: (val: string) => void
  sizeGuide: string
  onSizeGuideChange: (val: string) => void
  careGuide: string
  onCareGuideChange: (val: string) => void
  isActive: boolean
  onIsActiveChange: (val: boolean) => void
  isFeatured: boolean
  onIsFeaturedChange: (val: boolean) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: any[] | undefined
  catsLoading: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collections: any[] | undefined
  colsLoading: boolean
  selectedCollections: string[]
  onToggleCollection: (id: string, isChecked: boolean) => void
}

export function ProductGeneralInfoSection({
  name,
  onNameChange,
  slug,
  onSlugChange,
  categoryId,
  onCategoryChange,
  weightGram,
  onWeightGramChange,
  shortDescription,
  onShortDescriptionChange,
  description,
  onDescriptionChange,
  sizeGuide,
  onSizeGuideChange,
  careGuide,
  onCareGuideChange,
  isActive,
  onIsActiveChange,
  isFeatured,
  onIsFeaturedChange,
  categories,
  catsLoading,
  collections,
  colsLoading,
  selectedCollections,
  onToggleCollection,
}: ProductGeneralInfoSectionProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-5">
      <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 border-b border-neutral-100 pb-2.5">
        Informasi Umum
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nama Produk*"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="cth: Kemeja Linen Oversized"
          required
        />
        <Input
          label="Slug URL*"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="cth: kemeja-linen-oversized"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Kategori*"
          value={categoryId}
          onChange={(val) => onCategoryChange(val)}
          options={
            catsLoading ? [] : categories?.map((cat) => ({ label: cat.name, value: cat.id })) || []
          }
          placeholder={catsLoading ? 'Memuat kategori...' : 'Pilih Kategori'}
          required
        />

        <Input
          label="Berat Default (Gram)*"
          type="number"
          value={weightGram}
          onChange={(e) => onWeightGramChange(Math.max(1, parseInt(e.target.value) || 0))}
          required
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-neutral-100">
        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Koleksi Kurasi (Opsional)
        </label>
        {colsLoading ? (
          <p className="text-neutral-400 italic text-[11px] animate-pulse">
            Memuat daftar koleksi...
          </p>
        ) : !collections || collections.length === 0 ? (
          <p className="text-neutral-400 italic text-[11px]">Belum ada koleksi yang dibuat.</p>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-2.5 p-3 border border-neutral-200 bg-neutral-50/20">
            {collections.map((col) => {
              const isChecked = selectedCollections.includes(col.id)
              return (
                <Checkbox
                  key={col.id}
                  label={col.name}
                  checked={isChecked}
                  onChange={(e) => onToggleCollection(col.id, e.target.checked)}
                />
              )
            })}
          </div>
        )}
      </div>

      <Textarea
        label="Deskripsi Singkat"
        value={shortDescription}
        onChange={(e) => onShortDescriptionChange(e.target.value)}
        placeholder="Tulis deskripsi singkat..."
        rows={2}
      />

      <Textarea
        label="Deskripsi Lengkap"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Tulis spesifikasi lengkap, bahan, dan cara perawatan..."
        rows={5}
      />

      <div className="space-y-2">
        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Panduan Ukuran (Size Guide)
        </label>
        <div className="flex gap-4 items-start border border-neutral-200 p-3 bg-neutral-50/20">
          <div className="w-20 h-20 bg-white border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
            {sizeGuide ? (
              <Image
                src={sizeGuide}
                alt="Size Guide"
                fill
                sizes="80px"
                unoptimized
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/150?text=Error'
                }}
              />
            ) : (
              <span className="text-[8px] text-neutral-400 uppercase font-semibold text-center">
                No Image
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-neutral-200 outline-none text-xs bg-white focus:border-neutral-800"
              value={sizeGuide}
              onChange={(e) => onSizeGuideChange(e.target.value)}
              placeholder="https://... atau unggah gambar size guide"
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="size-guide-upload"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  const toastId = toast.loading('Mengunggah size guide...')
                  try {
                    const publicUrl = await uploadImage(file, 'products')
                    onSizeGuideChange(publicUrl)
                    toast.success('Size guide berhasil diunggah!', { id: toastId })
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Gagal mengunggah gambar'
                    toast.error(message, { id: toastId })
                  }
                }}
              />
              <label
                htmlFor="size-guide-upload"
                className="cursor-pointer inline-flex items-center text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 border border-neutral-800 text-neutral-850 hover:bg-neutral-900 hover:text-white transition duration-150 rounded-none bg-white"
              >
                Unggah Gambar
              </label>
            </div>
          </div>
        </div>
      </div>

      <Textarea
        label="Panduan Perawatan (Care Guide)"
        value={careGuide}
        onChange={(e) => onCareGuideChange(e.target.value)}
        placeholder="Tulis petunjuk perawatan produk..."
        rows={3}
      />

      <div className="flex items-center space-x-6 pt-2">
        <Switch
          label="Aktifkan Katalog"
          checked={isActive}
          onChange={(e) => onIsActiveChange(e.target.checked)}
        />
        <Switch
          label="Produk Unggulan (Featured)"
          checked={isFeatured}
          onChange={(e) => onIsFeaturedChange(e.target.checked)}
        />
      </div>
    </div>
  )
}
