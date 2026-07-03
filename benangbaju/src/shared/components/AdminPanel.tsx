import React from 'react'
import { cn } from '@/lib/utils'

interface AdminPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  noPadding?: boolean
}

export function AdminPanel({
  title,
  icon,
  action,
  noPadding = false,
  className,
  children,
  ...props
}: AdminPanelProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'border border-neutral-200 bg-white transition-shadow duration-300 hover:shadow-sm',
        className
      )}
      {...props}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h3 className="text-[10px] uppercase font-heading font-bold tracking-widest text-brand-black flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={cn(!noPadding && 'p-5')}>{children}</div>
    </div>
  )
}
