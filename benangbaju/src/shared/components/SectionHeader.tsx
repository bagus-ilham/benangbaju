'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SmartImage as Image } from '@/shared/components/SmartImage'
import { EASE_PREMIUM } from '@/lib/motion'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  align?: 'center' | 'left'
  className?: string
  showDivider?: boolean
  children?: React.ReactNode
}

export function SectionHeader({
  eyebrow,
  title,
  align = 'center',
  className,
  showDivider = true,
  children,
}: SectionHeaderProps): React.JSX.Element {
  const isCenter = align === 'center'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: EASE_PREMIUM }}
      className={cn(
        'flex flex-col mb-10 md:mb-12 space-y-2',
        isCenter ? 'items-center text-center' : 'items-start text-left',
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-sans font-bold text-brand-blue">
          <div className="relative w-4 h-2 opacity-30 shrink-0 pointer-events-none select-none" aria-hidden="true">
            <Image src="/image/svg/decorative/accent-cross-stitch-alt.svg" alt="" fill unoptimized className="object-contain" />
          </div>
          {eyebrow}
        </span>
      )}
      <h2 className="text-xl md:text-[24px] font-sans font-semibold text-brand-plum">
        {title}
      </h2>
      {showDivider && (
        <div className={cn('stitch-divider pt-1', isCenter && 'stitch-divider-center')} />
      )}
      {children}
    </motion.div>
  )
}
