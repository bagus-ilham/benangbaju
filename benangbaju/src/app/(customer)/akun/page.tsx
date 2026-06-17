'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { User, MapPin, ClipboardList, Heart, LogOut, Key, Bell } from 'lucide-react'

const supabase = createBrowserClient()

export default function AkunPage() {
  const router = useRouter()
  const { user, profile, setProfile, clearAuth, isAuthenticated, isLoading: authLoading } = useAuthStore()

  // Form states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Password change states
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/akun')
    }
  }, [isAuthenticated, authLoading, router])

  // Initialize form
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!name.trim()) {
      toast.error('Nama lengkap tidak boleh kosong')
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setProfile({
          ...data,
          role: data.role as 'customer' | 'admin',
        })
        toast.success('Profil berhasil diperbarui')
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      toast.error(err.message || 'Gagal memperbarui profil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmNewPassword) {
      toast.error('Semua kolom kata sandi wajib diisi')
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Kata sandi baru harus minimal 6 karakter')
      return
    }

    setIsSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success('Kata sandi berhasil diperbarui')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err: any) {
      console.error('Error updating password:', err)
      toast.error(err.message || 'Gagal memperbarui kata sandi')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      clearAuth()
      toast.success('Berhasil keluar')
      router.push('/')
    } catch (err) {
      toast.error('Gagal keluar dari akun')
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
        <div className="border-b border-neutral-200 pb-5 mb-8">
          <h1 className="text-3xl font-serif tracking-tight text-neutral-900 mb-1">Akun Saya</h1>
          <p className="text-sm text-neutral-500">Kelola informasi pribadi Anda dan akses riwayat pesanan Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Navigation Menu */}
          <div className="space-y-2 md:col-span-1">
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-4">Navigasi Akun</h2>
            
            <Link
              href="/pesanan"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-neutral-50 border border-neutral-100 text-neutral-700 hover:text-neutral-950 font-medium transition duration-150 rounded-none text-sm"
            >
              <ClipboardList size={16} />
              <span>Pesanan Saya</span>
            </Link>

            <Link
              href="/akun/alamat"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-neutral-50 border border-neutral-100 text-neutral-700 hover:text-neutral-950 font-medium transition duration-150 rounded-none text-sm"
            >
              <MapPin size={16} />
              <span>Daftar Alamat</span>
            </Link>

            <Link
              href="/wishlist"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-neutral-50 border border-neutral-100 text-neutral-700 hover:text-neutral-950 font-medium transition duration-150 rounded-none text-sm"
            >
              <Heart size={16} />
              <span>Wishlist Saya</span>
            </Link>

            <Link
              href="/akun/notifikasi"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-neutral-50 border border-neutral-100 text-neutral-700 hover:text-neutral-950 font-medium transition duration-150 rounded-none text-sm"
            >
              <Bell size={16} />
              <span>Notifikasi Saya</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50/50 border border-red-100 text-red-500 hover:text-red-700 font-medium transition duration-150 rounded-none text-sm text-left"
            >
              <LogOut size={16} />
              <span>Keluar dari Akun</span>
            </button>
          </div>

          {/* Forms Section */}
          <div className="md:col-span-2 space-y-8">
            {/* Edit Profile Form */}
            <div className="border border-neutral-200 p-6 sm:p-8 rounded-none bg-white">
              <h2 className="text-lg font-serif tracking-tight text-neutral-900 mb-6 flex items-center">
                <User size={18} className="mr-2" /> Informasi Profil
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <Input
                  label="Email (Tidak dapat diubah)"
                  value={user?.email || ''}
                  readOnly
                  disabled
                />

                <Input
                  label="Nama Lengkap*"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  required
                />

                <Input
                  label="Nomor Telepon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="cth: 08123456789"
                />

                <div className="pt-4 border-t border-neutral-100 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                    className="text-xs uppercase tracking-widest font-semibold py-3 px-6"
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="border border-neutral-200 p-6 sm:p-8 rounded-none bg-white">
              <h2 className="text-lg font-serif tracking-tight text-neutral-900 mb-6 flex items-center">
                <Key size={18} className="mr-2" /> Ganti Kata Sandi
              </h2>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <Input
                  label="Kata Sandi Baru*"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />

                <Input
                  label="Konfirmasi Kata Sandi Baru*"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  required
                />

                <div className="pt-4 border-t border-neutral-100 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSavingPassword}
                    className="text-xs uppercase tracking-widest font-semibold py-3 px-6"
                  >
                    Perbarui Kata Sandi
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
