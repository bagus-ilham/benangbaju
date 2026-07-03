'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ScrollToTopButton() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShow(window.scrollY > 400)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={handleScrollToTop}
          className={cn(
            'fixed right-6 flex items-center justify-center w-11 h-11 bg-white text-brand-black border border-neutral-200 shadow-lg hover:border-brand-gold hover:text-brand-gold hover:scale-110 active:scale-95 transition-all duration-300 z-50 rounded-full group',
            pathname?.startsWith('/produk/') ? 'bottom-24 md:bottom-6' : 'bottom-6'
          )}
          aria-label="Kembali ke atas"
        >
          <ChevronRight className="h-5 w-5 -rotate-90 group-hover:-translate-y-0.5 transition-transform duration-300" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
