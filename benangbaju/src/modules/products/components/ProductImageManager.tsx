import React from 'react'
import Image from 'next/image'
import { Button, Select, Input, Checkbox } from '@/shared/components'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadImage } from '@/lib/supabase/storage'
import type { ProductImagePayload, ProductVariantPayload } from '@/modules/products/types'

interface ProductImageManagerProps {
  images: ProductImagePayload[]
  variants: ProductVariantPayload[]
  onAddImage: () => void
  onRemoveImage: (index: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateImageField: (index: number, field: keyof ProductImagePayload, value: any) => void
}

export function ProductImageManager({
  images,
  variants,
  onAddImage,
  onRemoveImage,
  onUpdateImageField,
}: ProductImageManagerProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-4">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
        <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
          Daftar URL Gambar
        </h3>
        <Button
          type="button"
          onClick={onAddImage}
          variant="outline"
          className="text-[9px] font-bold uppercase py-0.5 px-2 border-neutral-850"
        >
          + Tambah URL
        </Button>
      </div>

      {images.length === 0 ? (
        <p className="text-[11px] text-neutral-400 italic">
          Belum ada gambar ditambahkan. Silakan tambah url gambar.
        </p>
      ) : (
        <div className="space-y-4">
          {images.map((img, idx) => {
            return (
              <div
                key={idx}
                className="border border-neutral-200 p-3 relative rounded-none space-y-2 bg-neutral-50/10"
              >
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={12} />
                </button>

                <div className="flex gap-3 items-start w-full">
                  {/* Thumbnail Preview */}
                  <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                    {img.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt_text || 'Preview'}
                        fill
                        sizes="64px"
                        unoptimized
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/150?text=Error'
                        }}
                      />
                    ) : (
                      <span className="text-[9px] text-neutral-400 uppercase font-semibold">
                        No Image
                      </span>
                    )}
                  </div>

                  {/* URL input and upload button */}
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                      <Input
                        label="URL Gambar"
                        type="text"
                        value={img.url}
                        onChange={(e) => onUpdateImageField(idx, 'url', e.target.value)}
                        placeholder="https://... atau unggah gambar"
                        required
                      />
                    </div>

                    {/* File Upload Button */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        id={`file-upload-${idx}`}
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          const toastId = toast.loading('Mengunggah gambar...')
                          try {
                            const publicUrl = await uploadImage(file, 'products')
                            onUpdateImageField(idx, 'url', publicUrl)
                            toast.success('Gambar berhasil diunggah!', { id: toastId })
                          } catch (err: unknown) {
                            const errorMessage =
                              err instanceof Error ? err.message : 'Gagal mengunggah gambar'
                            toast.error(errorMessage, { id: toastId })
                          }
                        }}
                      />
                      <label
                        htmlFor={`file-upload-${idx}`}
                        className="cursor-pointer inline-flex items-center text-[9px] font-bold uppercase tracking-wider py-1 px-2.5 border border-neutral-800 text-neutral-850 hover:bg-neutral-900 hover:text-white transition duration-150 rounded-none"
                      >
                        Unggah File
                      </label>
                      <span className="text-[9px] text-neutral-400 font-medium">
                        Format: JPG, PNG, WEBP (Max 2MB)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <Input
                      label="Alt Text"
                      type="text"
                      value={img.alt_text || ''}
                      onChange={(e) => onUpdateImageField(idx, 'alt_text', e.target.value)}
                      placeholder="Keterangan foto"
                    />
                  </div>
                  <div>
                    <Input
                      label="No. Urut"
                      type="number"
                      value={img.sort_order.toString()}
                      onChange={(e) =>
                        onUpdateImageField(idx, 'sort_order', parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Select
                    label="Tautkan ke Varian"
                    value={img.variant_id || ''}
                    onChange={(val) => onUpdateImageField(idx, 'variant_id', val || null)}
                    options={[
                      { label: 'Semua Varian (Gambar Umum)', value: '' },
                      ...variants.map((v, vIdx) => ({
                        label: `${v.name || `Varian #${vIdx + 1}`} (${v.sku || 'Tanpa SKU'})`,
                        value: v.id || `temp-${vIdx}`,
                      })),
                    ]}
                  />
                </div>

                <div className="flex items-center space-x-1.5 pt-1">
                  <Checkbox
                    id={`img-primary-${idx}`}
                    checked={img.is_primary}
                    onChange={(e) => onUpdateImageField(idx, 'is_primary', e.target.checked)}
                  />
                  <label
                    htmlFor={`img-primary-${idx}`}
                    className="select-none text-[10px] text-neutral-600 font-bold uppercase cursor-pointer"
                  >
                    Gambar Utama
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
