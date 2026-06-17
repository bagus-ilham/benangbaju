'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Banner } from '@/services/banners'
import { Button } from '@/components/shared'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  banners: Banner[]
}

export function HeroSection({ banners }: HeroSectionProps) {
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
            ELEGANCE IN SIMPLICITY
          </h2>
          <p className="text-xs text-neutral-500 font-sans max-w-sm mx-auto">
            Temukan paduan gaya modest modern yang minimalis, nyaman, dan premium untuk aktivitas sehari-hari Anda.
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

  return (
    <div className="relative h-[65vh] md:h-[85vh] w-full overflow-hidden bg-brand-cream">
      {/* Banner Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8 } }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="relative w-full h-full"
        >
          {/* Desktop Image */}
          <div className="hidden sm:block absolute inset-0 w-full h-full">
            <Image
              src={currentBanner.image_url}
              alt={currentBanner.title}
              fill
              priority
              className="object-cover"
            />
          </div>
          
          {/* Mobile Image */}
          <div className="sm:hidden absolute inset-0 w-full h-full">
            <Image
              src={currentBanner.image_mobile_url || currentBanner.image_url}
              alt={currentBanner.title}
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Elegant overlay panel (THENBLANK style center or left aligned clean labels) */}
          <div className="absolute inset-0 bg-neutral-900/10" />
          
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-md md:max-w-xl text-left space-y-4 md:space-y-6">
                <motion.span
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 0.2, duration: 0.5 } }}
                  className="inline-block text-[10px] font-heading font-medium uppercase tracking-widest text-brand-black/80 bg-white/70 backdrop-blur-xs px-3 py-1"
                >
                  {currentBanner.subtitle || 'Koleksi Terbaru'}
                </motion.span>
                
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 0.3, duration: 0.6 } }}
                  className="text-3xl md:text-5xl lg:text-6xl font-heading font-light uppercase tracking-wider text-brand-black leading-tight"
                >
                  {currentBanner.title}
                </motion.h1>

                {currentBanner.link_url && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1, transition: { delay: 0.4, duration: 0.5 } }}
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
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/40 hover:bg-white text-brand-black transition-colors rounded-none hidden md:block"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/40 hover:bg-white text-brand-black transition-colors rounded-none hidden md:block"
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'h-1.5 transition-all duration-300 rounded-none',
                  idx === currentIndex ? 'w-6 bg-brand-black' : 'w-1.5 bg-brand-black/30'
                )}
                aria-label={`Buka slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
