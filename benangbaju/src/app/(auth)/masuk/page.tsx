'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { SmartLink as Link } from '@/shared/components'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Input, Card, AuthLoading } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import toast from 'react-hot-toast'

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
        router.refresh()
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Email atau kata sandi salah.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal memulai masuk dengan Google.'
      toast.error(message)
    }
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
          <motion.div variants={fadeUpItem}>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-2 border-neutral-300"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path
                    d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.85 21.56,11.4 21.35,11.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12,20.5c2.3,0 4.23,-0.76 5.64,-2.08l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.34,0.98 -2.57,0 -4.75,-1.74 -5.53,-4.07H2.07v2.66C3.54,17.34 7.48,20.5 12,20.5z"
                    fill="#34A853"
                  />
                  <path
                    d="M6.47,12.75c-0.2,-0.61 -0.31,-1.26 -0.31,-1.93s0.11,-1.32 0.31,-1.93V6.26H2.07C1.31,7.77 0.88,9.47 0.88,11.27s0.43,3.5 1.19,5.01L6.47,12.75z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12,4.68c1.25,0 2.37,0.43 3.25,1.27l2.44,-2.44C16.22,2.12 14.29,1.27 12,1.27 7.48,1.27 3.54,4.43 2.07,7.35l4.4,3.47C7.25,6.42 9.43,4.68 12,4.68z"
                    fill="#EA4335"
                  />
                </g>
              </svg>
              <span>Google</span>
            </Button>
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
  return (
    <Suspense fallback={<AuthLoading message="Memuat halaman masuk..." />}>
      <LoginContent />
    </Suspense>
  )
}
