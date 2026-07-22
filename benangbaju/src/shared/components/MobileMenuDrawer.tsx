'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, LogOut } from 'lucide-react'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { MobileMenuAccordionItem } from './MobileMenuAccordionItem'
import type { User } from '@supabase/supabase-js'

interface MobileMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  navLinks: { name: string; href: string }[]
  pathname: string
  isAuthenticated: boolean
  isMounted: boolean
  profile?: Record<string, any> | null
  user?: User | null
  onLogout?: () => void
}

export function MobileMenuDrawer({
  isOpen,
  onClose,
  navLinks,
  pathname,
  isAuthenticated,
  isMounted,
  profile,
  user,
  onLogout,
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
                  <MobileMenuAccordionItem
                    key={link.name}
                    label={link.name}
                    href={link.href}
                    pathname={pathname}
                    onClose={onClose}
                  />
                ))}

                {isMounted && (
                  <div className="border-t border-neutral-100 pt-6 mt-6 space-y-4">
                    {isAuthenticated ? (
                      <>
                        <div className="px-2 mb-4 bg-neutral-50 p-3">
                          <p className="text-[10px] text-neutral-400 font-heading uppercase tracking-wider mb-1">
                            Halo,
                          </p>
                          <p className="text-sm font-bold text-brand-black truncate">
                            {profile?.name || user?.email}
                          </p>
                        </div>
                        <Link
                          href="/akun"
                          onClick={onClose}
                          className="flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-neutral-600 hover:text-brand-black"
                        >
                          <span>Akun Saya</span>
                          <ChevronRight className="h-3 w-3 text-neutral-400" />
                        </Link>
                        {profile?.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={onClose}
                            className="flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-neutral-600 hover:text-brand-black"
                          >
                            <span>Admin Panel</span>
                            <ChevronRight className="h-3 w-3 text-neutral-400" />
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            onClose()
                            if (onLogout) onLogout()
                          }}
                          className="flex items-center justify-between py-2 w-full text-left text-xs font-heading font-medium uppercase tracking-widest text-red-600 hover:text-red-700"
                        >
                          <span>Keluar</span>
                          <LogOut className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/masuk"
                        onClick={onClose}
                        className="flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-brand-black"
                      >
                        <span>Masuk</span>
                        <ChevronRight className="h-3 w-3 text-brand-black" />
                      </Link>
                    )}
                  </div>
                )}
              </nav>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
