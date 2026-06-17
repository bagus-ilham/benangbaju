'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Input, Card } from '@/components/shared'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password || !confirmPassword) {
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
      // Sign up with Supabase Auth
      // Profiles are automatically created via the postgres trigger handle_new_user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            phone: phone || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user) {
        // Since email confirmation is required by default, tell the user to verify email.
        toast.success('Registrasi berhasil! Silakan cek email Anda untuk konfirmasi akun.')
        router.push('/masuk')
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal mendaftar. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream py-12 px-4 sm:px-6 lg:px-8">
      <Card bordered={true} className="w-full max-w-md shadow-lg p-8 md:p-10 border-neutral-200">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h2 className="text-xl md:text-2xl font-heading font-semibold uppercase tracking-wider text-brand-black">
            Daftar Akun
          </h2>
          <p className="text-[11px] md:text-xs text-neutral-400 font-sans">
            Lengkapi data di bawah ini untuk bergabung dengan Benangbaju.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap Anda"
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
          />

          <Input
            label="Nomor Telepon (Optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0812xxxxxxxx"
          />

          <Input
            label="Kata Sandi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required
          />

          <Input
            label="Konfirmasi Kata Sandi"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi kata sandi"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-4"
            isLoading={isLoading}
          >
            Daftar
          </Button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-8 pt-4 border-t border-neutral-100">
          <p className="text-xs text-neutral-500 font-sans">
            Sudah memiliki akun?{' '}
            <Link
              href="/masuk"
              className="text-brand-black font-semibold hover:underline"
            >
              Masuk disini
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
