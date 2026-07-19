'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductImage } from '@/modules/products/types'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
  selectedVariantId?: string | null
  activeImage?: string | null
  setActiveImage?: (url: string) => void
  hideThumbnailsOnDesktop?: boolean
}

export function ProductGallery({
  images,
  productName,
  selectedVariantId,
  activeImage: controlledActiveImage,
  setActiveImage: controlledSetActiveImage,
  hideThumbnailsOnDesktop,
}: ProductGalleryProps): React.JSX.Element {
  const [internalActiveImage, setInternalActiveImage] = useState<string | null>(
    images.find((img) => img.is_primary)?.url || images[0]?.url || null
  )

  const activeImage =
    controlledActiveImage !== undefined ? controlledActiveImage : internalActiveImage
  const setActiveImage = (url: string) => {
    if (controlledSetActiveImage) {
      controlledSetActiveImage(url)
    }
    setInternalActiveImage(url)
  }

  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const [isZoomed, setIsZoomed] = useState(false)
  const [hasIntentToZoom, setHasIntentToZoom] = useState(false)

  const [direction, setDirection] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if device is mobile to enable drag and disable zoom
    const mql = window.matchMedia('(max-width: 768px)')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const prevVariantIdRef = useRef<string | null>(null)

  // Auto-switch active image when a variant is selected and has a matching variant_id image
  useEffect(() => {
    if (selectedVariantId && selectedVariantId !== prevVariantIdRef.current) {
      prevVariantIdRef.current = selectedVariantId
      const variantImage = images.find((img) => img.variant_id === selectedVariantId)
      if (variantImage) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDirection(1)
        setHasIntentToZoom(false) // Reset HD intent on image change

        setActiveImage(variantImage.url)

        if (isMobile) {
          const mobileGallery = document.getElementById('mobile-product-gallery')
          const targetImg = document.getElementById(`gallery-img-${variantImage.id}`)
          if (mobileGallery && targetImg) {
            mobileGallery.scrollTo({ left: targetImg.offsetLeft, behavior: 'smooth' })
          }
        }
      }
    }
  }, [selectedVariantId, images, isMobile])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return // Disable zoom on mobile
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const paginate = (newDirection: number) => {
    const currentIndex = images.findIndex((img) => img.url === activeImage)
    let nextIndex = currentIndex + newDirection
    if (nextIndex < 0) nextIndex = images.length - 1
    if (nextIndex >= images.length) nextIndex = 0
    setDirection(newDirection)
    setHasIntentToZoom(false) // Reset HD intent on image change
    setActiveImage(images[nextIndex].url)
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] w-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 font-sans">
        Tidak ada gambar produk
      </div>
    )
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <div className="flex flex-col w-full group">
      {/* Mobile Swipe Gallery (Native Scroll Snap) */}
      <div className="md:hidden relative w-full aspect-[3/4] overflow-hidden bg-neutral-50 border border-neutral-100">
        <div
          id="mobile-product-gallery"
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement
            const index = Math.round(target.scrollLeft / target.clientWidth)
            if (images[index] && images[index].url !== activeImage) {
              setActiveImage(images[index].url)
            }
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              id={`gallery-img-${img.id}`}
              className="w-full h-full flex-shrink-0 snap-center relative"
            >
              <Image
                src={getProxiedImageUrl(img.url)}
                alt={productName}
                fill
                quality={75}
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
                priority={img.is_primary || images[0].id === img.id}
              />
            </div>
          ))}
        </div>

        {/* Mobile Swipe Indicators (Dots) */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1.5 z-10 pointer-events-none">
            {images.map((img) => (
              <div
                key={`dot-${img.id}`}
                className={cn(
                  'h-1 transition-all duration-300 rounded-full',
                  activeImage === img.url ? 'w-4 bg-brand-dark' : 'w-1.5 bg-neutral-300/80'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Focus Image (Framer Motion) */}
      <div
        className="hidden md:block relative aspect-[3/4] w-full bg-neutral-50 overflow-hidden border border-neutral-100 cursor-zoom-in"
        onMouseEnter={() => {
          setIsZoomed(true)
          setHasIntentToZoom(true) // Trigger lazy load of HD image
        }}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence initial={false} custom={direction}>
          {activeImage && (
            <motion.div
              key={activeImage}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 w-full h-full"
            >
              {/* 1. Base Image (Fast Load, Compressed) */}
              <Image
                src={getProxiedImageUrl(activeImage)}
                alt={productName}
                fill
                quality={75}
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
                style={{
                  transformOrigin: isZoomed && !isMobile ? `${zoomPos.x}% ${zoomPos.y}%` : 'center',
                  transform: isZoomed && !isMobile ? 'scale(2.2)' : 'scale(1)',
                  transition: isZoomed && !isMobile ? 'none' : 'transform 0.3s ease-out',
                }}
                priority
              />

              {/* 2. HD Image (Lazy Loaded on Hover, Unoptimized) */}
              {hasIntentToZoom && !isMobile && (
                <Image
                  src={getProxiedImageUrl(activeImage)}
                  alt={`${productName} HD`}
                  fill
                  unoptimized={true}
                  className="object-cover pointer-events-none"
                  style={{
                    transformOrigin:
                      isZoomed && !isMobile ? `${zoomPos.x}% ${zoomPos.y}%` : 'center',
                    transform: isZoomed && !isMobile ? 'scale(2.2)' : 'scale(1)',
                    transition: isZoomed && !isMobile ? 'none' : 'transform 0.3s ease-out',
                    opacity: isZoomed ? 1 : 0,
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thumbnails (Horizontal Row below the main image) */}
      {images.length > 1 && (
        <div className={cn(hideThumbnailsOnDesktop && 'md:hidden')}>
          <ProductThumbnails
            images={images}
            activeImage={activeImage}
            setActiveImage={(url) => {
              setActiveImage(url)
              if (isMobile) {
                const img = images.find((i) => i.url === url)
                if (img) {
                  const mobileGallery = document.getElementById('mobile-product-gallery')
                  const targetImg = document.getElementById(`gallery-img-${img.id}`)
                  if (mobileGallery && targetImg) {
                    mobileGallery.scrollTo({ left: targetImg.offsetLeft, behavior: 'smooth' })
                  }
                }
              }
            }}
            productName={productName}
          />
        </div>
      )}
    </div>
  )
}

interface ProductThumbnailsProps {
  images: ProductImage[]
  activeImage: string | null
  setActiveImage: (url: string) => void
  productName: string
}

export function ProductThumbnails({
  images,
  activeImage,
  setActiveImage,
  productName,
}: ProductThumbnailsProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (images.length <= 1) return <></>

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const displayImages = images.filter((img) => !img.variant_id)

  return (
    <div className="relative mt-4 flex items-center group">
      {displayImages.length > 4 && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 z-10 p-1 bg-white/80 hover:bg-white shadow-md border border-neutral-100 text-neutral-600 rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex flex-row space-x-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth w-full px-1"
      >
        {displayImages.map((img) => (
          <button
            type="button"
            key={img.id}
            onClick={() => setActiveImage(img.url)}
            className={cn(
              'relative aspect-[3/4] w-20 flex-shrink-0 bg-neutral-50 border transition-all duration-300',
              activeImage === img.url
                ? 'border-brand-black opacity-100'
                : 'border-neutral-200 opacity-60 hover:opacity-100'
            )}
          >
            <Image
              src={getProxiedImageUrl(img.url)}
              alt={img.alt_text || productName}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {displayImages.length > 4 && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 z-10 p-1 bg-white/80 hover:bg-white shadow-md border border-neutral-100 text-neutral-600 rounded-l-md opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
