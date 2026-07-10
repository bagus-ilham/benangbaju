'use client'

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DropdownMenuContextValue {
  isOpen: boolean
  setIsOpen: (val: boolean) => void
  closeMenu: () => void
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | undefined>(undefined)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, closeMenu: () => setIsOpen(false) }}>
      <div className="relative inline-block text-left" ref={menuRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const ctx = useContext(DropdownMenuContext)
  if (!ctx) throw new Error('DropdownMenuTrigger must be used within DropdownMenu')

  if (asChild) {
    // Basic implementation of asChild pattern
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const child = React.Children.only(children) as React.ReactElement<any>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        if (child.props && typeof child.props.onClick === 'function') {
          child.props.onClick(e)
        }
        ctx.setIsOpen(!ctx.isOpen)
      },
      'aria-expanded': ctx.isOpen,
      'aria-haspopup': 'menu',
    })
  }

  return (
    <button
      type="button"
      onClick={() => ctx.setIsOpen(!ctx.isOpen)}
      aria-expanded={ctx.isOpen}
      aria-haspopup="menu"
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  className,
  align = 'right',
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  const ctx = useContext(DropdownMenuContext)
  if (!ctx) throw new Error('DropdownMenuContent must be used within DropdownMenu')

  return (
    <AnimatePresence>
      {ctx.isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'absolute z-50 mt-2 w-48 bg-white border border-neutral-200 shadow-xl py-1 outline-none',
            {
              'right-0 origin-top-right': align === 'right',
              'left-0 origin-top-left': align === 'left',
              'left-1/2 -translate-x-1/2 origin-top': align === 'center',
            },
            className
          )}
          role="menu"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  disabled = false,
  destructive = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  destructive?: boolean
}) {
  const ctx = useContext(DropdownMenuContext)
  if (!ctx) throw new Error('DropdownMenuItem must be used within DropdownMenu')

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onClick?.()
          ctx.closeMenu()
        }
      }}
      className={cn(
        'w-full text-left px-4 py-2.5 text-xs font-sans transition-colors duration-150 flex items-center gap-2',
        disabled
          ? 'opacity-50 cursor-not-allowed text-neutral-400'
          : destructive
            ? 'text-red-600 hover:bg-red-50'
            : 'text-neutral-700 hover:bg-neutral-50 hover:text-brand-black',
        className
      )}
    >
      {children}
    </button>
  )
}
