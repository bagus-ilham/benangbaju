'use client'

import React from 'react'
import { SmartLink as Link, HandDrawnIcon, type HandDrawnIconName } from '@/shared/components'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { EASE_PREMIUM } from '@/lib/motion'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
}

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  handDrawnIcon?: HandDrawnIconName
  useBrandIcon?: boolean
  title: string
  description?: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

export function EmptyState({
  icon: CustomIcon,
  handDrawnIcon,
  useBrandIcon = true,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps): React.JSX.Element {
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
        'relative flex flex-col items-center justify-center py-20 text-center space-y-6 overflow-hidden rounded-3xl border border-dashed border-brand-plum/15 bg-brand-gold/35 p-8',
        className
      )}
    >
      <div className="relative">
        <div
          className="absolute inset-0 bg-brand-blue-soft/70 blur-xl rounded-full scale-150"
          aria-hidden
        />
        <div className="relative p-4 bg-brand-cream border border-brand-plum/10 animate-gentle-float rounded-2xl shadow-xs">
          {handDrawnIcon ? (
            <HandDrawnIcon name={handDrawnIcon} className="h-8 w-8" />
          ) : CustomIcon ? (
            <CustomIcon className="h-8 w-8 text-brand-plum" strokeWidth={1.5} />
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
            <HandDrawnIcon name="package" className="h-8 w-8 text-brand-plum" />
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-lg md:text-xl font-serif font-medium tracking-tight text-brand-plum">
          {title}
        </h2>
        <div className="stitch-divider stitch-divider-center" />
        {description && (
          <p className="text-xs md:text-sm text-neutral-600 font-sans max-w-sm leading-relaxed pt-2">
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
