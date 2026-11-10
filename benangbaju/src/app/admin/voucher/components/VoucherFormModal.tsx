import React, { useState } from 'react'
import { Modal, Button, Input, Select, Switch } from '@/shared/components'
import { useSiteSettings } from '@/shared/hooks/useSiteSettings'
import { formatMYR } from '@/lib/utils'

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
  const { myrExchangeRate } = useSiteSettings()
  const isApplicableToMY = applicable_countries.includes('MY')
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

        {/* Malaysia Calculation Helper Banner */}
        {isApplicableToMY && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 font-sans">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-amber-950 flex items-center gap-1.5">
                <span>🇲🇾</span> Kalkulator Nilai Malaysia (Kurs: 1 RM = Rp {myrExchangeRate.toLocaleString('id-ID')})
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-[10px] font-semibold text-neutral-600">Isi Cepat Potongan Flat:</span>
              {[10, 15, 20, 30, 50].map((rm) => (
                <button
                  key={rm}
                  type="button"
                  onClick={() => {
                    setDiscountType('fixed')
                    setValue(Math.round(rm * myrExchangeRate))
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white border border-amber-300 rounded text-amber-950 hover:bg-amber-100 transition"
                  title={`Set potongan ke Rp ${(rm * myrExchangeRate).toLocaleString('id-ID')} (RM ${rm})`}
                >
                  RM {rm}
                </button>
              ))}
            </div>
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
                { label: 'Nominal Flat (Rp)', value: 'fixed' },
              ]}
            />
          </div>

          <div>
            <Input
              label="Nilai Potongan*"
              type="number"
              value={value}
              onChange={(e) => setValue(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="cth: 10 atau 50000"
              required
            />
            {isApplicableToMY && discount_type === 'fixed' && value > 0 && (
              <span className="text-[10px] text-amber-900 font-semibold mt-1 block">
                ≈ {formatMYR(Math.round((value / myrExchangeRate) * 100) / 100)}
              </span>
            )}
          </div>

          <div>
            <Input
              label="Minimal Belanja (Rp)*"
              type="number"
              value={min_purchase}
              onChange={(e) => setMinPurchase(Math.max(0, parseFloat(e.target.value) || 0))}
              required
            />
            {isApplicableToMY && min_purchase > 0 && (
              <span className="text-[10px] text-amber-900 font-semibold mt-1 block">
                ≈ {formatMYR(Math.round((min_purchase / myrExchangeRate) * 100) / 100)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Input
              label="Maksimal Potongan (Maks Rp)"
              type="number"
              value={max_discount || ''}
              onChange={(e) =>
                setMaxDiscount(e.target.value ? Math.max(0, parseFloat(e.target.value) || 0) : null)
              }
              placeholder="Kosongkan jika tidak dibatasi"
            />
            {isApplicableToMY && max_discount && max_discount > 0 ? (
              <span className="text-[10px] text-amber-900 font-semibold mt-1 block">
                ≈ {formatMYR(Math.round((max_discount / myrExchangeRate) * 100) / 100)}
              </span>
            ) : null}
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
