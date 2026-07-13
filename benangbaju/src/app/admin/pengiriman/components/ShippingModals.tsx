'use client'

import React from 'react'
import { Modal, Input, Textarea, Select, Switch, Button } from '@/shared/components'

const PROVINCES = [
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'DI Yogyakarta',
  'Banten',
  'Sumatera Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Riau',
  'Lampung',
  'Aceh',
  'Jambi',
  'Bengkulu',
  'Kepulauan Riau',
  'Kepulauan Bangka Belitung',
  'Kalimantan Barat',
  'Kalimantan Timur',
  'Kalimantan Selatan',
  'Kalimantan Tengah',
  'Kalimantan Utara',
  'Sulawesi Selatan',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Sulawesi Barat',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Papua',
  'Papua Barat',
  'Maluku',
  'Maluku Utara',
]

export function ShippingZoneModal({
  isOpen,
  onClose,
  onSubmit,
  editingZone,
  zoneName,
  setZoneName,
  zoneDesc,
  setZoneDesc,
  selectedProvinces,
  handleToggleProvince,
  zoneActive,
  setZoneActive,
  isPending,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingZone ? 'Ubah Zona Pengiriman' : 'Tambah Zona Baru'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col space-y-1">
          <Input
            label="Nama Zona*"
            type="text"
            required
            placeholder="cth: Pulau Jawa"
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
            rows={3}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label className="font-bold text-neutral-500 uppercase tracking-wider text-xs">
            Pilih Cakupan Provinsi* (Minimal 1)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-neutral-50 border border-neutral-200 max-h-48 overflow-y-auto">
            {PROVINCES.map((p) => {
              const isSelected = selectedProvinces.includes(p)
              return (
                <div
                  key={p}
                  onClick={() => handleToggleProvince(p)}
                  className={`p-2 border text-[10px] font-medium text-center cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
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
      <form onSubmit={onSubmit} className="space-y-4">
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
            placeholder="cth: JNE REG"
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
