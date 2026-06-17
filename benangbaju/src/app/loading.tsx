import React from 'react'

export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-neutral-400 animate-pulse">
          Memuat halaman...
        </p>
      </div>
    </div>
  )
}
