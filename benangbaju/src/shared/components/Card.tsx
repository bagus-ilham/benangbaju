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
        'rounded-2xl transition-all duration-500 ease-[0.16,1,0.3,1]',

        // Varian Warna
        variant === 'solid' && 'bg-brand-cream',
        variant === 'glass' && 'bg-brand-cream/80 backdrop-blur-xl',

        // Border state
        bordered
          ? variant === 'glass'
            ? 'border border-neutral-200/60 shadow-xs'
            : 'border border-neutral-200/80 shadow-[0_4px_20px_-4px_rgba(45,38,64,0.03)]'
          : '',

        // Hover Effect Premium
        hoverEffect && [
          'hover:-translate-y-1.5',
          // Custom soft diffuse shadow
          'hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]',
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
