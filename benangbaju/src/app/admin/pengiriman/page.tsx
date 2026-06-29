'use client'

import React, { useState } from 'react'
import {
  useAdminShippingZones,
  useAdminCreateShippingZone,
  useAdminUpdateShippingZone,
  useAdminDeleteShippingZone,
  useAdminShippingRates,
  useAdminCreateShippingRate,
  useAdminUpdateShippingRate,
  useAdminDeleteShippingRate,
} from '@/hooks/useAdmin'
import type { ShippingZone, ShippingRate } from '@/services/shipping'
import { Button, AdminPageHeader, Modal, Input, Textarea, Select, Switch } from '@/components/shared'
import { Plus, Edit, Trash2, MapPin, Truck, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatIDR } from '@/lib/utils/format'
import { motion, AnimatePresence } from 'framer-motion'

// Standard Indonesian Provinces List
const PROVINCES = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta', 'Banten',
  'Sumatera Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Riau', 'Lampung', 'Aceh',
  'Jambi', 'Bengkulu', 'Kepulauan Riau', 'Kepulauan Bangka Belitung',
  'Kalimantan Barat', 'Kalimantan Timur', 'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Utara',
  'Sulawesi Selatan', 'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Maluku', 'Maluku Utara'
]

export default function AdminShippingPage() : React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'zones' | 'rates'>('zones')
  
  // Queries
  const { data: zones, isLoading: zonesLoading, isError: zonesError, refetch: refetchZones } = useAdminShippingZones()
  const { data: rates, isLoading: ratesLoading, isError: ratesError, refetch: refetchRates } = useAdminShippingRates()

  // Mutations
  const createZoneMutation = useAdminCreateShippingZone()
  const updateZoneMutation = useAdminUpdateShippingZone()
  const deleteZoneMutation = useAdminDeleteShippingZone()
  
  const createRateMutation = useAdminCreateShippingRate()
  const updateRateMutation = useAdminUpdateShippingRate()
  const deleteRateMutation = useAdminDeleteShippingRate()

  // Modal states
  const [zoneModalOpen, setZoneModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null)
  const [zoneName, setZoneName] = useState('')
  const [zoneDesc, setZoneDesc] = useState('')
  const [zoneActive, setZoneActive] = useState(true)
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([])

  const [rateModalOpen, setRateModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null)
  const [rateZoneId, setRateZoneId] = useState('')
  const [rateCourier, setRateCourier] = useState('')
  const [ratePricePerKg, setRatePricePerKg] = useState(0)
  const [rateMinWeight, setRateMinWeight] = useState(1000)
  const [rateBasePrice, setRateBasePrice] = useState(0)
  const [rateEtdMin, setRateEtdMin] = useState(1)
  const [rateEtdMax, setRateEtdMax] = useState(3)
  const [rateActive, setRateActive] = useState(true)

  // --- Zone Handlers ---
  const handleOpenZoneModal = (zone: ShippingZone | null = null) => {
    if (zone) {
      setEditingZone(zone)
      setZoneName(zone.name)
      setZoneDesc(zone.description || '')
      setZoneActive(zone.is_active)
      setSelectedProvinces(zone.shipping_zone_coverage?.map((c) => c.province_name) || [])
    } else {
      setEditingZone(null)
      setZoneName('')
      setZoneDesc('')
      setZoneActive(true)
      setSelectedProvinces([])
    }
    setZoneModalOpen(true)
  }

  const handleToggleProvince = (p: string) => {
    setSelectedProvinces((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    )
  }

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!zoneName.trim()) {
      toast.error('Nama zona wajib diisi')
      return
    }

    const zonePayload = {
      name: zoneName.trim(),
      description: zoneDesc.trim() || null,
      is_active: zoneActive,
    }

    try {
      if (editingZone) {
        await updateZoneMutation.mutateAsync({
          zoneId: editingZone.id,
          zone: zonePayload,
          provinces: selectedProvinces,
        })
        toast.success('Zona pengiriman berhasil diperbarui')
      } else {
        await createZoneMutation.mutateAsync({
          zone: zonePayload,
          provinces: selectedProvinces,
        })
        toast.success('Zona pengiriman baru berhasil ditambahkan')
      }
      setZoneModalOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan zona pengiriman'
      toast.error(message)
    }
  }

  const handleDeleteZone = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus zona "${name}"? Seluruh tarif yang menggunakan zona ini juga akan terhapus!`)) {
      return
    }
    try {
      await deleteZoneMutation.mutateAsync(id)
      toast.success('Zona pengiriman berhasil dihapus')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus zona'
      toast.error(message)
    }
  }

  // --- Rate Handlers ---
  const handleOpenRateModal = (rate: ShippingRate | null = null) => {
    if (rate) {
      setEditingRate(rate)
      setRateZoneId(rate.zone_id)
      setRateCourier(rate.courier_name)
      setRatePricePerKg(Number(rate.price_per_kg))
      setRateMinWeight(rate.min_weight_gram)
      setRateBasePrice(Number(rate.base_price))
      setRateEtdMin(rate.etd_days_min)
      setRateEtdMax(rate.etd_days_max)
      setRateActive(rate.is_active)
    } else {
      setEditingRate(null)
      setRateZoneId(zones?.[0]?.id || '')
      setRateCourier('')
      setRatePricePerKg(0)
      setRateMinWeight(1000)
      setRateBasePrice(0)
      setRateEtdMin(1)
      setRateEtdMax(3)
      setRateActive(true)
    }
    setRateModalOpen(true)
  }

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rateZoneId || !rateCourier.trim() || ratePricePerKg <= 0 || rateBasePrice <= 0) {
      toast.error('Harap isi semua kolom wajib dengan benar')
      return
    }

    const ratePayload = {
      zone_id: rateZoneId,
      courier_name: rateCourier.trim(),
      price_per_kg: ratePricePerKg,
      min_weight_gram: rateMinWeight,
      base_price: rateBasePrice,
      etd_days_min: rateEtdMin,
      etd_days_max: rateEtdMax,
      is_active: rateActive,
    }

    try {
      if (editingRate) {
        await updateRateMutation.mutateAsync({
          rateId: editingRate.id,
          rate: ratePayload,
        })
        toast.success('Tarif pengiriman berhasil diperbarui')
      } else {
        await createRateMutation.mutateAsync(ratePayload)
        toast.success('Tarif pengiriman baru berhasil ditambahkan')
      }
      setRateModalOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan tarif pengiriman'
      toast.error(message)
    }
  }

  const handleDeleteRate = async (id: string, courier: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tarif kurir "${courier}"?`)) {
      return
    }
    try {
      await deleteRateMutation.mutateAsync(id)
      toast.success('Tarif pengiriman berhasil dihapus')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus tarif'
      toast.error(message)
    }
  }

  const handleRefresh = () => {
    refetchZones()
    refetchRates()
    toast.success('Data diperbarui')
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Manajemen Pengiriman"
        subtitle="Kelola zona pengiriman custom beserta tarif per kg untuk setiap ekspedisi."
      >
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="text-xs font-semibold py-2 px-3 border-neutral-200"
        >
          <RefreshCw size={12} className="mr-1.5" /> Segarkan
        </Button>
      </AdminPageHeader>

      {/* Tabs Layout */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('zones')}
          className={`flex items-center py-3 px-6 text-xs font-heading tracking-wider uppercase font-semibold border-b-2 transition-all ${
            activeTab === 'zones'
              ? 'border-neutral-900 text-neutral-950 bg-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <MapPin size={13} className="mr-2" /> Zona Pengiriman ({zones?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`flex items-center py-3 px-6 text-xs font-heading tracking-wider uppercase font-semibold border-b-2 transition-all ${
            activeTab === 'rates'
              ? 'border-neutral-900 text-neutral-950 bg-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Truck size={13} className="mr-2" /> Tarif Kurir ({rates?.length || 0})
        </button>
      </div>

      {/* 1. ZONES TAB CONTENT */}
      <AnimatePresence mode="wait">
        {activeTab === 'zones' ? (
          <motion.div
            key="zones-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex justify-end">
              <Button onClick={() => handleOpenZoneModal()} className="text-xs font-bold uppercase tracking-wider py-2.5 px-4">
                <Plus size={14} className="mr-1.5" /> Tambah Zona Baru
              </Button>
            </div>

          {zonesLoading ? (
            <div className="h-40 bg-white border border-neutral-200 animate-pulse" />
          ) : zonesError ? (
            <div className="text-center py-12 border border-neutral-200 bg-white">
              <p className="text-red-500 text-xs font-semibold uppercase">Gagal memuat zona pengiriman</p>
              <Button onClick={() => refetchZones()} variant="outline" className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block">
                Coba Lagi
              </Button>
            </div>
          ) : !zones || zones.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-200 text-neutral-400 text-xs italic bg-white">
              Belum ada zona pengiriman custom yang terdaftar.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {zones.map((zone) => (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-neutral-200 bg-white p-5 space-y-4 flex flex-col justify-between hover:shadow-xs transition duration-150"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif font-bold text-neutral-900 text-base">{zone.name}</h3>
                      <span className={`inline-block text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 ${
                        zone.is_active
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {zone.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    {zone.description && <p className="text-xs text-neutral-500">{zone.description}</p>}
                    
                    {/* Covered provinces badges */}
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Cakupan Provinsi:</p>
                      {zone.shipping_zone_coverage && zone.shipping_zone_coverage.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {zone.shipping_zone_coverage.map((c) => (
                            <span key={c.province_name} className="bg-neutral-100 text-neutral-700 text-[10px] px-2 py-0.5 font-medium border border-neutral-200">
                              {c.province_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-red-500 italic font-medium">Belum ada provinsi yang dicakup zona ini.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
                    <Button onClick={() => handleOpenZoneModal(zone)} variant="outline" className="text-[10px] py-1.5 px-3 font-bold uppercase border-neutral-200">
                      <Edit size={11} className="mr-1" /> Edit
                    </Button>
                    <Button onClick={() => handleDeleteZone(zone.id, zone.name)} variant="outline" className="text-[10px] py-1.5 px-3 font-bold uppercase border-red-200 text-red-500 hover:bg-red-50">
                      <Trash2 size={11} className="mr-1" /> Hapus
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </motion.div>
        ) : (
          <motion.div
            key="rates-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
          <div className="flex justify-end">
            <Button
              onClick={() => handleOpenRateModal()}
              disabled={!zones || zones.length === 0}
              className="text-xs font-bold uppercase tracking-wider py-2.5 px-4"
            >
              <Plus size={14} className="mr-1.5" /> Tambah Tarif Baru
            </Button>
          </div>

          {ratesLoading ? (
            <div className="h-40 bg-white border border-neutral-200 animate-pulse" />
          ) : ratesError ? (
            <div className="text-center py-12 border border-neutral-200 bg-white">
              <p className="text-red-500 text-xs font-semibold uppercase">Gagal memuat tarif pengiriman</p>
              <Button onClick={() => refetchRates()} variant="outline" className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block">
                Coba Lagi
              </Button>
            </div>
          ) : !rates || rates.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-200 text-neutral-400 text-xs italic bg-white">
              Belum ada tarif pengiriman kurir yang terdaftar.
            </div>
          ) : (
            <div className="border border-neutral-200 bg-white rounded-none overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-400 uppercase tracking-wider font-semibold">
                    <th className="py-4 px-6">Nama Kurir</th>
                    <th className="py-4 px-6">Zona</th>
                    <th className="py-4 px-6 text-right">Biaya Awal</th>
                    <th className="py-4 px-6 text-right">Tarif / Kg</th>
                    <th className="py-4 px-6 text-center">Estimasi Tiba</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                  {rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-neutral-50/30">
                      <td className="py-4 px-6 font-bold text-neutral-900 uppercase">{rate.courier_name}</td>
                      <td className="py-4 px-6">{rate.shipping_zones?.name || 'Zona Tidak Diketahui'}</td>
                      <td className="py-4 px-6 text-right font-bold text-neutral-800">{formatIDR(rate.base_price)}</td>
                      <td className="py-4 px-6 text-right text-neutral-600">{formatIDR(rate.price_per_kg)}</td>
                      <td className="py-4 px-6 text-center">{rate.etd_days_min} - {rate.etd_days_max} Hari</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 ${
                          rate.is_active
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {rate.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <button onClick={() => handleOpenRateModal(rate)} className="text-neutral-500 hover:text-neutral-800 p-1.5 inline-block border border-neutral-200">
                          <Edit size={12} />
                        </button>
                        <button onClick={() => handleDeleteRate(rate.id, rate.courier_name)} className="text-red-500 hover:text-red-700 p-1.5 inline-block border border-red-100 hover:bg-red-50">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ZONES CONFIG MODAL --- */}
      <Modal
        isOpen={zoneModalOpen}
        onClose={() => setZoneModalOpen(false)}
        title={editingZone ? 'Ubah Zona Pengiriman' : 'Tambah Zona Baru'}
        size="lg"
      >
        <form onSubmit={handleSaveZone} className="space-y-4">
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

          {/* Covered Provinces selection grid */}
          <div className="flex flex-col space-y-2">
            <label className="font-bold text-neutral-500 uppercase tracking-wider">Pilih Cakupan Provinsi* (Minimal 1)</label>
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
            <label htmlFor="zoneActive" className="font-bold text-[10px] uppercase tracking-wider text-neutral-700 cursor-pointer">Aktifkan Zona ini</label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={() => setZoneModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={createZoneMutation.isPending || updateZoneMutation.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* --- RATES CONFIG MODAL --- */}
      <Modal
        isOpen={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        title={editingRate ? 'Ubah Tarif Kurir' : 'Tambah Tarif Baru'}
        size="md"
      >
        <form onSubmit={handleSaveRate} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <Select
              label="Pilih Zona Pengiriman*"
              required
              value={rateZoneId}
              onChange={setRateZoneId}
              options={zones?.map(z => ({ label: z.name, value: z.id })) || []}
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
                onChange={(e) => setRateEtdMax(Math.max(rateEtdMin, parseInt(e.target.value) || rateEtdMin))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="rateActive"
              checked={rateActive}
              onChange={(e) => setRateActive(e.target.checked)}
            />
            <label htmlFor="rateActive" className="font-bold text-[10px] uppercase tracking-wider text-neutral-700 cursor-pointer">Aktifkan Layanan Kurir ini</label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={() => setRateModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={createRateMutation.isPending || updateRateMutation.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
