import React from 'react'
import { Input, Select, Checkbox, Textarea, Switch } from '@/shared/components'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { uploadImage } from '@/lib/supabase/storage'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

interface ProductGeneralInfoSectionProps {
  name: string
  onNameChange: (val: string) => void
  slug: string
  onSlugChange: (val: string) => void
  categoryId: string
  onCategoryChange: (val: string) => void
  weightGram: number
  onWeightGramChange: (val: number) => void
  hsCode: string
  onHsCodeChange: (val: string) => void
  shortDescription: string
  onShortDescriptionChange: (val: string) => void
  description: string
  onDescriptionChange: (val: string) => void
  sizeGuide: string
  onSizeGuideChange: (val: string) => void
  sizeGuideInch: string
  onSizeGuideInchChange: (val: string) => void
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
  hsCode,
  onHsCodeChange,
  shortDescription,
  onShortDescriptionChange,
  description,
  onDescriptionChange,
  sizeGuide,
  onSizeGuideChange,
  sizeGuideInch,
  onSizeGuideInchChange,
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
    <div className="border border-neutral-200 bg-brand-cream p-6 rounded-2xl space-y-5 shadow-sm">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        <div>
          <Input
            label="HS Code Bea Cukai (Ekspor)"
            value={hsCode}
            onChange={(e) => onHsCodeChange(e.target.value)}
            placeholder="cth: 6206.30 / 6204.43"
          />
          <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] text-neutral-500">
            <span className="text-neutral-400">Pilihan:</span>
            <button
              type="button"
              onClick={() => onHsCodeChange('6206.30')}
              className="text-brand-accent hover:underline font-mono"
            >
              6206.30 (Blouse)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onHsCodeChange('6204.62')}
              className="text-brand-accent hover:underline font-mono"
            >
              6204.62 (Celana)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onHsCodeChange('6204.52')}
              className="text-brand-accent hover:underline font-mono"
            >
              6204.52 (Rok)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onHsCodeChange('6204.43')}
              className="text-brand-accent hover:underline font-mono"
            >
              6204.43 (Gamis)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onHsCodeChange('6217.10')}
              className="text-brand-accent hover:underline font-mono"
            >
              6217.10 (Obi Belt)
            </button>
          </div>
        </div>
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

      {/* Size Guides Section (CM & Inch) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Size Guide CM */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Panduan Ukuran — CM (Domestik Indonesia)
          </label>
          <div className="flex gap-3 items-start border border-neutral-200 p-3 bg-neutral-50/20 rounded-xl">
            <div className="w-16 h-16 bg-brand-cream border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden rounded-lg">
              {sizeGuide ? (
                <Image
                  key={sizeGuide}
                  src={getProxiedImageUrl(sizeGuide)}
                  alt="Size guide CM preview"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <span className="text-[8px] text-neutral-400 uppercase font-semibold text-center">
                  No Image
                </span>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <input
                type="text"
                className="w-full px-2 py-1 border border-neutral-200 outline-none text-xs bg-brand-cream focus:border-neutral-800 rounded"
                value={sizeGuide}
                onChange={(e) => onSizeGuideChange(e.target.value)}
                placeholder="https://... atau unggah gambar"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="size-guide-cm-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    const toastId = toast.loading('Mengunggah size guide CM...')
                    try {
                      const publicUrl = await uploadImage(file, 'products')
                      onSizeGuideChange(publicUrl)
                      toast.success('Size guide CM berhasil diunggah!', { id: toastId })
                    } catch (err: unknown) {
                      const message = err instanceof Error ? err.message : 'Gagal mengunggah gambar'
                      toast.error(message, { id: toastId })
                    }
                  }}
                />
                <label
                  htmlFor="size-guide-cm-upload"
                  className="cursor-pointer inline-flex items-center text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 border border-neutral-800 text-neutral-800 hover:bg-neutral-900 hover:text-white transition duration-150 rounded bg-brand-cream"
                >
                  Unggah CM
                </label>
                {sizeGuide && (
                  <button
                    type="button"
                    onClick={() => onSizeGuideChange('')}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Size Guide Inch (Malaysia) */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            Panduan Ukuran — Inci (Malaysia / Ekspor)
          </label>
          <div className="flex gap-3 items-start border border-neutral-200 p-3 bg-neutral-50/20 rounded-xl">
            <div className="w-16 h-16 bg-brand-cream border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden rounded-lg">
              {sizeGuideInch ? (
                <Image
                  key={sizeGuideInch}
                  src={getProxiedImageUrl(sizeGuideInch)}
                  alt="Size guide Inch preview"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <span className="text-[8px] text-neutral-400 uppercase font-semibold text-center">
                  No Image
                </span>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <input
                type="text"
                className="w-full px-2 py-1 border border-neutral-200 outline-none text-xs bg-brand-cream focus:border-neutral-800 rounded"
                value={sizeGuideInch}
                onChange={(e) => onSizeGuideInchChange(e.target.value)}
                placeholder="https://... atau unggah gambar (Inci)"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="size-guide-inch-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    const toastId = toast.loading('Mengunggah size guide Inci...')
                    try {
                      const publicUrl = await uploadImage(file, 'products')
                      onSizeGuideInchChange(publicUrl)
                      toast.success('Size guide Inci berhasil diunggah!', { id: toastId })
                    } catch (err: unknown) {
                      const message = err instanceof Error ? err.message : 'Gagal mengunggah gambar'
                      toast.error(message, { id: toastId })
                    }
                  }}
                />
                <label
                  htmlFor="size-guide-inch-upload"
                  className="cursor-pointer inline-flex items-center text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 border border-neutral-800 text-neutral-800 hover:bg-neutral-900 hover:text-white transition duration-150 rounded bg-brand-cream"
                >
                  Unggah Inci
                </label>
                {sizeGuideInch && (
                  <button
                    type="button"
                    onClick={() => onSizeGuideInchChange('')}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
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
