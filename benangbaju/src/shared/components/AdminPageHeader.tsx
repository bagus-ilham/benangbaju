import React from 'react'
import { cn } from '@/lib/utils'

interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  className?: string
  children?: React.ReactNode
}

export function AdminPageHeader({
  title,
  subtitle,
  className,
  children,
}: AdminPageHeaderProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-6 border-b border-neutral-200',
        className
      )}
    >
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-[0.2em] font-heading font-medium text-brand-gold">
          Admin Panel
        </span>
        <h2 className="text-xl md:text-2xl font-heading font-light uppercase tracking-wider text-brand-black">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-neutral-500 font-sans">{subtitle}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  )
}
