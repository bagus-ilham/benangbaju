'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/shared/components/Button'
import { SmartLink as Link, HandDrawnIcon } from '@/shared/components'

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.JSX.Element {
  useEffect(() => {
    console.error('Customer section error:', error.digest || 'unknown')
  }, [error])

  return (
    <div className="relative flex-1 min-h-[60vh] flex flex-col items-center justify-center px-6 pt-12 pb-24 text-center bg-brand-cream font-sans overflow-hidden">
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-blush/60 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-brand-gold/30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md space-y-6 flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="p-4 bg-brand-blush/65 border border-brand-blush-stroke/65 rounded-2xl text-brand-plum shadow-xs"
        >
          <HandDrawnIcon name="alert-triangle" className="h-8 w-8" />
        </motion.div>

        <div className="space-y-2.5">
          <span className="inline-block text-base font-accent font-bold text-brand-blue leading-none">
            Oops, sebentar ya
          </span>
          <h1 className="text-2xl md:text-3xl font-serif font-medium tracking-tight text-brand-plum">
            Terjadi Gangguan pada Halaman
          </h1>
          <p className="text-xs md:text-sm text-neutral-600 leading-relaxed max-w-xs mx-auto">
            Gagal memuat halaman belanja. Silakan coba memuat ulang halaman atau kembali ke katalog
            produk.
          </p>
        </div>

        <div className="stitch-divider stitch-divider-center w-full" />

        <div className="flex justify-center space-x-3 w-full max-w-xs pt-1">
          <Button onClick={() => reset()} variant="accent" className="flex-1 text-[10px] py-3">
            Coba Lagi
          </Button>
          <Link href="/produk" className="flex-1">
            <Button variant="outline" className="w-full text-[10px] py-3">
              Katalog
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
