import React from 'react'

export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-heading">
      <div className="flex flex-col items-center space-y-4">
        {/* Branded Text Shimmer */}
        <div className="text-xl md:text-2xl font-light tracking-[0.3em] uppercase text-brand-black select-none text-shimmer">
          BENANGBAJU
        </div>
        <div className="w-16 h-[1px] bg-neutral-100 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 bg-brand-black w-1/2 animate-[shimmer-sweep_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
