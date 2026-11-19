import React from 'react'
import { Modal, Button, Input, Select, Switch } from '@/shared/components'

interface VoucherFormModalProps {
  isOpen: boolean
  onClose: () => void
  isEditing: boolean
  isPending: boolean
  onSubmit: (e: React.FormEvent) => void
  // Form States
  code: string
  setCode: (val: string) => void
  name: string
  setName: (val: string) => void
  discount_type: 'percentage' | 'fixed'
  setDiscountType: (val: 'percentage' | 'fixed') => void
  value: number
  setValue: (val: number) => void
  min_purchase: number
  setMinPurchase: (val: number) => void
  max_discount: number | null
  setMaxDiscount: (val: number | null) => void
  usage_limit: number | null
  setUsageLimit: (val: number | null) => void
  usage_per_user: number
  setUsagePerUser: (val: number) => void
  starts_at: string
  setStartsAt: (val: string) => void
  expires_at: string
  setExpiresAt: (val: string) => void
  applicable_countries: string[]
  setApplicableCountries: (val: string[]) => void
  is_active: boolean
  setIsActive: (val: boolean) => void
  is_hidden: boolean
  setIsHidden: (val: boolean) => void
}

export function VoucherFormModal({
  isOpen,
  onClose,
  isEditing,
  isPending,
  onSubmit,
  code,
  setCode,
  name,
  setName,
  discount_type,
  setDiscountType,
  value,
  setValue,
  min_purchase,
  setMinPurchase,
  max_discount,
  setMaxDiscount,
  usage_limit,
  setUsageLimit,
  usage_per_user,
  setUsagePerUser,
  starts_at,
  setStartsAt,
  expires_at,
  setExpiresAt,
  applicable_countries,
  setApplicableCountries,
  is_active,
  setIsActive,
  is_hidden,
  setIsHidden,
}: VoucherFormModalProps): React.JSX.Element {
  const isMalaysiaOnly = applicable_countries.length === 1 && applicable_countries[0] === 'MY'
  const isGlobal = applicable_countries.includes('ID') && applicable_countries.includes('MY')
  const currencyUnit = isMalaysiaOnly ? 'RM' : 'Rp'
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Ubah Voucher' : 'Tambah Voucher Baru'}
    >
      <form onSubmit={onSubmit} className="space-y-5 text-xs font-sans">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Kode Voucher (Huruf Besar)*"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="cth: DISKON10"
            required
          />
          <Input
            label="Nama Promosi*"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth: Promo Gajian Juni"
            required
          />
        </div>

        {/* Applicable Countries Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-neutral-600 uppercase tracking-wider text-[10px]">
            Berlaku untuk Negara*
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Semua (ID & MY)', flag: '🌐', value: ['ID', 'MY'] },
              { label: 'Khusus Indonesia', flag: '🇮🇩', value: ['ID'] },
              { label: 'Khusus Malaysia', flag: '🇲🇾', value: ['MY'] },
            ].map((opt) => {
              const isSelected =
                opt.value.length === applicable_countries.length &&
                opt.value.every((c) => applicable_countries.includes(c))

              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setApplicableCountries(opt.value)}
                  className={`py-2 px-2 border text-center text-[10px] font-semibold transition rounded flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-sm">{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-neutral-400">
            Batasi voucher khusus pembeli Indonesia (misal: subsidi ongkir domestik) atau pembeli Malaysia.
          </p>
        </div>

        {/* Malaysia / Currency Info Banner */}
        {isMalaysiaOnly && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl font-sans text-[11px] text-emerald-950">
            <span className="font-bold">🇲🇾 Voucher Khusus Malaysia (Mata Uang RM):</span> Masukkan
            nominal potongan flat, minimal belanja, dan batas maksimal diskon langsung dalam{' '}
            <strong>Ringgit Malaysia (RM)</strong>.
          </div>
        )}
        {isGlobal && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-sans text-[11px] text-neutral-600">
            <span className="font-bold text-neutral-800">🌐 Voucher Global (ID & MY):</span> Untuk
            promo lintas negara, tipe <strong>Persentase (%)</strong> direkomendasikan agar konsisten
            di kedua pasar.
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Select
              label="Tipe Potongan*"
              required
              value={discount_type}
              onChange={(val) => {
                if (val === 'percentage' || val === 'fixed') {
                  setDiscountType(val)
                }
              }}
              options={[
                { label: 'Persentase (%)', value: 'percentage' },
                { label: `Nominal Flat (${currencyUnit})`, value: 'fixed' },
              ]}
            />
          </div>

          <div>
            <Input
              label={
                discount_type === 'percentage'
                  ? 'Nilai Potongan (%)*'
                  : `Nilai Potongan (${currencyUnit})*`
              }
              type="number"
              step={isMalaysiaOnly && discount_type === 'fixed' ? '0.01' : '1'}
              value={value}
              onChange={(e) => setValue(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder={
                discount_type === 'percentage'
                  ? 'cth: 10'
                  : isMalaysiaOnly
                    ? 'cth: 15.00'
                    : 'cth: 50000'
              }
              required
            />
          </div>

          <div>
            <Input
              label={`Minimal Belanja (${currencyUnit})*`}
              type="number"
              step={isMalaysiaOnly ? '0.01' : '1'}
              value={min_purchase}
              onChange={(e) => setMinPurchase(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder={isMalaysiaOnly ? 'cth: 100.00' : 'cth: 250000'}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Input
              label={`Maksimal Potongan (Maks ${currencyUnit})`}
              type="number"
              step={isMalaysiaOnly ? '0.01' : '1'}
              value={max_discount || ''}
              onChange={(e) =>
                setMaxDiscount(e.target.value ? Math.max(0, parseFloat(e.target.value) || 0) : null)
              }
              placeholder="Kosongkan jika tidak dibatasi"
            />
          </div>

          <Input
            label="Batas Penggunaan Total"
            type="number"
            value={usage_limit || ''}
            onChange={(e) =>
              setUsageLimit(e.target.value ? Math.max(1, parseInt(e.target.value) || 0) : null)
            }
            placeholder="Kosongkan jika tidak dibatasi"
          />

          <Input
            label="Batas per Pengguna*"
            type="number"
            value={usage_per_user}
            onChange={(e) => setUsagePerUser(Math.max(1, parseInt(e.target.value) || 1))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Mulai Aktif*"
            type="datetime-local"
            value={starts_at}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
          <Input
            label="Akhir Berlaku (Expired)*"
            type="datetime-local"
            value={expires_at}
            onChange={(e) => setExpiresAt(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center space-x-2 py-1">
          <Switch
            id="voucher_is_active"
            checked={is_active}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor="voucher_is_active"
            className="select-none text-[10px] text-neutral-700 font-semibold uppercase tracking-wider cursor-pointer"
          >
            Voucher Aktif & Dapat Digunakan
          </label>
        </div>

        <div className="flex items-center space-x-2 py-1">
          <Switch
            id="voucher_is_hidden"
            checked={is_hidden}
            onChange={(e) => setIsHidden(e.target.checked)}
          />
          <label
            htmlFor="voucher_is_hidden"
            className="select-none text-[10px] text-neutral-700 font-semibold uppercase tracking-wider cursor-pointer"
          >
            Sembunyikan Voucher di Halaman Checkout (Hidden)
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
