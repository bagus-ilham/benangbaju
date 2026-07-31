'use client'

import React, { useState, useEffect } from 'react'
import { SmartImage as Image, SmartLink as Link } from '@/shared/components'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Banner } from '@/modules/banners/types'
import { Button } from '@/shared/components'
import { cn } from '@/lib/utils'

import { getProxiedImageUrl } from '@/lib/getImageUrl'

interface HeroSectionProps {
  banners: Banner[]
}

export function HeroSection({ banners }: HeroSectionProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (banners.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 6000) // 6 seconds auto-rotate

    return () => clearInterval(interval)
  }, [banners, isHovered])

  if (banners.length === 0) {
    // Elegant high fashion fallback placeholder banner
    return (
      <div className="relative w-full bg-brand-cream flex items-center justify-center h-[50vh] min-h-[360px] md:h-[70vh] font-sans">
        <div className="text-center space-y-4 max-w-lg px-4">
          <h2 className="text-3xl md:text-5xl font-sans font-bold uppercase tracking-widest text-brand-plum leading-tight">
            Elegan dalam Kesederhanaan
          </h2>
          <p className="text-xs text-neutral-600 font-sans max-w-sm mx-auto">
            Temukan paduan pakaian sederhana namun unik yang nyaman untuk aktivitas harian hingga
            acara spesial Anda.
          </p>
          <div className="pt-4">
            <Link href="/produk">
              <Button variant="accent" size="md" className="font-bold">
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

  return (
    <section
      className="relative w-full h-[65vh] min-h-[420px] md:h-[75vh] md:min-h-[520px] overflow-hidden bg-brand-cream"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          {/* Desktop Banner Image (Visible on Desktop / MD screens) */}
          <div className="hidden md:block absolute inset-0 w-full h-full">
            <Image
              src={getProxiedImageUrl(currentBanner.image_url)}
              alt={currentBanner.title || 'Banner Desktop'}
              fill
              priority
              unoptimized
              quality={90}
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* Mobile Banner Image (Visible on Phone / Mobile screens) */}
          <div className="block md:hidden absolute inset-0 w-full h-full">
            <Image
              src={getProxiedImageUrl(currentBanner.image_mobile_url || currentBanner.image_url)}
              alt={currentBanner.title || 'Banner Mobile'}
              fill
              priority
              unoptimized
              quality={90}
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* Elegant overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-plum/80 via-brand-plum/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-plum/60 via-transparent to-brand-plum/20 z-10" />

          <div className="absolute inset-0 flex items-center z-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-md md:max-w-xl text-left space-y-4 md:space-y-6">
                {currentBanner.subtitle && (
                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="inline-block text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-brand-gold bg-brand-plum/60 backdrop-blur-sm px-4 py-1.5 border border-brand-gold/30 rounded-full"
                  >
                    {currentBanner.subtitle}
                  </motion.span>
                )}

                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: { delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                  }}
                  className="text-3xl md:text-5xl lg:text-6xl font-sans font-bold tracking-wide text-brand-cream leading-[1.15]"
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
                      <Button variant="accent" size="lg">
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
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-brand-cream/10 hover:bg-brand-cream/90 text-white hover:text-brand-black backdrop-blur-sm border border-white/20 transition-all duration-300 rounded-full hidden md:block"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-brand-cream/10 hover:bg-brand-cream/90 text-white hover:text-brand-black backdrop-blur-sm border border-white/20 transition-all duration-300 rounded-full hidden md:block"
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
                className="p-2 flex items-center justify-center focus:outline-none rounded-full"
                aria-label={`Buka slide ${idx + 1}`}
                aria-current={idx === currentIndex ? 'true' : undefined}
              >
                <span
                  className={cn(
                    'block h-1.5 transition-all duration-500 rounded-full',
                    idx === currentIndex
                      ? 'w-10 bg-brand-accent-light'
                      : 'w-3 bg-brand-cream/40 hover:bg-brand-cream/70'
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
