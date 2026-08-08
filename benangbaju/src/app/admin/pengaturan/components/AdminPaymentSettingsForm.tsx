'use client'

import React, { useState } from 'react'
import { Button, Input, Select, HandDrawnIcon } from '@/shared/components'
import { usePaymentFeeConfigs, useAdminUpdatePaymentFeeConfig } from '@/modules/settings/hooks/useAdminSettings'
import type { PaymentFeeConfig } from '@/modules/orders/types'
import { formatIDR } from '@/lib/utils'
import toast from 'react-hot-toast'

export function AdminPaymentSettingsForm(): React.JSX.Element {
  const { data: configsRes, isLoading, refetch } = usePaymentFeeConfigs()
  const updateMutation = useAdminUpdatePaymentFeeConfig()
  const configs = configsRes?.data || []

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<PaymentFeeConfig>>({})

  const handleStartEdit = (config: PaymentFeeConfig) => {
    setEditingId(config.id)
    setEditForm({
      fee_type: config.fee_type,
      fee_flat: config.fee_flat,
      fee_percentage: config.fee_percentage,
      is_active: config.is_active,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSave = async (config: PaymentFeeConfig) => {
    try {
      toast.loading(`Menyimpan biaya ${config.channel_name}...`, { id: 'save-fee' })
      await updateMutation.mutateAsync({
        id: config.id,
        updates: {
          fee_type: editForm.fee_type || config.fee_type,
          fee_flat: editForm.fee_flat ?? config.fee_flat,
          fee_percentage: editForm.fee_percentage ?? config.fee_percentage,
          is_active: editForm.is_active ?? config.is_active,
        },
      })
      toast.success(`Berhasil memperbarui biaya ${config.channel_name}`, { id: 'save-fee' })
      setEditingId(null)
      setEditForm({})
      refetch()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan biaya', { id: 'save-fee' })
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
        Memuat konfigurasi biaya pembayaran...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border border-neutral-200 bg-brand-cream p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-brand-black flex items-center">
              <HandDrawnIcon name="tag" className="h-4 w-4 mr-2 text-brand-plum" /> Tarif Biaya Admin DOKU (Dibebankan ke Customer)
            </h3>
            <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
              Atur tarif nominal flat (Rp) atau persentase (%) yang ditambahkan ke total pesanan customer untuk setiap saluran pembayaran.
            </p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {configs.map((config) => {
            const isEditing = editingId === config.id

            return (
              <div key={config.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-bold text-xs text-brand-black">
                      {config.channel_name}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${
                        config.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {config.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-sans uppercase tracking-wider">
                    Kode: <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">{config.channel_code}</code> | Kategori: {config.category}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-neutral-200">
                    <Select
                      label="Tipe Fee"
                      value={editForm.fee_type || 'flat'}
                      onChange={(val) => setEditForm((prev) => ({ ...prev, fee_type: val as any }))}
                      options={[
                        { label: 'Flat (Rp)', value: 'flat' },
                        { label: 'Persentase (%)', value: 'percentage' },
                        { label: 'Flat + Persentase', value: 'flat_and_percentage' },
                      ]}
                    />
                    {(editForm.fee_type === 'flat' || editForm.fee_type === 'flat_and_percentage') && (
                      <Input
                        label="Nominal Flat (Rp)"
                        type="number"
                        value={editForm.fee_flat ?? 0}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, fee_flat: Number(e.target.value) || 0 }))}
                      />
                    )}
                    {(editForm.fee_type === 'percentage' || editForm.fee_type === 'flat_and_percentage') && (
                      <Input
                        label="Persentase (%)"
                        type="number"
                        step="0.001"
                        value={editForm.fee_percentage ?? 0}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, fee_percentage: Number(e.target.value) || 0 }))}
                      />
                    )}
                    <Select
                      label="Status"
                      value={editForm.is_active ? 'true' : 'false'}
                      onChange={(val) => setEditForm((prev) => ({ ...prev, is_active: val === 'true' }))}
                      options={[
                        { label: 'Aktif', value: 'true' },
                        { label: 'Nonaktif', value: 'false' },
                      ]}
                    />
                    <div className="sm:col-span-3 flex justify-end space-x-2 pt-2 border-t border-neutral-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="text-[10px] py-1.5 px-3"
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleSave(config)}
                        isLoading={updateMutation.isPending}
                        className="text-[10px] py-1.5 px-3"
                      >
                        Simpan Perubahan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between md:justify-end space-x-4 w-full md:w-auto">
                    <div className="text-right">
                      <div className="font-heading font-bold text-xs text-brand-plum">
                        {config.fee_type === 'flat'
                          ? formatIDR(config.fee_flat)
                          : config.fee_type === 'percentage'
                          ? `${config.fee_percentage}%`
                          : `${formatIDR(config.fee_flat)} + ${config.fee_percentage}%`}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-sans">
                        {config.fee_type === 'flat' ? 'Tarif Flat' : config.fee_type === 'percentage' ? 'Dari Total Belanja' : 'Kombinasi'}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleStartEdit(config)}
                      className="text-[10px] py-1.5 px-3 uppercase tracking-wider"
                    >
                      Ubah Fee
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
