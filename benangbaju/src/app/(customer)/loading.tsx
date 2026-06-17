import React from 'react'

export default function CustomerLoading() {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center bg-white font-sans">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 animate-pulse">
          Memuat belanjaan Anda...
        </p>
      </div>
    </div>
  )
}
