'use client'

import React, { useState } from 'react'
import {
  useAdminVouchers,
  useAdminCreateVoucher,
  useAdminUpdateVoucher,
  useAdminDeleteVoucher,
} from '@/app/admin/hooks/useAdmin'
import { Button, AdminPageHeader } from '@/shared/components'
import { Plus, Edit2, Trash2, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@/lib/supabase/client'
import { formatLocalISO } from '@/lib/utils/format'
import { Voucher } from '@/modules/vouchers/types'
import { VoucherFormModal } from './components/VoucherFormModal'

const supabase = createBrowserClient()

export default function AdminVouchersPage(): React.JSX.Element {
  const { data: vouchersRes, isLoading, isError, refetch } = useAdminVouchers()
  const vouchers = vouchersRes?.data || []

  const createMutation = useAdminCreateVoucher()
  const updateMutation = useAdminUpdateVoucher()
  const deleteMutation = useAdminDeleteVoucher()

  // Modal control states
  const [isOpen, setIsOpen] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)

  // Form states
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [discount_type, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState(0)
  const [min_purchase, setMinPurchase] = useState(0)
  const [max_discount, setMaxDiscount] = useState<number | null>(null)
  const [usage_limit, setUsageLimit] = useState<number | null>(null)
  const [usage_per_user, setUsagePerUser] = useState(1)
  const [starts_at, setStartsAt] = useState('')
  const [expires_at, setExpiresAt] = useState('')
  const [is_active, setIsActive] = useState(true)

  const handleOpenAdd = () => {
    setEditingVoucher(null)
    setCode('')
    setName('')
    setDiscountType('percentage')
    setValue(0)
    setMinPurchase(0)
    setMaxDiscount(null)
    setUsageLimit(null)
    setUsagePerUser(1)
    setStartsAt('')
    setExpiresAt('')
    setIsActive(true)
    setIsOpen(true)
  }

  const handleOpenEdit = (v: Voucher) => {
    setEditingVoucher(v)
    setCode(v.code || '')
    setName(v.name || '')
    setDiscountType(
      v.discount_type === 'percentage' || v.discount_type === 'fixed'
        ? v.discount_type
        : 'percentage'
    )
    setValue(Number(v.value) || 0)
    setMinPurchase(Number(v.min_purchase) || 0)
    setMaxDiscount(v.max_discount ? Number(v.max_discount) : null)
    setUsageLimit(v.usage_limit ? Number(v.usage_limit) : null)
    setUsagePerUser(v.usage_per_user || 1)
    setStartsAt(formatLocalISO(v.starts_at))
    setExpiresAt(formatLocalISO(v.expires_at))
    setIsActive(v.is_active !== false)
    setIsOpen(true)
  }

  const handleDuplicate = (v: Voucher) => {
    setEditingVoucher(null)
    setCode((v.code || '') + '_COPY')
    setName((v.name || '') + ' (Copy)')
    setDiscountType(
      v.discount_type === 'percentage' || v.discount_type === 'fixed'
        ? v.discount_type
        : 'percentage'
    )
    setValue(Number(v.value) || 0)
    setMinPurchase(Number(v.min_purchase) || 0)
    setMaxDiscount(v.max_discount ? Number(v.max_discount) : null)
    setUsageLimit(v.usage_limit ? Number(v.usage_limit) : null)
    setUsagePerUser(v.usage_per_user || 1)
    setStartsAt(formatLocalISO(v.starts_at || ''))
    setExpiresAt(formatLocalISO(v.expires_at || ''))
    setIsActive(v.is_active !== false)
    setIsOpen(true)
  }

  const handleToggleActive = async (v: Voucher) => {
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ is_active: !v.is_active })
        .eq('id', v.id)

      if (error) throw error
      toast.success('Status aktif berhasil diubah')
      refetch()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan voucher ini?')) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success('Voucher dinonaktifkan')
        refetch()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        toast.error('Gagal menonaktifkan voucher')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim() || !starts_at || !expires_at) {
      toast.error('Kode, Nama, Tanggal Mulai & Expired wajib diisi')
      return
    }

    if (starts_at && expires_at && new Date(expires_at) <= new Date(starts_at)) {
      toast.error('Tanggal akhir berlaku (expired) harus setelah tanggal mulai aktif')
      return
    }

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      discount_type,
      value: Number(value) || 0,
      min_purchase: Number(min_purchase) || 0,
      max_discount: max_discount === null || max_discount === 0 ? null : Number(max_discount),
      usage_limit: usage_limit === null || usage_limit === 0 ? null : Number(usage_limit),
      usage_per_user: Number(usage_per_user) || 1,
      starts_at: new Date(starts_at).toISOString(),
      expires_at: new Date(expires_at).toISOString(),
      is_active,
    }

    try {
      if (editingVoucher) {
        await updateMutation.mutateAsync({
          voucherId: editingVoucher.id,
          voucherData: payload,
        })
        toast.success('Voucher berhasil diperbarui')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Voucher berhasil ditambahkan')
      }
      setIsOpen(false)
      refetch()
    } catch (err: unknown) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan voucher'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader title="Kupon Voucher" subtitle="Kelola diskon belanja dan penawaran khusus.">
        <Button
          onClick={handleOpenAdd}
          className="text-xs uppercase font-bold tracking-widest flex items-center py-3 px-5"
        >
          <Plus size={14} className="mr-1.5" /> Tambah Voucher
        </Button>
      </AdminPageHeader>

      {/* Main Table */}
      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
              Memuat voucher...
            </p>
          </div>
        ) : isError ? (
          <div className="py-24 text-center">
            <p className="text-red-500 text-xs font-semibold uppercase">
              Gagal memuat voucher dari server
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block"
            >
              Coba Lagi
            </Button>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 italic text-xs">
            Belum ada kupon diskon ditambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-3 px-5">Kode / Nama</th>
                  <th className="py-3 px-4">Tipe Diskon</th>
                  <th className="py-3 px-4 text-center">Batas Penggunaan</th>
                  <th className="py-3 px-4 text-center">Periode Aktif</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                {vouchers.map((v: Voucher) => (
                  <tr key={v.id} className="hover:bg-neutral-50/20 transition duration-150">
                    <td className="py-4 px-5">
                      <span className="font-bold text-neutral-900 text-sm block font-mono select-all tracking-wider">
                        {v.code}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-normal mt-0.5 block">
                        {v.name}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-neutral-600">
                      <p className="font-bold text-neutral-850">
                        {v.discount_type === 'percentage'
                          ? `${v.value}%`
                          : `Rp ${Number(v.value).toLocaleString()}`}
                      </p>
                      <p className="text-[10px] text-neutral-450 font-normal">
                        Min Belanja: Rp {Number(v.min_purchase).toLocaleString()}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <p className="font-semibold">
                        {v.used_count || 0} / {v.usage_limit || '∞'} Terpakai
                      </p>
                      <p className="text-[10px] text-neutral-400 font-normal">
                        Maksimal {v.usage_per_user} per user
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center text-neutral-550 leading-relaxed">
                      <p>{v.starts_at ? new Date(v.starts_at).toLocaleDateString() : '-'}</p>
                      <p className="text-[10px] text-neutral-400 font-normal">
                        s.d {v.expires_at ? new Date(v.expires_at).toLocaleDateString() : '-'}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(v)}
                        className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 transition ${
                          v.is_active
                            ? 'bg-neutral-900 text-white border border-neutral-900'
                            : 'bg-white text-neutral-400 border border-neutral-200'
                        }`}
                      >
                        {v.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        onClick={() => handleDuplicate(v)}
                        variant="outline"
                        className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                        title="Duplikat Voucher"
                      >
                        <Copy size={13} />
                      </Button>
                      <Button
                        onClick={() => handleOpenEdit(v)}
                        variant="outline"
                        className="p-2 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                        title="Edit Voucher"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(v.id)}
                        variant="outline"
                        className="p-2 border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form editor */}
      <VoucherFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isEditing={!!editingVoucher}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        code={code}
        setCode={setCode}
        name={name}
        setName={setName}
        discount_type={discount_type}
        setDiscountType={setDiscountType}
        value={value}
        setValue={setValue}
        min_purchase={min_purchase}
        setMinPurchase={setMinPurchase}
        max_discount={max_discount}
        setMaxDiscount={setMaxDiscount}
        usage_limit={usage_limit}
        setUsageLimit={setUsageLimit}
        usage_per_user={usage_per_user}
        setUsagePerUser={setUsagePerUser}
        starts_at={starts_at}
        setStartsAt={setStartsAt}
        expires_at={expires_at}
        setExpiresAt={setExpiresAt}
        is_active={is_active}
        setIsActive={setIsActive}
      />
    </div>
  )
}
