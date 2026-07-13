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
import { Button, AdminPageHeader } from '@/shared/components'
import { Plus, MapPin, Truck, RefreshCw } from 'lucide-react'
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
  const [zoneActive, setZoneActive] = useState(true)
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([])

  // Modal states - Rates
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedProvinces(zone.shipping_zone_coverage?.map((c: any) => c.province_name) || [])
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
              <Button
                onClick={() => handleOpenZoneModal()}
                className="text-xs font-bold uppercase tracking-wider py-2.5 px-4"
              >
                <Plus size={14} className="mr-1.5" /> Tambah Zona Baru
              </Button>
            </div>

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
