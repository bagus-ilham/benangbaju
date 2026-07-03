import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminStatCardProps {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  className?: string
  accent?: 'default' | 'gold' | 'success' | 'warning'
}

const accentStyles = {
  default: 'text-brand-black bg-neutral-100',
  gold: 'text-brand-gold bg-brand-gold-muted',
  success: 'text-success bg-success-bg',
  warning: 'text-warning bg-warning-bg',
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
  accent = 'default',
}: AdminStatCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'border border-neutral-200 bg-white p-5 space-y-3 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] uppercase font-heading font-semibold tracking-widest text-neutral-400">
          {label}
        </span>
        <div className={cn('p-2', accentStyles[accent])}>
          <Icon size={15} strokeWidth={1.5} />
        </div>
      </div>
      <p className="text-2xl font-heading font-semibold text-brand-black tracking-tight">{value}</p>
      {hint && <p className="text-[10px] text-neutral-400 font-sans">{hint}</p>}
    </div>
  )
}
