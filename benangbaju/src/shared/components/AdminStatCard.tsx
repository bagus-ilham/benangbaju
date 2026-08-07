import React from 'react'
import { HandDrawnIcon, type HandDrawnIconName } from '@/shared/components/HandDrawnIcon'
import { cn } from '@/lib/utils'

interface AdminStatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: React.ComponentType<{ className?: string; size?: number }>
  handDrawnIcon?: HandDrawnIconName
  className?: string
  accent?: 'default' | 'gold' | 'success' | 'warning'
}

const accentStyles = {
  default: 'text-brand-black bg-neutral-100',
  gold: 'text-brand-plum bg-brand-gold/40 rounded-xl',
  success: 'text-success bg-success-bg',
  warning: 'text-warning bg-warning-bg',
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  handDrawnIcon,
  className,
  accent = 'default',
}: AdminStatCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'border border-neutral-200 bg-brand-cream p-5 space-y-3 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 card-hover-lift gold-border-hover rounded-2xl',
        className
      )}
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] uppercase font-heading font-semibold tracking-widest text-neutral-400">
          {label}
        </span>
        <div className={cn('p-2 flex items-center justify-center', accentStyles[accent])}>
          {handDrawnIcon ? (
            <HandDrawnIcon name={handDrawnIcon} className="w-4 h-4" />
          ) : Icon ? (
            <Icon className="w-4 h-4" size={15} />
          ) : null}
        </div>
      </div>
      <p className="text-2xl font-heading font-semibold text-brand-black tracking-tight">{value}</p>
      {hint && <p className="text-[10px] text-neutral-400 font-sans">{hint}</p>}
    </div>
  )
}
