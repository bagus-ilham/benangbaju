'use client'

import React, { useState, useEffect } from 'react'
import { getImageProps } from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Banner } from '@/features/marketing/services/banners'
import { Button } from '@/shared/components'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  banners: Banner[]
}

export function HeroSection({ banners }: HeroSectionProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 6000) // 6 seconds auto-rotate

    return () => clearInterval(interval)
  }, [banners])

  if (banners.length === 0) {
    // Elegant high fashion fallback placeholder banner
    return (
      <div className="relative h-[60vh] md:h-[80vh] w-full bg-brand-cream flex items-center justify-center">
        <div className="text-center space-y-4 max-w-lg px-4">
          <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            Koleksi Baru
          </span>
          <h2 className="text-3xl md:text-5xl font-heading font-light uppercase tracking-widest text-brand-black leading-tight">
            Elegan dalam Kesederhanaan
          </h2>
          <p className="text-xs text-neutral-500 font-sans max-w-sm mx-auto">
            Temukan paduan gaya modest modern yang minimalis, nyaman, dan premium untuk aktivitas
            sehari-hari Anda.
          </p>
          <div className="pt-4">
            <Link href="/produk">
              <Button variant="primary" size="md">
                Belanja Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentBanner = banners[currentIndex]

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const commonProps = {
    alt: currentBanner.title || '',
    fill: true,
    sizes: '100vw',
    priority: true,
    className: 'object-cover',
    style: {
      animation: 'ken-burns 8s ease-out forwards',
      width: '100%',
      height: '100%',
      position: 'absolute' as const,
      inset: 0,
    },
  }

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...commonProps,
    src: currentBanner.image_url,
  })

  const {
    props: { srcSet: mobileSrcSet, alt, ...restMobile },
  } = getImageProps({
    ...commonProps,
    src: currentBanner.image_mobile_url || currentBanner.image_url,
  })

  return (
    <div
      className="relative h-[70vh] md:h-[90vh] w-full overflow-hidden bg-brand-black"
      role="region"
      aria-roledescription="carousel"
      aria-label="Koleksi Banner Utama"
    >
      {/* Banner Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8 } }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="relative w-full h-full"
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${currentIndex + 1} dari ${banners.length}`}
        >
          <picture className="absolute inset-0 w-full h-full block">
            <source media="(min-width: 640px)" srcSet={desktopSrcSet} />
            <img srcSet={mobileSrcSet} alt={alt || 'Banner'} {...restMobile} />
          </picture>

          {/* Elegant overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/60 via-neutral-900/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 via-transparent to-neutral-900/10" />

          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-md md:max-w-xl text-left space-y-4 md:space-y-6">
                <motion.span
                  initial={{ y: 20, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: { delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                  }}
                  className="inline-block text-[10px] font-heading font-medium uppercase tracking-[0.25em] text-brand-gold-light bg-brand-black/40 backdrop-blur-sm px-4 py-1.5 border border-brand-gold/30"
                >
                  {currentBanner.subtitle || 'Koleksi Terbaru'}
                </motion.span>

                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: { delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                  }}
                  className="text-3xl md:text-5xl lg:text-7xl font-heading font-light uppercase tracking-wider text-white leading-[1.1]"
                >
                  {currentBanner.title}
                </motion.h1>

                {currentBanner.link_url && (
                  <motion.div
                    initial={{ y: 25, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="pt-4"
                  >
                    <Link href={currentBanner.link_url}>
                      <Button variant="primary" size="md">
                        Jelajahi Koleksi
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slider Controls (Only if multiple banners exist) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/90 text-white hover:text-brand-black backdrop-blur-sm border border-white/20 transition-all duration-300 rounded-none hidden md:block"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/90 text-white hover:text-brand-black backdrop-blur-sm border border-white/20 transition-all duration-300 rounded-none hidden md:block"
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className="p-2 flex items-center justify-center focus-ring-premium rounded-none"
                aria-label={`Buka slide ${idx + 1}`}
                aria-current={idx === currentIndex ? 'true' : undefined}
              >
                <span
                  className={cn(
                    'block h-0.5 transition-all duration-500 rounded-none',
                    idx === currentIndex
                      ? 'w-10 bg-brand-gold-light'
                      : 'w-3 bg-white/40 hover:bg-white/70'
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
