import React from 'react'
import { Select, Textarea, ImageUploadGrid } from '@/shared/components'

const RETURN_REASONS = [
  { value: 'wrong_item', label: 'Salah Kirim Produk / Varian' },
  { value: 'damaged_item', label: 'Produk Rusak / Cacat' },
  { value: 'missing_item', label: 'Barang Kurang / Hilang' },
  { value: 'not_as_described', label: 'Produk Tidak Sesuai Deskripsi' },
  { value: 'size_issue', label: 'Ukuran Tidak Pas' },
  { value: 'other', label: 'Lainnya' },
]

interface ReturnReasonFormProps {
  reason: string
  setReason: (val: string) => void
  customerNotes: string
  setCustomerNotes: (val: string) => void
  returnFiles: File[]
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (index: number) => void
}

export function ReturnReasonForm({
  reason,
  setReason,
  customerNotes,
  setCustomerNotes,
  returnFiles,
  onFileChange,
  onRemoveFile,
}: ReturnReasonFormProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200/80 p-5 sm:p-6 bg-brand-cream space-y-4 relative overflow-hidden rounded-2xl shadow-xs font-sans">
      <div className="card-accent-bar" />
      <h2 className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum border-b border-neutral-200/60 pb-2">
        Alasan Pengembalian*
      </h2>
      <div className="space-y-4">
        <Select value={reason} onChange={setReason} options={RETURN_REASONS} />
        <Textarea
          label="Deskripsi Tambahan / Detail Cacat"
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          placeholder="Tuliskan alasan detail retur Anda..."
          rows={4}
        />
      </div>

      {/* Media Upload */}
      <div className="space-y-3 pt-4 border-t border-neutral-100">
        <label className="block text-xs uppercase tracking-widest font-semibold text-neutral-500">
          Lampirkan Bukti Foto (Opsional, Maks 2 Foto)
        </label>

        <ImageUploadGrid
          files={returnFiles}
          maxFiles={2}
          onFileChange={onFileChange}
          onRemoveFile={onRemoveFile}
          addLabel="Tambah"
          tileSize="md"
        />
        <p className="text-[10px] text-neutral-400">Format: JPG/PNG, maks 2MB per foto.</p>
      </div>
    </div>
  )
}
