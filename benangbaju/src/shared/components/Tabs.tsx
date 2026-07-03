'use client'

import React, { createContext, useContext, useState, useRef, useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
  baseId: string
  tabRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const baseId = useId()
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  const activeTab = value !== undefined ? value : internalValue
  const setActiveTab = (newVal: string) => {
    if (value === undefined) setInternalValue(newVal)
    onValueChange?.(newVal)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId, tabRefs }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsList must be used within Tabs')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const tabs = Array.from(ctx.tabRefs.current.entries())
      if (tabs.length === 0) return

      const currentIndex = tabs.findIndex(([val]) => val === ctx.activeTab)
      if (currentIndex === -1) return

      let nextIndex = currentIndex
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length
      } else {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
      }

      const [nextVal, nextElement] = tabs[nextIndex]
      ctx.setActiveTab(nextVal)
      nextElement.focus()
    }
  }

  return (
    <div
      className={cn(
        'flex items-center border-b border-neutral-200 overflow-x-auto hide-scrollbar',
        className
      )}
      role="tablist"
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = ctx.activeTab === value
  const triggerId = `${ctx.baseId}-trigger-${value}`
  const contentId = `${ctx.baseId}-content-${value}`

  return (
    <button
      ref={(el) => {
        if (el) ctx.tabRefs.current.set(value, el)
        else ctx.tabRefs.current.delete(value)
      }}
      type="button"
      role="tab"
      id={triggerId}
      aria-selected={isActive}
      aria-controls={contentId}
      tabIndex={isActive ? 0 : -1}
      onClick={() => ctx.setActiveTab(value)}
      className={cn(
        'relative px-6 py-4 text-xs font-heading font-semibold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap outline-none focus-visible:bg-neutral-50',
        isActive ? 'text-brand-black' : 'text-neutral-400 hover:text-neutral-700',
        className
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId={`activeTabIndicator-${ctx.baseId}`}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-black"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent must be used within Tabs')

  if (ctx.activeTab !== value) return null

  const triggerId = `${ctx.baseId}-trigger-${value}`
  const contentId = `${ctx.baseId}-content-${value}`

  return (
    <motion.div
      id={contentId}
      role="tabpanel"
      aria-labelledby={triggerId}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'py-6 outline-none focus-visible:ring-2 focus-visible:ring-brand-black/20',
        className
      )}
      tabIndex={0}
    >
      {children}
    </motion.div>
  )
}
