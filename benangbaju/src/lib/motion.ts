import type { Variants } from 'framer-motion'

export const EASE_PREMIUM: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_PREMIUM },
  },
}

export const fadeInView = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5, ease: EASE_PREMIUM },
}
