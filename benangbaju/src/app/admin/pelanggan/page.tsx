'use client'

import React, { useState } from 'react'
import { useAdminCustomers, useAdminToggleCustomerStatus } from '@/app/admin/hooks/useAdmin'
import { Button, AdminPageHeader } from '@/shared/components'
import { Search, UserCheck, UserX, RefreshCw, Mail, Phone, Calendar, Eye } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils/format'
import { motion } from 'framer-motion'

export default function AdminCustomersPage(): React.JSX.Element {
  const { data: customersRes, isLoading, isError, refetch } = useAdminCustomers()
  const customers = customersRes?.data || []
  const toggleStatusMutation = useAdminToggleCustomerStatus()

  const [searchQuery, setSearchQuery] = useState('')

  const handleToggleStatus = async (
    customerId: string,
    currentStatus: boolean,
    customerName: string
  ) => {
    const nextStatus = !currentStatus
    const actionText = nextStatus ? 'mengaktifkan' : 'memblokir'

    if (!confirm(`Apakah Anda yakin ingin ${actionText} akun ${customerName}?`)) {
      return
    }

    try {
      await toggleStatusMutation.mutateAsync({ customerId, isActive: nextStatus })
      toast.success(`Akun ${customerName} berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Gagal mengubah status akun'
      toast.error(message)
    }
  }

  const filteredCustomers = (customers || []).filter((customer) => {
    const safeName = customer.name || 'User'
    const nameMatch = safeName.toLowerCase().includes(searchQuery.toLowerCase())
    const emailMatch = customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false
    const phoneMatch = customer.phone?.includes(searchQuery) || false
    return nameMatch || emailMatch || phoneMatch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
          Memuat data pelanggan...
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm">Gagal memuat data pelanggan.</p>
        <Button onClick={() => refetch()} className="mt-4 text-xs uppercase">
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Manajemen Pelanggan"
        subtitle="Lihat daftar pelanggan terdaftar dan kelola status aktivasi akun mereka."
      >
        <Button
          onClick={() => {
            refetch()
            toast.success('Data diperbarui')
          }}
          variant="outline"
          className="text-xs font-semibold py-2 px-3 border-neutral-200"
        >
          <RefreshCw size={12} className="mr-1.5" /> Segarkan
        </Button>
      </AdminPageHeader>

      {/* Search Bar */}
      <div className="border border-neutral-200 bg-white p-4 rounded-none flex items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            className="w-full bg-neutral-50 text-xs px-4 py-3 pl-10 border border-neutral-200 rounded-none focus:border-brand-black focus:bg-white outline-none"
            placeholder="Cari pelanggan berdasarkan nama, email, atau telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari pelanggan berdasarkan nama, email, atau telepon"
          />
          <Search size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
        </div>
      </div>

      {/* Customers List Table */}
      <div className="border border-neutral-200 bg-white rounded-none">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-xs italic">
            {searchQuery
              ? 'Tidak ada pelanggan yang cocok dengan pencarian Anda.'
              : 'Belum ada pelanggan terdaftar.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-400 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Pelanggan</th>
                  <th className="py-4 px-6">Kontak</th>
                  <th className="py-4 px-6">Bergabung Pada</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                {filteredCustomers.map((customer, idx) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="hover:bg-neutral-50/30"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-none bg-neutral-900 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                          {(customer.name || 'U').substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-neutral-900 font-bold text-sm">
                            {customer.name || 'No Name'}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {customer.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 space-y-1">
                      <p className="flex items-center text-neutral-600">
                        <Mail size={12} className="mr-1.5 text-neutral-400" />
                        <span>{customer.email || '-'}</span>
                      </p>
                      <p className="flex items-center text-neutral-600">
                        <Phone size={12} className="mr-1.5 text-neutral-400" />
                        <span>{customer.phone || '-'}</span>
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="flex items-center text-neutral-600">
                        <Calendar size={12} className="mr-1.5 text-neutral-400" />
                        <span>{formatDate(customer.created_at)}</span>
                      </p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-none ${
                          customer.is_active
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {customer.is_active ? 'Aktif' : 'Diblokir'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right flex items-center justify-end space-x-2">
                      <Link href={`/admin/pelanggan/${customer.id}`}>
                        <Button
                          variant="outline"
                          className="text-[10px] py-1.5 px-3 font-bold uppercase border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        >
                          <Eye size={12} className="mr-1" /> Detail
                        </Button>
                      </Link>
                      {customer.is_active ? (
                        <Button
                          onClick={() =>
                            handleToggleStatus(customer.id, customer.is_active, customer.name)
                          }
                          variant="outline"
                          disabled={toggleStatusMutation.isPending}
                          className="text-[10px] py-1.5 px-3 font-bold uppercase border-red-200 text-red-500 hover:bg-red-50"
                        >
                          <UserX size={12} className="mr-1" /> Blokir
                        </Button>
                      ) : (
                        <Button
                          onClick={() =>
                            handleToggleStatus(customer.id, customer.is_active, customer.name)
                          }
                          disabled={toggleStatusMutation.isPending}
                          className="text-[10px] py-1.5 px-3 font-bold uppercase bg-green-600 border border-green-600 hover:bg-green-700 text-white"
                        >
                          <UserCheck size={12} className="mr-1" /> Aktifkan
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
