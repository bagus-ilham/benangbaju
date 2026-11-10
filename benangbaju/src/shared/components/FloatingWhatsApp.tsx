'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { HandDrawnIcon } from '@/shared/components/HandDrawnIcon'
import { cn } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'

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
  const market = useMarket()
  const isMY = market === 'MY'

  const effectiveUrl = React.useMemo(() => {
    if (!whatsappUrl) return ''
    if (isMY) {
      try {
        const urlObj = new URL(whatsappUrl)
        urlObj.searchParams.set(
          'text',
          'Hello Benangbaju, I am shopping from Malaysia and would like to ask a question.'
        )
        return urlObj.toString()
      } catch {
        return `${whatsappUrl}?text=${encodeURIComponent(
          'Hello Benangbaju, I am shopping from Malaysia and would like to ask a question.'
        )}`
      }
    }
    return whatsappUrl
  }, [whatsappUrl, isMY])

  if (!effectiveUrl) return null

  return (
    <motion.a
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      href={effectiveUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'fixed z-45 w-11 h-11 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:bg-[#20ba5a] hover:scale-110 active:scale-95 transition-all duration-350 cursor-pointer',
        pathname?.startsWith('/produk/') ? 'bottom-24 md:bottom-6' : 'bottom-20 md:bottom-6'
      )}
      style={{
        right: showScrollTop ? '80px' : '24px',
      }}
      aria-label={isMY ? 'Chat with Us on WhatsApp' : 'Chat WhatsApp'}
      title={isMY ? 'Chat with Us on WhatsApp' : 'Chat WhatsApp'}
    >
      <HandDrawnIcon name="whatsapp" className="w-5 h-5 invert brightness-200" />
    </motion.a>
  )
}
