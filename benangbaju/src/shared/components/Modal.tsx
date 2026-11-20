'use client'

import React, { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HandDrawnIcon } from '@/shared/components'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}: ModalProps): React.ReactPortal | null {
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(isOpen, dialogRef, {
    onClose,
  })

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md"
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: 'spring', damping: 25, stiffness: 350, mass: 0.8 },
            }}
            exit={{
              opacity: 0,
              y: 15,
              scale: 0.95,
              transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
            }}
            className={cn(
              'relative w-full bg-brand-cream border border-brand-plum/10 shadow-[0_20px_60px_-15px_rgba(45,38,64,0.2)] rounded-3xl flex flex-col max-h-[90vh] z-10 overflow-hidden outline-none',
              {
                'max-w-sm': size === 'sm',
                'max-w-md': size === 'md',
                'max-w-lg': size === 'lg',
                'max-w-[95vw] h-[95vh]': size === 'full',
              },
              className
            )}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-blue via-brand-blue-soft to-brand-gold"
              aria-hidden="true"
            />
            <div className="flex items-center justify-between px-6 py-4 pt-5 border-b border-brand-plum/10 bg-brand-gold-soft/40">
              {title ? (
                <h2
                  id={titleId}
                  className="text-lg font-serif font-medium tracking-tight text-brand-plum"
                >
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-brand-plum/55 hover:text-brand-plum transition-colors duration-200 p-1 cursor-pointer"
                aria-label="Tutup"
              >
                <HandDrawnIcon name="close" className="h-4 w-4" />
              </button>
            </div>

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
