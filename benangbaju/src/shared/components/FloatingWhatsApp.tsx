'use client'

import React from 'react'
import { motion } from 'framer-motion'
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
        pathname?.startsWith('/produk/') ? 'bottom-24 md:bottom-6' : 'bottom-6'
      )}
      style={{
        right: showScrollTop ? '80px' : '24px',
      }}
      aria-label="Chat WhatsApp"
    >
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.489 0 9.953-4.461 9.956-9.952.002-2.661-1.033-5.162-2.914-7.045C16.429 1.726 13.93 .689 11.27.689c-5.494 0-9.961 4.467-9.964 9.96-.001 1.93.501 3.81 1.456 5.429L1.737 22.09l6.096-1.6c1.559.851 3.018 1.251 4.6 1.251h-.002zm11.366-7.294c-.312-.156-1.848-.912-2.134-1.017-.286-.105-.495-.156-.703.156-.208.312-.807.105-.989.312-.182.208-.364.234-.676.078-.312-.156-1.318-.486-2.51-1.549-.928-.827-1.554-1.849-1.736-2.16-.182-.312-.02-.481.136-.636.14-.139.312-.364.468-.546.156-.182.208-.312.312-.52.104-.208.052-.39-.026-.546-.078-.156-.703-1.693-.963-2.319-.253-.611-.513-.53-.703-.53-.182-.01-.39-.01-.598-.01-.208 0-.546.078-.832.39-.286.312-1.092 1.066-1.092 2.6 0 1.534 1.118 3.016 1.274 3.224.156.208 2.199 3.359 5.328 4.709.745.321 1.326.513 1.778.656.75.238 1.433.205 1.973.125.602-.09 1.848-.755 2.11-1.484.26-.73.26-1.353.182-1.484-.078-.13-.286-.208-.598-.364z" />
      </svg>
    </motion.a>
  )
}
