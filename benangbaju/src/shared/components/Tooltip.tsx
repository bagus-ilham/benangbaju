'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const animationVariants: import('framer-motion').Variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0,
      x: position === 'left' ? 5 : position === 'right' ? -5 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.15, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.1, ease: 'easeIn' },
    },
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            role="tooltip"
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'absolute z-50 px-2.5 py-1.5 text-[10px] font-sans font-medium text-white bg-brand-black shadow-md whitespace-nowrap pointer-events-none',
              positionClasses[position],
              className
            )}
          >
            {content}
            {/* Simple arrow using a rotated square */}
            <div
              className={cn('absolute w-2 h-2 bg-brand-black rotate-45 -z-10', {
                '-bottom-1 left-1/2 -translate-x-1/2': position === 'top',
                '-top-1 left-1/2 -translate-x-1/2': position === 'bottom',
                '-right-1 top-1/2 -translate-y-1/2': position === 'left',
                '-left-1 top-1/2 -translate-y-1/2': position === 'right',
              })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
