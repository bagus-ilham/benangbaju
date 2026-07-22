'use client'

import React, { useState } from 'react'
import { SmartLink as Link } from '@/shared/components'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Input, Card } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import toast from 'react-hot-toast'
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google'

export default function RegisterPage(): React.JSX.Element {
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim()

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <RegisterContent />
    </GoogleOAuthProvider>
  )
}

function RegisterContent(): React.JSX.Element {
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

    if (password.length < 8) {
      toast.error('Kata sandi harus minimal 8 karakter.')
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

      if (data.session) {
        toast.success('Registrasi berhasil! Selamat datang di Benangbaju.')
        router.push('/')
        router.refresh()
      } else if (data.user) {
        // Try auto-login in case email confirmation is disabled or auto-confirmed
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (!loginError && loginData.session) {
          toast.success('Registrasi berhasil! Selamat datang di Benangbaju.')
          router.push('/')
          router.refresh()
        } else {
          toast.success('Registrasi berhasil!')
          router.push('/masuk')
        }
      } else {
        setIsLoading(false)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal mendaftar. Silakan coba lagi.'
      toast.error(message)
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('Token otentikasi Google tidak ditemukan.')
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      })

      if (error) throw error

      if (data.user) {
        toast.success('Berhasil daftar dengan Google!')
        router.push('/')
        router.refresh()
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal memulai daftar dengan Google.'
      toast.error(message)
    }
  }

  const handleGoogleError = () => {
    toast.error('Daftar dengan Google dibatalkan atau gagal.')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card bordered={true} className="w-full max-w-md shadow-lg p-8 md:p-10 border-neutral-200">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeUpItem} className="flex flex-col space-y-2 text-center mb-8">
            <span className="text-[10px] font-heading font-medium uppercase tracking-[0.3em] text-neutral-400 mb-2">
              BENANGBAJU
            </span>
            <h2 className="text-xl md:text-2xl font-heading font-semibold uppercase tracking-wider text-brand-black">
              Daftar Akun
            </h2>
            <p className="text-[11px] md:text-xs text-neutral-400 font-sans">
              Lengkapi data di bawah ini untuk bergabung dengan Benangbaju.
            </p>
          </motion.div>

          <form onSubmit={handleRegister} className="space-y-4">
            <motion.div variants={fadeUpItem}>
              <Input
                label="Nama Lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                required
                autoComplete="name"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                autoComplete="email"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Input
                label="Nomor Telepon (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                autoComplete="tel"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Input
                label="Kata Sandi"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                autoComplete="new-password"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Input
                label="Konfirmasi Kata Sandi"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi"
                required
                autoComplete="new-password"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Button type="submit" variant="primary" className="w-full mt-4" isLoading={isLoading}>
                Daftar
              </Button>
            </motion.div>
          </form>

          <motion.div variants={fadeUpItem} className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-heading">
              <span className="bg-white px-3 text-neutral-400">Atau daftar dengan</span>
            </div>
          </motion.div>

          <motion.div variants={fadeUpItem} className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
            />
          </motion.div>

          {/* Footer Link */}
          <motion.div
            variants={fadeUpItem}
            className="text-center mt-8 pt-4 border-t border-neutral-100"
          >
            <p className="text-xs text-neutral-500 font-sans">
              Sudah memiliki akun?{' '}
              <Link href="/masuk" className="text-brand-black font-semibold hover:underline">
                Masuk disini
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  )
}
