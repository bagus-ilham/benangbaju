'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductImage } from '@/features/products/services'
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

  // Auto-switch active image when a variant is selected and has a matching variant_id image
  useEffect(() => {
    if (selectedVariantId) {
      const variantImage = images.find((img) => img.variant_id === selectedVariantId)
      if (variantImage) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveImage(variantImage.url)
      }
    }
  }, [selectedVariantId, images])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] w-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 font-sans">
        Tidak ada gambar produk
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      {/* Main Focus Image */}
      <div
        className="relative aspect-[3/4] w-full bg-neutral-50 overflow-hidden border border-neutral-100 cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          {activeImage && (
            <motion.div
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full"
            >
              <Image
                src={activeImage}
                alt={productName}
                fill
                sizes="(max-w-7xl) 50vw, 100vw"
                className="object-cover"
                style={{
                  transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : 'center',
                  transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                  transition: isZoomed ? 'none' : 'transform 0.3s ease-out',
                }}
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>
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
