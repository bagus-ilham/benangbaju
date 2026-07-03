'use client'

import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  position?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  className,
}: DrawerProps) : React.ReactPortal | null {
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      if (document.activeElement instanceof HTMLElement) {
        previousFocusRef.current = document.activeElement
      } else {
        previousFocusRef.current = null
      }
      // Delay focus to allow animation to start
      setTimeout(() => dialogRef.current?.focus(), 10)
    } else {
      document.body.style.overflow = 'unset'
      previousFocusRef.current?.focus()
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const focusableList = Array.from(focusable).filter((el) => !el.hasAttribute('disabled'))

      if (focusableList.length === 0) return

      const first = focusableList[0]
      const last = focusableList[focusableList.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!mounted) return null

  // Animation variants
  const slideVariants: import('framer-motion').Variants = {
    hidden: { 
      x: position === 'right' ? '100%' : '-100%',
      opacity: 1
    },
    visible: { 
      x: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    },
    exit: { 
      x: position === 'right' ? '100%' : '-100%',
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "fixed top-0 bottom-0 z-10 flex flex-col bg-white border-neutral-200 shadow-2xl outline-none",
              {
                'right-0 border-l': position === 'right',
                'left-0 border-r': position === 'left',
                'w-full sm:w-80': size === 'sm',
                'w-full sm:w-96': size === 'md',
                'w-full sm:w-[32rem]': size === 'lg',
                'w-full sm:w-[40rem]': size === 'xl',
                'w-full': size === 'full',
              },
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              {title ? (
                <h3
                  id={titleId}
                  className="text-sm font-heading font-semibold uppercase tracking-wider text-brand-black"
                >
                  {title}
                </h3>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-brand-black transition-colors duration-200 p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-black"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 text-xs text-neutral-600 font-sans">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
