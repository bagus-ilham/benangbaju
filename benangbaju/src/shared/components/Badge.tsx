import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'brand' | 'blue' | 'sale' | 'gold'
  size?: 'sm' | 'md'
  isPlayful?: boolean
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'sm',
  isPlayful = false,
  children,
  ...props
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center font-sans font-bold uppercase tracking-widest text-[9px] rounded-full border border-transparent select-none transition-all duration-300',
        isPlayful && 'font-accent normal-case text-xs tracking-normal font-bold',
        {
          // Variants — Guideline v9 Compliant
          'bg-neutral-200/60 text-brand-plum backdrop-blur-sm border-neutral-300/40':
            variant === 'neutral',
          'bg-green-100/80 text-green-800 border-green-200': variant === 'success',
          'bg-amber-100/80 text-amber-900 border-amber-200': variant === 'warning',
          'bg-red-100/80 text-red-800 border-red-200': variant === 'error',
          // Brand / Dusty Blue: MUST use Deep Plum text per §4
          'bg-brand-blue text-brand-plum shadow-sm shadow-brand-blue/30 border border-brand-blue/30':
            variant === 'brand' || variant === 'blue',
          'bg-red-600 text-white shadow-sm shadow-red-600/20': variant === 'sale',
          // Gold / Warm Sand: Deep Plum text
          'bg-brand-gold text-brand-plum border border-amber-300/50 shadow-sm':
            variant === 'gold',

          // Sizes
          'px-2 py-0.5': size === 'sm',
          'px-3 py-1': size === 'md',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
