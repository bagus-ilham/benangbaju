'use client'

import React, { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
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
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: 'spring', damping: 22, stiffness: 300, mass: 0.8 },
            }}
            exit={{
              opacity: 0,
              y: 12,
              scale: 0.97,
              transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
            }}
            className={cn(
              'relative w-full bg-white border border-neutral-200 shadow-xl rounded-none flex flex-col max-h-[90vh] z-10 overflow-hidden outline-none',
              {
                'max-w-sm': size === 'sm',
                'max-w-md': size === 'md',
                'max-w-lg': size === 'lg',
                'max-w-[95vw] h-[95vh]': size === 'full',
              },
              className
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
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
                className="text-neutral-400 hover:text-brand-black transition-colors duration-200 p-1"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
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
