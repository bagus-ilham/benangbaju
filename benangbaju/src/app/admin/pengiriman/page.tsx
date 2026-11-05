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
} from '@/app/admin/hooks/useAdmin'
import type { ShippingZone, ShippingRate } from '@/modules/shipping/types'
import { Button, AdminPageHeader, HandDrawnIcon } from '@/shared/components'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShippingZonesTable,
  ShippingRatesTable,
  ShippingZoneModal,
  ShippingRateModal,
} from './components'

export default function AdminShippingPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'zones' | 'rates'>('zones')

  // Queries
  const {
    data: zonesRes,
    isLoading: zonesLoading,
    isError: zonesError,
    refetch: refetchZones,
  } = useAdminShippingZones()
  const zones = zonesRes?.data || []
  const {
    data: ratesRes,
    isLoading: ratesLoading,
    isError: ratesError,
    refetch: refetchRates,
  } = useAdminShippingRates()
  const rates = ratesRes?.data || []

  // Mutations
  const createZoneMutation = useAdminCreateShippingZone()
  const updateZoneMutation = useAdminUpdateShippingZone()
  const deleteZoneMutation = useAdminDeleteShippingZone()

  const createRateMutation = useAdminCreateShippingRate()
  const updateRateMutation = useAdminUpdateShippingRate()
  const deleteRateMutation = useAdminDeleteShippingRate()

  // Modal states - Zones
  const [zoneModalOpen, setZoneModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null)
  const [zoneName, setZoneName] = useState('')
  const [zoneDesc, setZoneDesc] = useState('')
  const [zoneCountryCode, setZoneCountryCode] = useState<'ID' | 'MY'>('ID')
  const [zoneActive, setZoneActive] = useState(true)
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([])

  // Modal states - Rates
  const [rateModalOpen, setRateModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null)
  const [rateZoneId, setRateZoneId] = useState('')
  const [rateCourier, setRateCourier] = useState('')
  const [ratePricePerKg, setRatePricePerKg] = useState(0)
  const [rateMinWeight, setRateMinWeight] = useState(1000)
  const [rateMaxWeight, setRateMaxWeight] = useState<number | null>(null)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isMy = zone.shipping_zone_coverage?.some((c: any) => c.country_code === 'MY')
      setZoneCountryCode(isMy ? 'MY' : 'ID')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedProvinces(zone.shipping_zone_coverage?.map((c: any) => c.province_name) || [])
    } else {
      setEditingZone(null)
      setZoneName('')
      setZoneDesc('')
      setZoneCountryCode('ID')
      setZoneActive(true)
      setSelectedProvinces([])
    }
    setZoneModalOpen(true)
  }

  const handleCountryCodeChange = (country: 'ID' | 'MY') => {
    setZoneCountryCode(country)
    setSelectedProvinces([])
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

    if (selectedProvinces.length === 0) {
      toast.error('Pilih minimal 1 wilayah cakupan untuk zona ini')
      return
    }

    const zonePayload = {
      name: zoneName.trim(),
      description: zoneDesc.trim() || null,
      country_code: zoneCountryCode,
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
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus zona "${name}"? Seluruh tarif yang menggunakan zona ini juga akan terhapus!`
      )
    ) {
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
      setRateMaxWeight(rate.max_weight_gram ?? null)
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
      setRateMaxWeight(null)
      setRateBasePrice(0)
      setRateEtdMin(1)
      setRateEtdMax(3)
      setRateActive(true)
    }
    setRateModalOpen(true)
  }

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rateZoneId || !rateCourier.trim() || ratePricePerKg <= 0 || rateBasePrice < 0) {
      toast.error('Harap isi semua kolom wajib dengan benar')
      return
    }

    const ratePayload = {
      zone_id: rateZoneId,
      courier_name: rateCourier.trim(),
      price_per_kg: ratePricePerKg,
      min_weight_gram: rateMinWeight,
      max_weight_gram: rateMaxWeight || null,
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

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Manajemen Pengiriman"
        subtitle="Kelola zona pengiriman custom (Domestik Indonesia & Ekspor Malaysia) beserta tarif per kg untuk setiap ekspedisi."
      >
        <Button
          onClick={() => {
            refetchZones()
            refetchRates()
          }}
          variant="outline"
          className="text-xs font-semibold py-2 px-3 border-neutral-200"
        >
          <HandDrawnIcon name="refresh" className="h-3.5 w-3.5 mr-1.5" /> Segarkan
        </Button>
      </AdminPageHeader>

      {/* Tabs Layout */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('zones')}
          className={`py-3 px-6 text-xs uppercase tracking-wider font-bold transition border-b-2 flex items-center ${
            activeTab === 'zones'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <HandDrawnIcon name="map-pin" className="h-4 w-4 mr-1.5" /> Zona Wilayah ({zones.length})
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`py-3 px-6 text-xs uppercase tracking-wider font-bold transition border-b-2 flex items-center ${
            activeTab === 'rates'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <HandDrawnIcon name="tag" className="h-4 w-4 mr-1.5" /> Tarif Kurir ({rates.length})
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-neutral-900">
            {activeTab === 'zones' ? 'Daftar Zona Pengiriman' : 'Daftar Tarif Kurir'}
          </h2>
          <p className="text-xs text-neutral-500">
            {activeTab === 'zones'
              ? 'Kelompokkan provinsi ke dalam zona biaya untuk perhitungan ongkir otomatis.'
              : 'Konfigurasikan biaya dasar dan tarif progresif per kg per zona wilayah.'}
          </p>
        </div>
        <Button
          onClick={() => (activeTab === 'zones' ? handleOpenZoneModal() : handleOpenRateModal())}
          className="text-xs uppercase font-bold tracking-wider py-2.5 px-4"
        >
          <HandDrawnIcon name="plus" className="h-3.5 w-3.5 mr-1.5" />
          {activeTab === 'zones' ? 'Tambah Zona Baru' : 'Tambah Tarif Baru'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'zones' ? (
          <motion.div
            key="zones"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <ShippingZonesTable
              zones={zones}
              isLoading={zonesLoading}
              isError={zonesError}
              onRefetch={refetchZones}
              onEdit={handleOpenZoneModal}
              onDelete={handleDeleteZone}
            />
          </motion.div>
        ) : (
          <motion.div
            key="rates"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <ShippingRatesTable
              rates={rates}
              isLoading={ratesLoading}
              isError={ratesError}
              onRefetch={refetchRates}
              onEdit={handleOpenRateModal}
              onDelete={handleDeleteRate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ShippingZoneModal
        isOpen={zoneModalOpen}
        onClose={() => setZoneModalOpen(false)}
        onSubmit={handleSaveZone}
        editingZone={editingZone}
        zoneName={zoneName}
        setZoneName={setZoneName}
        zoneDesc={zoneDesc}
        setZoneDesc={setZoneDesc}
        zoneCountryCode={zoneCountryCode}
        setZoneCountryCode={handleCountryCodeChange}
        selectedProvinces={selectedProvinces}
        handleToggleProvince={handleToggleProvince}
        zoneActive={zoneActive}
        setZoneActive={setZoneActive}
        isPending={createZoneMutation.isPending || updateZoneMutation.isPending}
      />

      <ShippingRateModal
        isOpen={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        onSubmit={handleSaveRate}
        editingRate={editingRate}
        zones={zones}
        rateZoneId={rateZoneId}
        setRateZoneId={setRateZoneId}
        rateCourier={rateCourier}
        setRateCourier={setRateCourier}
        rateBasePrice={rateBasePrice}
        setRateBasePrice={setRateBasePrice}
        ratePricePerKg={ratePricePerKg}
        setRatePricePerKg={setRatePricePerKg}
        rateMinWeight={rateMinWeight}
        setRateMinWeight={setRateMinWeight}
        rateMaxWeight={rateMaxWeight}
        setRateMaxWeight={setRateMaxWeight}
        rateEtdMin={rateEtdMin}
        setRateEtdMin={setRateEtdMin}
        rateEtdMax={rateEtdMax}
        setRateEtdMax={setRateEtdMax}
        rateActive={rateActive}
        setRateActive={setRateActive}
        isPending={createRateMutation.isPending || updateRateMutation.isPending}
      />
    </div>
  )
}
