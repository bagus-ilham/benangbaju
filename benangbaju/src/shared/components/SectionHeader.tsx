'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
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
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-heading font-medium text-brand-gold">
          <span className="hidden sm:block w-6 h-px bg-brand-gold/50" aria-hidden />
          {eyebrow}
          <span className="hidden sm:block w-6 h-px bg-brand-gold/50" aria-hidden />
        </span>
      )}
      <h2 className="text-xl md:text-3xl font-heading font-light uppercase tracking-wider text-brand-black">
        {title}
      </h2>
      {showDivider && <div className={cn('accent-line pt-1', isCenter && 'accent-line-center')} />}
      {children}
    </motion.div>
  )
}
