import React from 'react'
import Image from 'next/image'
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
}: AuthLoadingProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center font-heading p-4',
        fullScreen ? 'min-h-[60vh] bg-brand-cream' : 'py-16',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-3">
        {/* Rotating Needle & Thread Icon */}
        <div className="relative w-10 h-10 md:w-12 md:h-12">
          <Image
            src="/svg/logo-jarum-benang.svg"
            alt="Loading..."
            fill
            className="object-contain animate-[spin_4s_linear_infinite]"
          />
        </div>
        {/* Brand Logotype SVG */}
        <div className="relative h-6 md:h-8 w-40 md:w-48 select-none">
          <Image
            src="/svg/logo-benangbaju.svg"
            alt="Benangbaju"
            fill
            className="object-contain"
          />
        </div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-sans animate-pulse pt-1">
          {message}
        </p>
        <div className="w-12 h-[1px] bg-neutral-200 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 bg-brand-plum w-1/2 animate-[shimmer-sweep_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
