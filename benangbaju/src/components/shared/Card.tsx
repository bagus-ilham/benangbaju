import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  bordered?: boolean
}

export function Card({
  className,
  children,
  hoverEffect = false,
  padding = 'md',
  bordered = true,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-none transition-all duration-300',
        {
          'border border-neutral-200': bordered,
          'hover:border-brand-black/30 hover:shadow-md hover:-translate-y-[2px]': hoverEffect && bordered,
          'hover:shadow-lg hover:-translate-y-[2px]': hoverEffect && !bordered,
          
          // Padding
          'p-0': padding === 'none',
          'p-4': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
