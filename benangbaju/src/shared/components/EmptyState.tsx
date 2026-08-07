'use client'

import React from 'react'
import { SmartLink as Link, HandDrawnIcon, type HandDrawnIconName } from '@/shared/components'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { LucideIcon, Percent, PackageSearch, Heart, ClipboardList, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { EASE_PREMIUM } from '@/lib/motion'

const iconMap = {
  Percent,
  PackageSearch,
  Heart,
  ClipboardList,
  ShoppingBag,
} as const

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
}

interface EmptyStateProps {
  icon?: keyof typeof iconMap | LucideIcon
  handDrawnIcon?: HandDrawnIconName
  useBrandIcon?: boolean
  title: string
  description?: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

export function EmptyState({
  icon,
  handDrawnIcon,
  useBrandIcon = true,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps): React.JSX.Element {
  const Icon = icon ? (typeof icon === 'string' ? iconMap[icon] || PackageSearch : icon) : PackageSearch

  const renderAction = (act: EmptyStateAction, key: string) => {
    const button = (
      <Button variant={act.variant ?? 'primary'} size="md" onClick={act.onClick}>
        {act.label}
      </Button>
    )

    if (act.href) {
      return (
        <Link key={key} href={act.href}>
          {button}
        </Link>
      )
    }

    return <div key={key}>{button}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_PREMIUM }}
      className={cn(
        'relative flex flex-col items-center justify-center py-20 text-center space-y-6 overflow-hidden rounded-3xl border border-dashed border-amber-200/60 bg-brand-cream/40 p-8',
        className
      )}
    >
      {/* Decorative Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none select-none bg-center bg-repeat"
        style={{ backgroundImage: 'url(/image/svg/decorative/pattern-stitch-card.svg)', backgroundSize: '300px' }}
        aria-hidden="true"
      />
      <div className="relative">
        <div
          className="absolute inset-0 bg-brand-gold/30 blur-xl rounded-full scale-150"
          aria-hidden
        />
        <div className="relative p-4 bg-brand-cream border border-neutral-200/80 animate-gentle-float rounded-2xl shadow-xs">
          {handDrawnIcon ? (
            <HandDrawnIcon name={handDrawnIcon} className="h-8 w-8" />
          ) : useBrandIcon ? (
            <div className="relative w-10 h-10">
              <Image
                src="/image/svg/logo/logo-jarum-benang.svg"
                alt="Gulungan Benang"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <Icon className="h-8 w-8 text-brand-plum" strokeWidth={1.5} />
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm md:text-base font-heading font-semibold uppercase tracking-wider text-brand-black">
          {title}
        </h3>
        <div className="stitch-divider stitch-divider-center" />
        {description && (
          <p className="text-xs text-neutral-400 font-sans max-w-sm leading-relaxed pt-2">
            {description}
          </p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {action && renderAction(action, 'primary')}
          {secondaryAction && renderAction(secondaryAction, 'secondary')}
        </div>
      )}
    </motion.div>
  )
}
