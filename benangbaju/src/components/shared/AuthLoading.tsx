import React from 'react'
import { cn } from '@/lib/utils'

interface AuthLoadingProps {
  message?: string
  className?: string
  fullScreen?: boolean
}

export function AuthLoading({
  message = 'Memuat halaman...',
  className,
  fullScreen = true,
}: AuthLoadingProps) : React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center font-heading',
        fullScreen ? 'min-h-[60vh] bg-white' : 'py-16',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-3">
        <div className="text-lg font-light tracking-[0.3em] uppercase text-brand-black select-none text-shimmer">
          BENANGBAJU
        </div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-sans animate-pulse">
          {message}
        </p>
        <div className="w-12 h-[1px] bg-neutral-100 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 bg-brand-black w-1/2 animate-[shimmer-sweep_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
