import React from 'react'

export default function AdminLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 font-sans">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-2 border-brand-gold-muted border-t-brand-gold rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 animate-pulse font-heading">
          Memuat data admin...
        </p>
      </div>
    </div>
  )
}
