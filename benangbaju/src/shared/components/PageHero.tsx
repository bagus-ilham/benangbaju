'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SmartImage as Image } from '@/shared/components/SmartImage'
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
    light: 'bg-brand-cream border-neutral-200/80',
    cream: 'bg-brand-cream border-neutral-200/80',
    dark: 'bg-brand-gold/60 border-brand-gold/80',
  }

  const textClasses = {
    light: {
      eyebrow: 'text-brand-plum font-bold',
      title: 'text-brand-plum font-bold',
      subtitle: 'text-neutral-600',
    },
    cream: {
      eyebrow: 'text-brand-plum font-bold',
      title: 'text-brand-plum font-bold',
      subtitle: 'text-neutral-600',
    },
    dark: { eyebrow: 'text-brand-plum font-bold', title: 'text-brand-plum font-bold', subtitle: 'text-neutral-700' },
  }

  const colors = textClasses[variant]

  return (
    <div className={cn('border-b', variantClasses[variant], className)}>
      <div className="relative overflow-hidden">
        {/* Decorative pastel orbs */}
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-blush/70 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-brand-gold/40 blur-2xl pointer-events-none"
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
              <div className="flex items-center gap-2">
                <div className="relative w-5 h-3 opacity-40 shrink-0 pointer-events-none select-none" aria-hidden="true">
                  <Image
                    src="/image/svg/decorative/accent-cross-stitch-alt.svg"
                    alt=""
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <span
                  className={cn(
                    'inline-block text-base md:text-lg font-accent font-bold leading-none',
                    colors.eyebrow
                  )}
                >
                  {eyebrow}
                </span>
              </div>
            )}
            <h1
              className={cn(
                'text-3xl md:text-[42px] font-serif font-medium leading-tight tracking-tight',
                colors.title
              )}
            >
              {title}
            </h1>
            <div className="stitch-divider" />
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
