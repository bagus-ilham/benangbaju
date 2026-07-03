'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { EASE_PREMIUM } from '@/lib/motion'

export default function CustomerTemplate({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_PREMIUM }}
      className="flex-1 flex flex-col w-full"
    >
      {children}
    </motion.main>
  )
}
