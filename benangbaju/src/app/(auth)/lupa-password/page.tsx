'use client'

import React, { useState } from 'react'
import { SmartLink as Link } from '@/shared/components'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Input, Card } from '@/shared/components'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage(): React.JSX.Element {
  const supabase = createBrowserClient()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Email wajib diisi.')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password`,
      })

      if (error) throw error

      toast.success('Tautan reset kata sandi telah dikirim ke email Anda.')
      setIsSent(true)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal mengirim email reset. Silakan coba lagi.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card bordered={true} className="w-full max-w-md shadow-lg p-8 md:p-10 border-neutral-200">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <span className="text-[10px] font-heading font-medium uppercase tracking-[0.3em] text-neutral-400 mb-2">
              BENANGBAJU
            </span>
            <h2 className="text-xl md:text-2xl font-heading font-semibold uppercase tracking-wider text-brand-black">
              Lupa Kata Sandi
            </h2>
            <p className="text-[11px] md:text-xs text-neutral-400 font-sans">
              Masukkan alamat email Anda untuk menerima tautan reset kata sandi.
            </p>
          </div>

          {isSent ? (
            <div className="space-y-6 text-center">
              <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-none text-xs leading-relaxed text-neutral-600">
                Kami telah mengirimkan tautan untuk mengatur ulang kata sandi ke email{' '}
                <strong className="text-brand-black">{email}</strong>. Silakan periksa kotak masuk
                atau spam email Anda.
              </div>
              <Link href="/masuk" className="w-full block">
                <Button variant="primary" className="w-full">
                  Kembali ke Halaman Masuk
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Kirim Tautan Reset
              </Button>
            </form>
          )}

          {/* Footer Link */}
          {!isSent && (
            <div className="text-center mt-8 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 font-sans">
                Kembali ke{' '}
                <Link href="/masuk" className="text-brand-black font-semibold hover:underline">
                  Halaman Masuk
                </Link>
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
