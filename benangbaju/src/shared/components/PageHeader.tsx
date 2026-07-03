'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
  animated?: boolean
  children?: React.ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  className,
  animated = true,
  children,
}: PageHeaderProps): React.JSX.Element {
  const content = (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 mb-8',
        className
      )}
    >
      <div className="flex flex-col space-y-2">
        {eyebrow && (
          <span className="text-[10px] uppercase tracking-[0.25em] font-heading font-medium text-brand-gold">
            {eyebrow}
          </span>
        )}
        <h2 className="text-lg md:text-2xl font-heading font-light uppercase tracking-wider text-brand-black">
          {title}
        </h2>
        <div className="accent-line pt-1" />
        {subtitle && (
          <p className="text-xs text-neutral-500 font-sans max-w-xl leading-relaxed pt-1">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  )

  if (!animated) return content

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_PREMIUM }}
    >
      {content}
    </motion.div>
  )
}
