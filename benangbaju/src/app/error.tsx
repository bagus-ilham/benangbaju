'use client'

import React, { useEffect } from 'react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white font-sans">
      <div className="max-w-md space-y-6">
        <h1 className="text-3xl font-serif tracking-tight text-neutral-900">
          Terjadi Kesalahan
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Mohon maaf, sistem mendeteksi kesalahan yang tidak terduga pada aplikasi kami.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-heading font-medium uppercase tracking-wider transition"
          >
            Coba Lagi
          </button>
          <a
            href="/"
            className="px-6 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-heading font-medium uppercase tracking-wider transition"
          >
            Kembali Ke Beranda
          </a>
        </div>
      </div>
    </div>
  )
}
