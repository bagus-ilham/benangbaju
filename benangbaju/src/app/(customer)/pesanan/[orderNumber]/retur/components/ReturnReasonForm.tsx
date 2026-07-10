/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { Select, Textarea } from '@/shared/components'
import { Image as ImageIcon, X } from 'lucide-react'

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
    <div className="border border-neutral-200 p-5 sm:p-6 card-hover-lift gold-border-hover bg-white space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
      <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold border-b border-neutral-100 pb-2">
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

        <div className="flex flex-wrap gap-4">
          {returnFiles.map((file, idx) => (
            <div key={idx} className="relative w-24 h-24 border border-neutral-200 group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${idx}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveFile(idx)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {returnFiles.length < 2 && (
            <label className="w-24 h-24 border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-500 cursor-pointer hover:border-brand-gold hover:text-brand-gold transition group">
              <ImageIcon size={20} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Tambah</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFileChange}
              />
            </label>
          )}
        </div>
        <p className="text-[10px] text-neutral-400">Format: JPG/PNG, maks 2MB per foto.</p>
      </div>
    </div>
  )
}
