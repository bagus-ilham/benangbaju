import React from 'react'
import { Button, Input, Switch } from '@/shared/components'
import { Plus, Trash2, Copy } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { uploadImage } from '@/lib/supabase/storage'
import type { ProductVariantPayload, ProductImagePayload } from '@/modules/products/types'

interface ProductVariantsSectionProps {
  variants: ProductVariantPayload[]
  images: ProductImagePayload[]
  onAddVariant: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateVariantField: (idx: number, field: string, value: any) => void
  onRemoveVariant: (idx: number) => void
  onDuplicateVariant: (idx: number) => void
  onAddVariantAttr: (vIdx: number) => void
  onUpdateVariantAttrField: (vIdx: number, aIdx: number, field: string, value: string) => void
  onRemoveVariantAttr: (vIdx: number, aIdx: number) => void
  onAddImage: (variantId?: string | null) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateImageField: (idx: number, field: string, value: any) => void
  onRemoveImage: (idx: number) => void
}

export function ProductVariantsSection({
  variants,
  images,
  onAddVariant,
  onUpdateVariantField,
  onRemoveVariant,
  onDuplicateVariant,
  onAddVariantAttr,
  onUpdateVariantAttrField,
  onRemoveVariantAttr,
  onAddImage,
  onUpdateImageField,
  onRemoveImage,
}: ProductVariantsSectionProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200 bg-white p-6 rounded-none space-y-6">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5">
        <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
          Spesifikasi Varian Produk
        </h3>
        <Button
          type="button"
          onClick={onAddVariant}
          variant="outline"
          className="text-[10px] font-bold uppercase py-1 px-3 border-neutral-800 text-neutral-800 hover:bg-neutral-50"
        >
          <Plus size={12} className="mr-1 inline" /> Tambah Varian
        </Button>
      </div>

      <div className="space-y-6">
        {variants.map((v, vIdx) => (
          <div
            key={vIdx}
            className="border border-neutral-200 p-4 relative bg-neutral-50/20 space-y-4 rounded-none"
          >
            <div className="absolute right-3.5 top-3.5 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => onDuplicateVariant(vIdx)}
                className="text-neutral-400 hover:text-neutral-900 p-1"
                title="Duplikat Varian"
              >
                <Copy size={14} />
              </button>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveVariant(vIdx)}
                  className="text-neutral-400 hover:text-red-600 p-1"
                  title="Hapus Varian"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <p className="font-semibold text-neutral-900 uppercase tracking-widest text-[10px]">
              Varian #{vIdx + 1}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="Nama Varian*"
                value={v.name}
                onChange={(e) => onUpdateVariantField(vIdx, 'name', e.target.value)}
                placeholder="cth: Hitam - S / All Size"
                required
              />
              <Input
                label="SKU Varian*"
                value={v.sku}
                onChange={(e) => onUpdateVariantField(vIdx, 'sku', e.target.value)}
                placeholder="cth: BBJ-LNN-BLK-S"
                required
              />
              <Input
                label="Stok*"
                type="number"
                value={v.stock}
                onChange={(e) =>
                  onUpdateVariantField(vIdx, 'stock', Math.max(0, parseInt(e.target.value) || 0))
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Harga Jual (Rupiah)*"
                type="number"
                value={v.price}
                onChange={(e) =>
                  onUpdateVariantField(vIdx, 'price', Math.max(0, parseFloat(e.target.value) || 0))
                }
                required
              />
              <Input
                label="Harga Coret (Compare Price)"
                type="number"
                value={v.compare_price || ''}
                onChange={(e) =>
                  onUpdateVariantField(
                    vIdx,
                    'compare_price',
                    e.target.value ? Math.max(0, parseFloat(e.target.value) || 0) : null
                  )
                }
              />
              <Input
                label="Berat Varian (Gram)"
                type="number"
                value={v.weight_gram || ''}
                onChange={(e) =>
                  onUpdateVariantField(
                    vIdx,
                    'weight_gram',
                    e.target.value ? Math.max(1, parseInt(e.target.value) || 0) : null
                  )
                }
              />
            </div>

            <Switch
              label="Aktifkan Varian"
              checked={v.is_active}
              onChange={(e) => onUpdateVariantField(vIdx, 'is_active', e.target.checked)}
              className="pt-1 pb-1"
            />

            {/* Variant Images Sub-section */}
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <div className="flex justify-between items-center">
                <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                  Gambar Varian
                </p>
                <button
                  type="button"
                  onClick={() => onAddImage(v.id || null)}
                  className="text-[9px] uppercase font-bold text-neutral-800 hover:underline inline"
                >
                  + Tambah Gambar Varian
                </button>
              </div>

              {images.filter((img) => img.variant_id === v.id).length > 0 && (
                <div className="space-y-2.5">
                  {images.map((img, imgIdx) => {
                    if (img.variant_id !== v.id) return null
                    return (
                      <div
                        key={`variant-${v.id}-img-${imgIdx}`}
                        className="flex flex-wrap sm:flex-nowrap gap-2 items-center border border-neutral-100 p-2 bg-white"
                      >
                        <div className="w-10 h-10 bg-neutral-50 border border-neutral-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                          {img.url ? (
                            <Image
                              src={img.url}
                              alt={img.alt_text || 'Preview'}
                              fill
                              sizes="40px"
                              unoptimized
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/150?text=Error'
                              }}
                            />
                          ) : (
                            <span className="text-[7px] text-neutral-400 uppercase font-semibold">
                              No Img
                            </span>
                          )}
                        </div>

                        <input
                          type="text"
                          className="flex-1 px-2 py-1 border border-neutral-200 outline-none text-[10px] bg-white focus:border-neutral-800"
                          value={img.url}
                          onChange={(e) => onUpdateImageField(imgIdx, 'url', e.target.value)}
                          placeholder="https://... atau unggah"
                          required
                        />

                        <input
                          type="file"
                          id={`variant-${vIdx}-file-upload-${imgIdx}`}
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            const toastId = toast.loading('Mengunggah gambar...')
                            try {
                              const publicUrl = await uploadImage(file, 'products')
                              onUpdateImageField(imgIdx, 'url', publicUrl)
                              toast.success('Gambar berhasil diunggah!', { id: toastId })
                            } catch (err: unknown) {
                              const errorMessage =
                                err instanceof Error ? err.message : 'Gagal mengunggah gambar'
                              toast.error(errorMessage, { id: toastId })
                            }
                          }}
                        />
                        <label
                          htmlFor={`variant-${vIdx}-file-upload-${imgIdx}`}
                          className="cursor-pointer inline-flex items-center text-[8px] font-bold uppercase tracking-wider py-1 px-2 border border-neutral-800 text-neutral-850 hover:bg-neutral-900 hover:text-white transition duration-150 rounded-none bg-white"
                        >
                          Unggah
                        </label>

                        <button
                          type="button"
                          onClick={() => onRemoveImage(imgIdx)}
                          className="text-neutral-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Attributes Sub-section */}
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <div className="flex justify-between items-center">
                <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                  Atribut Varian (cth: Ukuran/Warna)
                </p>
                <button
                  type="button"
                  onClick={() => onAddVariantAttr(vIdx)}
                  className="text-[9px] uppercase font-bold text-neutral-800 hover:underline inline"
                >
                  + Tambah Atribut
                </button>
              </div>

              {v.attrs.length > 0 && (
                <div className="space-y-2">
                  {v.attrs.map((attr, aIdx: number) => (
                    <div key={aIdx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="px-2 py-1.5 border border-neutral-200 outline-none text-xs w-28 bg-white focus:border-neutral-800 font-medium"
                        value={attr.attr_name}
                        onChange={(e) =>
                          onUpdateVariantAttrField(vIdx, aIdx, 'attr_name', e.target.value)
                        }
                        placeholder="Nama Atribut"
                      />
                      <input
                        type="text"
                        className="flex-1 px-2 py-1.5 border border-neutral-200 outline-none text-xs bg-white focus:border-neutral-800 font-medium"
                        value={attr.attr_value}
                        onChange={(e) =>
                          onUpdateVariantAttrField(vIdx, aIdx, 'attr_value', e.target.value)
                        }
                        placeholder="Nilai Atribut"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveVariantAttr(vIdx, aIdx)}
                        className="text-neutral-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
