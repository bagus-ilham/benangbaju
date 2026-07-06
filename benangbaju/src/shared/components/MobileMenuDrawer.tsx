'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'

interface MobileMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  navLinks: { name: string; href: string }[]
  pathname: string
  isAuthenticated: boolean
  isMounted: boolean
}

export function MobileMenuDrawer({
  isOpen,
  onClose,
  navLinks,
  pathname,
  isAuthenticated,
  isMounted,
}: MobileMenuDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null)

  useFocusTrap(isOpen, drawerRef, {
    onClose,
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs" onClick={onClose} />
          <motion.div
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative flex w-full max-w-xs flex-col bg-white py-4 shadow-xl border-r border-neutral-100 outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi utama"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between px-6 pb-4 border-b border-neutral-100">
              <span className="font-heading text-sm font-bold tracking-[0.2em] text-brand-black uppercase">
                MENU
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-brand-black p-1"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-neutral-600 hover:text-brand-black',
                      pathname === link.href && 'text-brand-black font-semibold'
                    )}
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="h-3 w-3 text-neutral-400" />
                  </Link>
                ))}
                {isMounted && !isAuthenticated && (
                  <Link
                    href="/masuk"
                    onClick={onClose}
                    className="flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-brand-black border-t border-neutral-100 pt-4"
                  >
                    <span>Masuk</span>
                    <ChevronRight className="h-3 w-3 text-brand-black" />
                  </Link>
                )}
              </nav>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
