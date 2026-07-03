'use client'

import React, { useEffect } from 'react'
import { SmartLink as Link } from '@/shared/components'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.JSX.Element {
  useEffect(() => {
    console.error('Admin panel error:', error.digest || 'unknown')
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-stone-50 font-sans">
      <div className="max-w-md bg-white border border-neutral-200 p-8 shadow-sm space-y-6">
        <h1 className="text-xl font-heading font-semibold text-red-600 uppercase tracking-wider">
          System Error (Admin)
        </h1>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Terjadi kesalahan internal saat memuat data di Admin Panel. Tim IT telah dinotifikasi.
        </p>
        {error.digest && (
          <p className="text-[10px] text-neutral-400 bg-neutral-50 p-2 border border-neutral-100 font-mono select-all">
            ID: {error.digest}
          </p>
        )}
        <div className="flex justify-center space-x-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2 bg-neutral-900 text-white hover:bg-neutral-800 text-[10px] font-heading font-medium uppercase tracking-wider transition"
          >
            Coba Lagi
          </button>
          <Link
            href="/admin"
            className="px-5 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-[10px] font-heading font-medium uppercase tracking-wider transition"
          >
            Dashboard Admin
          </Link>
        </div>
      </div>
    </div>
  )
}
