'use client'

import React from 'react'
import { Modal, Input, Textarea, Select, Switch, Button } from '@/shared/components'
import {
  INDONESIA_PROVINCES,
  MALAYSIA_STATES,
  MALAYSIA_WEST_STATES,
  MALAYSIA_EAST_STATES,
} from '@/lib/constants'

export function ShippingZoneModal({
  isOpen,
  onClose,
  onSubmit,
  editingZone,
  zoneName,
  setZoneName,
  zoneDesc,
  setZoneDesc,
  zoneCountryCode = 'ID',
  setZoneCountryCode,
  selectedProvinces,
  handleToggleProvince,
  zoneActive,
  setZoneActive,
  isPending,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  const provinceList = zoneCountryCode === 'MY' ? MALAYSIA_STATES : INDONESIA_PROVINCES

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingZone ? 'Ubah Zona Pengiriman' : 'Tambah Zona Baru'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4 font-sans text-xs">
        {/* Country Selector */}
        <div className="flex flex-col space-y-1.5">
          <label className="font-bold text-neutral-600 uppercase tracking-wider text-[10px]">
            Negara Cakupan*
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (setZoneCountryCode && zoneCountryCode !== 'ID') {
                  setZoneCountryCode('ID')
                }
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 border text-xs font-semibold transition ${
                zoneCountryCode === 'ID'
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <span>🇮🇩</span>
              <span>Indonesia (38 Provinsi)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (setZoneCountryCode && zoneCountryCode !== 'MY') {
                  setZoneCountryCode('MY')
                }
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 border text-xs font-semibold transition ${
                zoneCountryCode === 'MY'
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <span>🇲🇾</span>
              <span>Malaysia (16 Negeri & WP)</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <Input
            label="Nama Zona*"
            type="text"
            required
            placeholder={
              zoneCountryCode === 'MY'
                ? 'cth: Malaysia Barat (West) atau Malaysia Timur (East)'
                : 'cth: Pulau Jawa'
            }
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <Textarea
            label="Deskripsi"
            placeholder="Deskripsi wilayah cakupan..."
            value={zoneDesc}
            onChange={(e) => setZoneDesc(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">
              {zoneCountryCode === 'MY' ? 'Pilih Negeri / Wilayah Cakupan*' : 'Pilih Cakupan Provinsi*'} (Minimal 1)
            </label>
            <span className="text-[10px] text-neutral-400">
              {selectedProvinces.length} wilayah terpilih
            </span>
          </div>

          {zoneCountryCode === 'MY' && (
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => {
                  MALAYSIA_WEST_STATES.forEach((st) => {
                    if (!selectedProvinces.includes(st)) handleToggleProvince(st)
                  })
                }}
                className="px-2 py-0.5 text-[9px] font-semibold bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-700"
              >
                + Semenanjung (13)
              </button>
              <button
                type="button"
                onClick={() => {
                  MALAYSIA_EAST_STATES.forEach((st) => {
                    if (!selectedProvinces.includes(st)) handleToggleProvince(st)
                  })
                }}
                className="px-2 py-0.5 text-[9px] font-semibold bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-700"
              >
                + Sabah, Sarawak, Labuan (3)
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-neutral-50 border border-neutral-200 max-h-48 overflow-y-auto">
            {provinceList.map((p) => {
              const isSelected = selectedProvinces.includes(p)
              return (
                <div
                  key={p}
                  onClick={() => handleToggleProvince(p)}
                  className={`p-2 border text-[10px] font-medium text-center cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-brand-cream text-neutral-600 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {p}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Switch
            id="zoneActive"
            checked={zoneActive}
            onChange={(e) => setZoneActive(e.target.checked)}
          />
          <label
            htmlFor="zoneActive"
            className="font-bold text-[10px] uppercase tracking-wider text-neutral-700 cursor-pointer"
          >
            Aktifkan Zona ini
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function ShippingRateModal({
  isOpen,
  onClose,
  onSubmit,
  editingRate,
  zones,
  rateZoneId,
  setRateZoneId,
  rateCourier,
  setRateCourier,
  rateBasePrice,
  setRateBasePrice,
  ratePricePerKg,
  setRatePricePerKg,
  rateMinWeight,
  setRateMinWeight,
  rateMaxWeight,
  setRateMaxWeight,
  rateEtdMin,
  setRateEtdMin,
  rateEtdMax,
  setRateEtdMax,
  rateActive,
  setRateActive,
  isPending,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRate ? 'Ubah Tarif Kurir' : 'Tambah Tarif Baru'}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4 font-sans text-xs">
        <div className="flex flex-col space-y-1">
          <Select
            label="Pilih Zona Pengiriman*"
            required
            value={rateZoneId}
            onChange={setRateZoneId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options={zones?.map((z: any) => ({ label: z.name, value: z.id })) || []}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <Input
            label="Nama Ekspedisi / Layanan*"
            type="text"
            required
            placeholder="cth: Ninja Van MY atau Lion Parcel INTERPACK"
            value={rateCourier}
            onChange={(e) => setRateCourier(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <Input
              label="Biaya Minimum (Rp)*"
              type="number"
              required
              min={0}
              value={rateBasePrice.toString()}
              onChange={(e) => setRateBasePrice(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Input
              label="Tarif Per Kg (Rp)*"
              type="number"
              required
              min={0}
              value={ratePricePerKg.toString()}
              onChange={(e) => setRatePricePerKg(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <Input
              label="Berat Min (Gram)*"
              type="number"
              required
              min={1}
              value={(rateMinWeight || 1000).toString()}
              onChange={(e) =>
                setRateMinWeight && setRateMinWeight(Math.max(1, parseInt(e.target.value) || 1000))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Input
              label="Batas Berat Maks (Gram)"
              type="number"
              min={0}
              placeholder="30000 (Kosongkan jika tanpa batas)"
              value={rateMaxWeight ? rateMaxWeight.toString() : ''}
              onChange={(e) =>
                setRateMaxWeight &&
                setRateMaxWeight(e.target.value ? Math.max(1, parseInt(e.target.value) || 0) : null)
              }
              helperText="Cth: 30000 gr (30 kg) untuk batas kurir ekspor."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <Input
              label="Est. Tiba Min (Hari)*"
              type="number"
              required
              min={1}
              value={rateEtdMin.toString()}
              onChange={(e) => setRateEtdMin(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Input
              label="Est. Tiba Max (Hari)*"
              type="number"
              required
              min={rateEtdMin}
              value={rateEtdMax.toString()}
              onChange={(e) =>
                setRateEtdMax(Math.max(rateEtdMin, parseInt(e.target.value) || rateEtdMin))
              }
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Switch
            id="rateActive"
            checked={rateActive}
            onChange={(e) => setRateActive(e.target.checked)}
          />
          <label
            htmlFor="rateActive"
            className="font-bold text-[10px] uppercase tracking-wider text-neutral-700 cursor-pointer"
          >
            Aktifkan Layanan Kurir ini
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
