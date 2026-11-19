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
        <span className="inline-flex items-center gap-2 text-base md:text-lg font-accent font-bold text-brand-blue leading-none">
          <div className="relative w-4 h-2 opacity-35 shrink-0 pointer-events-none select-none" aria-hidden="true">
            <Image src="/image/svg/decorative/accent-cross-stitch-alt.svg" alt="" fill unoptimized className="object-contain" />
          </div>
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl md:text-[30px] font-serif font-medium text-brand-plum tracking-tight leading-snug">
        {title}
      </h2>
      {showDivider && (
        <div className={cn('stitch-divider pt-1', isCenter && 'stitch-divider-center')} />
      )}
      {children}
    </motion.div>
  )
}
