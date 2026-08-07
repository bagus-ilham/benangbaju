'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { HandDrawnIcon } from '@/shared/components/HandDrawnIcon'
import { cn } from '@/lib/utils'

interface FloatingWhatsAppProps {
  whatsappUrl: string | null | undefined
  showScrollTop: boolean
  pathname: string
}

export function FloatingWhatsApp({
  whatsappUrl,
  showScrollTop,
  pathname,
}: FloatingWhatsAppProps): React.JSX.Element | null {
  if (!whatsappUrl) return null

  return (
    <motion.a
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'fixed z-45 w-11 h-11 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:bg-[#20ba5a] hover:scale-110 active:scale-95 transition-all duration-350 cursor-pointer',
        pathname?.startsWith('/produk/') ? 'bottom-24 md:bottom-6' : 'bottom-20 md:bottom-6'
      )}
      style={{
        right: showScrollTop ? '80px' : '24px',
      }}
      aria-label="Chat WhatsApp"
    >
      <HandDrawnIcon name="whatsapp" className="w-5 h-5 invert brightness-200" />
    </motion.a>
  )
}
