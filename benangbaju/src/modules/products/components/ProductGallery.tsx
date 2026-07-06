'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductImage } from '@/modules/products/services'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
  selectedVariantId?: string | null
}

export function ProductGallery({
  images,
  productName,
  selectedVariantId,
}: ProductGalleryProps): React.JSX.Element {
  const [activeImage, setActiveImage] = useState<string | null>(
    images.find((img) => img.is_primary)?.url || images[0]?.url || null
  )

  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const [isZoomed, setIsZoomed] = useState(false)
  const [hasIntentToZoom, setHasIntentToZoom] = useState(false)

  const [direction, setDirection] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if device is mobile to enable drag and disable zoom
    const mql = window.matchMedia('(max-width: 768px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Auto-switch active image when a variant is selected and has a matching variant_id image
  useEffect(() => {
    if (selectedVariantId) {
      const variantImage = images.find((img) => img.variant_id === selectedVariantId)
      if (variantImage && variantImage.url !== activeImage) {
        setDirection(1)
        setHasIntentToZoom(false) // Reset HD intent on image change
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveImage(variantImage.url)
      }
    }
  }, [selectedVariantId, images, activeImage])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return // Disable zoom on mobile
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

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
      {/* Main Focus Image */}
      <div
        className={cn(
          'relative aspect-[3/4] w-full bg-neutral-50 overflow-hidden border border-neutral-100',
          !isMobile && 'cursor-zoom-in',
          isMobile && 'touch-pan-y'
        )}
        onMouseEnter={() => {
          if (!isMobile) {
            setIsZoomed(true)
            setHasIntentToZoom(true) // Trigger lazy load of HD image
          }
        }}
        onMouseLeave={() => !isMobile && setIsZoomed(false)}
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
              drag={isMobile ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                if (!isMobile) return
                const swipe = offset.x
                if (swipe < -50) {
                  paginate(1)
                } else if (swipe > 50) {
                  paginate(-1)
                }
              }}
              className="absolute inset-0 w-full h-full"
            >
              {/* 1. Base Image (Fast Load, Compressed) */}
              <Image
                src={activeImage}
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
                  src={activeImage}
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

        {/* Mobile Swipe Indicators (Dots) */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1.5 md:hidden z-10 pointer-events-none">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={cn(
                  'h-1 transition-all duration-300 rounded-full',
                  activeImage === img.url ? 'w-4 bg-brand-gold' : 'w-1.5 bg-neutral-300'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails (Horizontal Row below the main image) */}
      {images.length > 1 && (
        <div className="flex flex-row space-x-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img) => (
            <button
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
                src={img.url}
                alt={img.alt_text || productName}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
