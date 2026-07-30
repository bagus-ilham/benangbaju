'use client'

import React from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()

  // Optional: add a spring for smoother animation
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-brand-gold origin-left z-50 pointer-events-none"
      style={{ scaleX }}
    />
  )
}
