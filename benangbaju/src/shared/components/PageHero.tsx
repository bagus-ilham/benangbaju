'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'

interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  variant?: 'light' | 'cream' | 'dark'
  className?: string
  children?: React.ReactNode
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  variant = 'cream',
  className,
  children,
}: PageHeroProps): React.JSX.Element {
  const variantClasses = {
    light: 'bg-white border-neutral-100',
    cream: 'bg-brand-cream section-texture border-neutral-200',
    dark: 'bg-brand-black border-neutral-800',
  }

  const textClasses = {
    light: { eyebrow: 'text-brand-gold', title: 'text-brand-black', subtitle: 'text-neutral-500' },
    cream: { eyebrow: 'text-brand-gold', title: 'text-brand-black', subtitle: 'text-neutral-500' },
    dark: { eyebrow: 'text-brand-gold-light', title: 'text-white', subtitle: 'text-neutral-400' },
  }

  const colors = textClasses[variant]

  return (
    <div className={cn('border-b', variantClasses[variant], className)}>
      <div className="relative overflow-hidden">
        {/* Decorative orbs */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand-gold/5 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-brand-gold/8 blur-2xl pointer-events-none"
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_PREMIUM }}
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16"
        >
          <div className="max-w-2xl space-y-3">
            {eyebrow && (
              <span
                className={cn(
                  'inline-block text-[10px] uppercase tracking-[0.25em] font-heading font-medium',
                  colors.eyebrow
                )}
              >
                {eyebrow}
              </span>
            )}
            <h1
              className={cn(
                'text-2xl md:text-4xl font-heading font-light uppercase tracking-wider leading-tight',
                colors.title
              )}
            >
              {title}
            </h1>
            <div className="accent-line" />
            {subtitle && (
              <p
                className={cn('text-xs md:text-sm font-sans leading-relaxed pt-1', colors.subtitle)}
              >
                {subtitle}
              </p>
            )}
          </div>
          {children && <div className="mt-8">{children}</div>}
        </motion.div>
      </div>
    </div>
  )
}
