'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Customer section error:', error)
  }, [error])

  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-white font-sans">
      <div className="max-w-md space-y-6">
        <h1 className="text-2xl font-serif text-neutral-900">
          Terjadi Gangguan pada Halaman
        </h1>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Gagal memuat halaman belanja. Silakan coba memuat ulang halaman atau kembali ke katalog produk.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => reset()}
            className="px-5 py-2 bg-neutral-900 text-white hover:bg-neutral-800 text-[10px] font-heading font-medium uppercase tracking-wider transition"
          >
            Coba Lagi
          </button>
          <Link
            href="/produk"
            className="px-5 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-[10px] font-heading font-medium uppercase tracking-wider transition"
          >
            Katalog Produk
          </Link>
        </div>
      </div>
    </div>
  )
}
