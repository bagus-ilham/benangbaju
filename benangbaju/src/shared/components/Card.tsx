import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  bordered?: boolean
  variant?: 'solid' | 'glass'
}

export function Card({
  className,
  children,
  hoverEffect = false,
  padding = 'md',
  bordered = true,
  variant = 'solid',
  ...props
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        // Base styles dengan custom bezier curve untuk animasi super halus
        'rounded-none transition-all duration-500 ease-[0.16,1,0.3,1]',

        // Varian Warna
        variant === 'solid' && 'bg-white',
        variant === 'glass' && 'bg-white/80 backdrop-blur-md',

        // Border state (tidak akan menghitam saat di-hover)
        bordered
          ? variant === 'glass'
            ? 'border border-white/40'
            : 'border border-neutral-200'
          : '',

        // Hover Effect Premium
        hoverEffect && [
          'hover:-translate-y-1',
          // Custom soft diffuse shadow (Bukan garis hitam, tapi bayangan lembut di bawah)
          'hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]',
        ],

        // Padding Options
        {
          'p-0': padding === 'none',
          'p-4 sm:p-6': padding === 'sm',
          'p-6 sm:p-8': padding === 'md',
          'p-8 sm:p-12': padding === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
