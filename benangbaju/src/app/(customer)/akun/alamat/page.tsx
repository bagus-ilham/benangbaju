'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useUserAddresses, useDeleteUserAddress, useSetDefaultAddress } from '@/hooks/useShipping'
import { AddressCard } from '@/components/customer/AddressCard'
import { AddressModal } from '@/components/customer/AddressModal'
import { Button } from '@/components/shared/Button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AlamatPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [addressToEdit, setAddressToEdit] = useState<any | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/akun/alamat')
    }
  }, [isAuthenticated, authLoading, router])

  const { data: addresses, isLoading: addressesLoading } = useUserAddresses(user?.id || '')
  const deleteMutation = useDeleteUserAddress()
  const setDefaultMutation = useSetDefaultAddress()

  const handleEdit = (address: any) => {
    setAddressToEdit(address)
    setModalOpen(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!user) return
    if (confirm('Apakah Anda yakin ingin menghapus alamat ini?')) {
      try {
        await deleteMutation.mutateAsync({ addressId, userId: user.id })
        toast.success('Alamat berhasil dihapus')
      } catch (err) {
        toast.error('Gagal menghapus alamat')
      }
    }
  }

  const handleSetDefault = async (addressId: string) => {
    if (!user) return
    try {
      await setDefaultMutation.mutateAsync({ addressId, userId: user.id })
      toast.success('Alamat utama berhasil diubah')
    } catch (err) {
      toast.error('Gagal mengubah alamat utama')
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
        <p className="text-neutral-400 text-sm tracking-widest uppercase animate-pulse">Memuat halaman...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center space-x-2 text-xs uppercase tracking-wider text-neutral-400">
          <Link href="/akun" className="hover:text-neutral-900 transition">Akun Saya</Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">Daftar Alamat</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-5 mb-8">
          <div>
            <h1 className="text-3xl font-serif tracking-tight text-neutral-900 mb-1">Daftar Alamat</h1>
            <p className="text-sm text-neutral-500">Kelola alamat pengiriman Anda untuk memudahkan proses checkout.</p>
          </div>
          <Button
            onClick={() => {
              setAddressToEdit(null)
              setModalOpen(true)
            }}
            className="mt-4 sm:mt-0 flex items-center justify-center text-xs uppercase tracking-widest font-semibold py-3 px-5"
          >
            <Plus size={14} className="mr-2" /> Tambah Alamat
          </Button>
        </div>

        {addressesLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-neutral-100 animate-pulse rounded-none" />
            <div className="h-32 bg-neutral-100 animate-pulse rounded-none" />
          </div>
        ) : addresses && addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-neutral-200 bg-neutral-50/50">
            <p className="text-sm text-neutral-500 mb-4">Anda belum memiliki alamat pengiriman.</p>
            <Button
              onClick={() => {
                setAddressToEdit(null)
                setModalOpen(true)
              }}
              variant="outline"
              className="text-xs uppercase tracking-widest font-semibold"
            >
              Tambah Alamat Pertama
            </Button>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-neutral-100">
          <Link
            href="/akun"
            className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-neutral-600 hover:text-neutral-950 transition duration-100"
          >
            <ArrowLeft size={14} className="mr-2" /> Kembali ke Akun
          </Link>
        </div>
      </div>

      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={user?.id || ''}
        addressToEdit={addressToEdit}
      />
    </div>
  )
}
