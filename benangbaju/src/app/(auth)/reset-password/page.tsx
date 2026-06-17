'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Input, Card } from '@/components/shared'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Ensure user has a valid session (arrived from recovery flow)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Sesi tidak valid atau telah kadaluarsa. Silakan minta tautan baru.')
        router.push('/lupa-password')
      }
    }
    checkSession()
  }, [supabase, router])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Semua kolom wajib diisi.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.')
      return
    }

    if (password.length < 6) {
      toast.error('Kata sandi harus minimal 6 karakter.')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast.success('Kata sandi Anda berhasil diperbarui! Silakan masuk kembali.')
      
      // Log out to clear recovery session and force login
      await supabase.auth.signOut()
      
      router.push('/masuk')
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui kata sandi. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream py-12 px-4 sm:px-6 lg:px-8">
      <Card bordered={true} className="w-full max-w-md shadow-lg p-8 md:p-10 border-neutral-200">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h2 className="text-xl md:text-2xl font-heading font-semibold uppercase tracking-wider text-brand-black">
            Reset Kata Sandi
          </h2>
          <p className="text-[11px] md:text-xs text-neutral-400 font-sans">
            Masukkan kata sandi baru Anda di bawah ini.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <Input
            label="Kata Sandi Baru"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required
          />

          <Input
            label="Konfirmasi Kata Sandi Baru"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi kata sandi baru"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-4"
            isLoading={isLoading}
          >
            Perbarui Kata Sandi
          </Button>
        </form>
      </Card>
    </div>
  )
}
