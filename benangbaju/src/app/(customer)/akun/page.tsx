'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/entities/user/model/authStore'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Input, AuthLoading, PageContainer, PageHero } from '@/shared/components'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { User, MapPin, ClipboardList, Heart, LogOut, Key, Bell } from 'lucide-react'

const supabase = createBrowserClient()

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 }
  }
}

export default function AkunPage() : React.JSX.Element {
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

  // Initialize form using render-phase derived state (avoids cascading render)
  const [prevProfileId, setPrevProfileId] = useState<string | null>(null)
  if (profile && profile.id !== prevProfileId) {
    setPrevProfileId(profile.id)
    setName(profile.name || '')
    setPhone(profile.phone || '')
  }

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
        const role = data.role === 'admin' ? 'admin' : 'customer';
        setProfile({
          ...data,
          role,
        })
        toast.success('Profil berhasil diperbarui')
      }
    } catch (err: unknown) {
      console.error('Error updating profile:', err)
      const message = err instanceof Error ? err.message : 'Gagal memperbarui profil'
      toast.error(message)
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
    if (newPassword.length < 8) {
      toast.error('Kata sandi baru harus minimal 8 karakter')
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
    } catch (err: unknown) {
      console.error('Error updating password:', err)
      const message = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi'
      toast.error(message)
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
    return <AuthLoading message="Memuat halaman..." />
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Profil Pengguna"
        title="Akun Saya"
        subtitle="Kelola informasi pribadi Anda dan akses riwayat pesanan Anda."
      />
      <PageContainer size="lg" className="py-10 page-content">

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Navigation Menu */}
          <motion.div variants={itemVariants} className="space-y-2 md:col-span-1">
            <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400 mb-4">Navigasi Akun</h2>
            
            <Link href="/pesanan">
              <motion.div
                whileHover={{ x: 4, borderColor: '#9a7b4f' }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 px-4 py-3 border border-neutral-100 text-neutral-700 hover:text-brand-gold font-heading font-medium tracking-wide uppercase transition-colors duration-200 rounded-none text-xs bg-white cursor-pointer"
              >
                <ClipboardList size={14} className="text-neutral-400" />
                <span>Pesanan Saya</span>
              </motion.div>
            </Link>

            <Link href="/akun/alamat">
              <motion.div
                whileHover={{ x: 4, borderColor: '#9a7b4f' }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 px-4 py-3 border border-neutral-100 text-neutral-700 hover:text-brand-gold font-heading font-medium tracking-wide uppercase transition-colors duration-200 rounded-none text-xs bg-white cursor-pointer"
              >
                <MapPin size={14} className="text-neutral-400" />
                <span>Daftar Alamat</span>
              </motion.div>
            </Link>

            <Link href="/wishlist">
              <motion.div
                whileHover={{ x: 4, borderColor: '#9a7b4f' }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 px-4 py-3 border border-neutral-100 text-neutral-700 hover:text-brand-gold font-heading font-medium tracking-wide uppercase transition-colors duration-200 rounded-none text-xs bg-white cursor-pointer"
              >
                <Heart size={14} className="text-neutral-400" />
                <span>Wishlist Saya</span>
              </motion.div>
            </Link>

            <Link href="/akun/notifikasi">
              <motion.div
                whileHover={{ x: 4, borderColor: '#9a7b4f' }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 px-4 py-3 border border-neutral-100 text-neutral-700 hover:text-brand-gold font-heading font-medium tracking-wide uppercase transition-colors duration-200 rounded-none text-xs bg-white cursor-pointer"
              >
                <Bell size={14} className="text-neutral-400" />
                <span>Notifikasi Saya</span>
              </motion.div>
            </Link>

            <motion.button
              whileHover={{ x: 4, borderColor: '#ef4444', backgroundColor: 'rgba(254,226,226,0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 border border-red-100 text-red-500 hover:text-red-700 font-heading font-medium tracking-wide uppercase transition-all duration-200 rounded-none text-xs text-left bg-white"
            >
              <LogOut size={14} />
              <span>Keluar dari Akun</span>
            </motion.button>
          </motion.div>

          {/* Forms Section */}
          <div className="md:col-span-2 space-y-8">
            {/* Edit Profile Form */}
            <motion.div 
              variants={itemVariants} 
              className="border border-neutral-200 p-6 sm:p-8 rounded-none bg-white shadow-sm hover:shadow-md transition-shadow duration-300 card-hover-lift gold-border-hover relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
              <h2 className="text-sm uppercase tracking-widest font-heading font-bold text-brand-black mb-6 flex items-center">
                <motion.div whileHover={{ rotate: 15 }} className="mr-2">
                  <User size={16} className="text-neutral-500 group-hover:text-brand-black transition-colors" />
                </motion.div> 
                Informasi Profil
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
                  maxLength={100}
                  required
                />

                <Input
                  label="Nomor Telepon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={20}
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
            </motion.div>

            {/* Change Password Form */}
            <motion.div 
              variants={itemVariants} 
              className="border border-neutral-200 p-6 sm:p-8 rounded-none bg-white shadow-sm hover:shadow-md transition-shadow duration-300 card-hover-lift gold-border-hover relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
              <h2 className="text-sm uppercase tracking-widest font-heading font-bold text-brand-black mb-6 flex items-center">
                <motion.div whileHover={{ y: [0, -2, 2, -2, 0] }} className="mr-2">
                  <Key size={16} className="text-neutral-500 group-hover:text-brand-black transition-colors" />
                </motion.div> 
                Ganti Kata Sandi
              </h2>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <Input
                  label="Kata Sandi Baru*"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
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
            </motion.div>
          </div>
        </div>
        </motion.div>
      </PageContainer>
    </div>
  )
}

