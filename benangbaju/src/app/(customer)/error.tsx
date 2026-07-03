'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { SmartLink as Link } from '@/shared/components'

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
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-white font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md space-y-6 flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="p-4 bg-red-50 border border-red-100 rounded-none text-red-600 mb-2"
        >
          <AlertTriangle className="h-8 w-8" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-heading font-light uppercase tracking-wider text-brand-black">
            Terjadi Gangguan pada Halaman
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
            Gagal memuat halaman belanja. Silakan coba memuat ulang halaman atau kembali ke katalog
            produk.
          </p>
        </div>

        <div className="flex justify-center space-x-3 w-full max-w-xs pt-2">
          <Button onClick={() => reset()} variant="primary" className="flex-1 text-[10px] py-3">
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
