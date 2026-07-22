'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { SmartLink as Link } from '@/shared/components'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Input, Card, AuthLoading } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import toast from 'react-hot-toast'
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect parameter
  let redirectPath = searchParams.get('redirect') || '/'
  if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
    redirectPath = '/'
  }

  // Detect OAuth error
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'oauth_failed') {
      toast.error('Login dengan Google gagal. Coba lagi atau gunakan email.')
      // Clear error parameter from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.pathname + url.search)
    }
  }, [searchParams])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email dan kata sandi wajib diisi.')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        toast.success('Berhasil masuk!')
        router.push(redirectPath)
      } else {
        setIsLoading(false)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Email atau kata sandi salah.'
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
        toast.success('Berhasil masuk dengan Google!')
        router.push(redirectPath)
        router.refresh()
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal memulai masuk dengan Google.'
      toast.error(message)
    }
  }

  const handleGoogleError = () => {
    toast.error('Otentikasi Google dibatalkan atau gagal.')
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
            {/* Brand identity */}
            <span className="text-[10px] font-heading font-medium uppercase tracking-[0.3em] text-neutral-400 mb-2">
              BENANGBAJU
            </span>
            <h2 className="text-xl md:text-2xl font-heading font-semibold uppercase tracking-wider text-brand-black">
              Masuk Akun
            </h2>
            <p className="text-[11px] md:text-xs text-neutral-400 font-sans">
              Silakan masukkan email dan kata sandi Anda untuk melanjutkan.
            </p>
          </motion.div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
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

            <motion.div variants={fadeUpItem} className="flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70">
                  Kata Sandi
                </label>
                <Link
                  href="/lupa-password"
                  className="text-[10px] uppercase tracking-wider font-heading font-medium text-neutral-400 hover:text-brand-black transition-colors"
                >
                  Lupa sandi?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full"
                autoComplete="current-password"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
                Masuk
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div variants={fadeUpItem} className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-heading">
              <span className="bg-white px-3 text-neutral-400">Atau masuk dengan</span>
            </div>
          </motion.div>

          {/* Google Sign In */}
          <motion.div variants={fadeUpItem} className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </motion.div>

          {/* Footer Link */}
          <motion.div
            variants={fadeUpItem}
            className="text-center mt-8 pt-4 border-t border-neutral-100"
          >
            <p className="text-xs text-neutral-500 font-sans">
              Belum punya akun?{' '}
              <Link href="/daftar" className="text-brand-black font-semibold hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  )
}

export default function LoginPage(): React.JSX.Element {
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim()

  return (
    <Suspense fallback={<AuthLoading message="Memuat halaman masuk..." />}>
      <GoogleOAuthProvider clientId={clientId}>
        <LoginContent />
      </GoogleOAuthProvider>
    </Suspense>
  )
}
