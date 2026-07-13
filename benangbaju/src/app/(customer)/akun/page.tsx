'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { createBrowserClient } from '@/lib/supabase/client'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button, Input, AuthLoading, PageContainer, PageHero } from '@/shared/components'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { AccountNavMenu, EditProfileForm, ChangePasswordForm } from './components'

const supabase = createBrowserClient()

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 },
  },
}

export default function AkunPage(): React.JSX.Element {
  const router = useRouter()
  const {
    user,
    profile,
    setProfile,
    clearAuth,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuthStore()

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
        const role = data.role === 'admin' ? 'admin' : 'customer'
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Quick Navigation Menu */}
            <AccountNavMenu itemVariants={itemVariants} handleSignOut={handleSignOut} />

            {/* Forms Section */}
            <div className="md:col-span-2 space-y-8">
              {/* Edit Profile Form */}
              <EditProfileForm
                itemVariants={itemVariants}
                email={user?.email || ''}
                name={name}
                setName={setName}
                phone={phone}
                setPhone={setPhone}
                handleUpdateProfile={handleUpdateProfile}
                isSaving={isSaving}
              />

              {/* Change Password Form */}
              <ChangePasswordForm
                itemVariants={itemVariants}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmNewPassword={confirmNewPassword}
                setConfirmNewPassword={setConfirmNewPassword}
                handleUpdatePassword={handleUpdatePassword}
                isSavingPassword={isSavingPassword}
              />
            </div>
          </div>
        </motion.div>
      </PageContainer>
    </div>
  )
}
