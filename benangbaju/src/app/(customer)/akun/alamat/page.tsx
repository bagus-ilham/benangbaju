'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/modules/users/stores/authStore'
import {
  useUserAddresses,
  useDeleteUserAddress,
  useSetDefaultAddress,
} from '@/modules/shipping/hooks/useShipping'
import type { UserAddress } from '@/modules/shipping/types'
import { AddressCard } from '@/modules/users/components/AddressCard'
import { AddressModal } from '@/modules/users/components/AddressModal'
import { AuthLoading, Button, PageContainer, PageHero } from '@/shared/components'
import { ArrowLeft, Plus } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'

export default function AlamatPage(): React.JSX.Element {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [addressToEdit, setAddressToEdit] = useState<UserAddress | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/akun/alamat')
    }
  }, [isAuthenticated, authLoading, router])

  const { data: addressesRes, isLoading: addressesLoading } = useUserAddresses(user?.id || '')
  const addresses = addressesRes?.data || []
  const deleteMutation = useDeleteUserAddress()
  const setDefaultMutation = useSetDefaultAddress()

  const handleEdit = (address: UserAddress) => {
    setAddressToEdit(address)
    setModalOpen(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!user) return
    if (confirm('Apakah Anda yakin ingin menghapus alamat ini?')) {
      try {
        await deleteMutation.mutateAsync({ addressId, userId: user.id })
        toast.success('Alamat berhasil dihapus')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Gagal mengubah alamat utama')
    }
  }

  if (authLoading || !isAuthenticated) {
    return <AuthLoading message="Memuat halaman..." />
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Pengiriman"
        title="Daftar Alamat"
        subtitle="Kelola alamat pengiriman Anda untuk memudahkan proses checkout."
      />
      <PageContainer size="lg" className="py-10 page-content">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-neutral-400">
            <Link href="/akun" className="hover:text-brand-gold transition">
              Akun Saya
            </Link>
            <span>/</span>
            <span className="text-brand-black font-semibold">Daftar Alamat</span>
          </div>
          <Button
            onClick={() => {
              setAddressToEdit(null)
              setModalOpen(true)
            }}
            className="flex items-center justify-center text-xs uppercase tracking-widest font-semibold py-3 px-5"
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
            className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-neutral-600 hover:text-brand-gold transition duration-100"
          >
            <ArrowLeft size={14} className="mr-2" /> Kembali ke Akun
          </Link>
        </div>
      </PageContainer>

      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={user?.id || ''}
        addressToEdit={addressToEdit}
      />
    </div>
  )
}
