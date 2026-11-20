'use client'

import React, { useState, useEffect } from 'react'
import { SmartImage as Image, SmartLink as Link, HandDrawnIcon } from '@/shared/components'
import { motion, AnimatePresence } from 'framer-motion'
import { Banner } from '@/modules/banners/types'
import { Button } from '@/shared/components'
import { cn } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

interface HeroSectionProps {
  banners: Banner[]
}

export function HeroSection({ banners }: HeroSectionProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  const filteredBanners = React.useMemo(() => {
    return (banners || []).filter(
      (b) => !b.target_market || b.target_market === 'ALL' || b.target_market === market
    )
  }, [banners, market])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (currentIndex >= filteredBanners.length) {
      setCurrentIndex(0)
    }
  }, [filteredBanners.length, currentIndex])

  useEffect(() => {
    if (filteredBanners.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredBanners.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [filteredBanners, isHovered])

  if (filteredBanners.length === 0) {
    return (
      <div className="relative w-full bg-brand-cream flex items-center justify-center h-[50vh] min-h-[360px] md:h-[70vh] font-sans">
        <div className="text-center space-y-4 max-w-lg px-4">
          <h2 className="text-3xl md:text-5xl font-display font-semibold tracking-tight text-brand-plum leading-tight">
            {isMY ? 'Elegance in Simplicity' : 'Elegan dalam Kesederhanaan'}
          </h2>
          <p className="text-xs md:text-sm text-neutral-600 font-sans max-w-sm mx-auto">
            {isMY
              ? 'Discover comfortable and distinctively simple apparel designed for both daily wear and special moments.'
              : 'Temukan paduan pakaian sederhana namun unik yang nyaman untuk aktivitas harian hingga acara spesial Anda.'}
          </p>
          <div className="pt-4">
            <Link href="/produk">
              <Button variant="accent" size="md" className="font-bold">
                {isMY ? 'Shop Now' : 'Belanja Sekarang'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentBanner = filteredBanners[currentIndex]
  const bannerTitle = isMY && currentBanner.title_en ? currentBanner.title_en : currentBanner.title
  const bannerSubtitle =
    isMY && currentBanner.subtitle_en ? currentBanner.subtitle_en : currentBanner.subtitle
  const hasTextOverlay = Boolean(bannerTitle || bannerSubtitle)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredBanners.length) % filteredBanners.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredBanners.length)
  }

  const bannerMedia = (
    <>
      {/* Desktop Banner Image */}
      <div className="hidden md:block absolute inset-0 w-full h-full">
        <Image
          src={getProxiedImageUrl(currentBanner.image_url)}
          alt={bannerTitle || 'Banner Desktop'}
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Mobile Banner Image */}
      <div className="block md:hidden absolute inset-0 w-full h-full">
        <Image
          src={getProxiedImageUrl(currentBanner.image_mobile_url || currentBanner.image_url)}
          alt={bannerTitle || 'Banner Mobile'}
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </>
  )

  return (
    <section
      className="relative w-full h-[65vh] min-h-[420px] md:h-[75vh] md:min-h-[520px] overflow-hidden bg-brand-cream"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={isMY ? 'Main Banner Collection' : 'Koleksi Banner Utama'}
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
          aria-label={
            isMY
              ? `Slide ${currentIndex + 1} of ${filteredBanners.length}`
              : `Slide ${currentIndex + 1} dari ${filteredBanners.length}`
          }
        >
          {/* Make the entire banner slide clickable when link_url exists */}
          {currentBanner.link_url && !hasTextOverlay ? (
            <Link
              href={currentBanner.link_url}
              className="block relative w-full h-full"
              aria-label={isMY ? 'Explore Collection' : 'Jelajahi Koleksi'}
            >
              {bannerMedia}
            </Link>
          ) : (
            bannerMedia
          )}

          {/* Optional Editorial Text Overlay (only when banner has explicit title/subtitle in DB) */}
          {hasTextOverlay && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="mx-auto max-w-4xl px-6 text-center space-y-3 md:space-y-4 pointer-events-auto">
                {bannerSubtitle && (
                  <motion.span
                    initial={{ y: 16, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="inline-block text-xs md:text-sm font-heading font-semibold uppercase tracking-[0.16em] text-brand-gold bg-brand-plum/75 backdrop-blur-xs px-4 py-1.5 rounded-full"
                  >
                    {bannerSubtitle}
                  </motion.span>
                )}

                {bannerTitle && (
                  <motion.h1
                    initial={{ y: 24, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="text-3xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-white leading-[1.18] drop-shadow-md"
                  >
                    {bannerTitle}
                  </motion.h1>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Centered Stack: Sleek CTA Pill + Slide Indicator Dots */}
      {(currentBanner.link_url || filteredBanners.length > 1) && (
        <div className="absolute bottom-5 md:bottom-7 inset-x-0 z-30 flex flex-col items-center gap-3 px-4 pointer-events-none">
          {currentBanner.link_url && (
            <motion.div
              key={`cta-${currentIndex}`}
              initial={{ y: 12, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: { delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              }}
              className="pointer-events-auto"
            >
              <Link
                href={currentBanner.link_url}
                className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-2.5 rounded-full bg-brand-cream/92 hover:bg-brand-gold text-brand-plum backdrop-blur-md border border-brand-plum/15 text-[10px] md:text-[11px] font-sans font-bold uppercase tracking-[0.16em] shadow-[0_8px_24px_-4px_rgba(45,38,64,0.22)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-4px_rgba(45,38,64,0.28)] transition-all duration-300 group"
              >
                <span>{isMY ? 'Explore Collection' : 'Jelajahi Koleksi'}</span>
                <HandDrawnIcon
                  name="arrow-right"
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>
            </motion.div>
          )}

          {filteredBanners.length > 1 && (
            <div className="pointer-events-auto flex space-x-2 bg-brand-plum/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
              {filteredBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className="p-1 flex items-center justify-center focus:outline-none rounded-full"
                  aria-label={isMY ? `Go to slide ${idx + 1}` : `Buka slide ${idx + 1}`}
                  aria-current={idx === currentIndex ? 'true' : undefined}
                >
                  <span
                    className={cn(
                      'block h-1.5 transition-all duration-500 rounded-full',
                      idx === currentIndex
                        ? 'w-8 bg-brand-gold'
                        : 'w-2.5 bg-brand-cream/45 hover:bg-brand-cream/85'
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Slider Arrows (Desktop, only if multiple banners exist) */}
      {filteredBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-brand-plum/45 hover:bg-brand-plum/85 text-white backdrop-blur-md border border-white/20 transition-all duration-300 rounded-full hidden md:block"
            aria-label={isMY ? 'Previous slide' : 'Slide sebelumnya'}
          >
            <HandDrawnIcon name="chevron-left" className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-brand-plum/45 hover:bg-brand-plum/85 text-white backdrop-blur-md border border-white/20 transition-all duration-300 rounded-full hidden md:block"
            aria-label={isMY ? 'Next slide' : 'Slide berikutnya'}
          >
            <HandDrawnIcon name="chevron-right" className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  )
}
