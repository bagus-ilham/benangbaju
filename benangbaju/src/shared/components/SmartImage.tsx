'use client'

import React, { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { getImageFallbackChain } from '@/lib/getImageUrl'

export interface SmartImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined | ImageProps['src']
  fallbackSrc?: string
}

export function SmartImage({
  src,
  fallbackSrc = '/images/placeholder.jpg',
  onError,
  unoptimized = false,
  alt,
  ...props
}: SmartImageProps): React.JSX.Element {
  const [chain, setChain] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (typeof src === 'string') {
      const urls: string[] = []
      const trimmedSrc = src.trim()

      if (trimmedSrc) {
        const baseChain = getImageFallbackChain(trimmedSrc)
        for (const u of baseChain) {
          if (u !== '/images/placeholder.jpg' && !urls.includes(u)) {
            urls.push(u)
          }
        }
      }

      if (fallbackSrc && fallbackSrc.trim() && !urls.includes(fallbackSrc.trim())) {
        urls.push(fallbackSrc.trim())
      }

      if (!urls.includes('/images/placeholder.jpg')) {
        urls.push('/images/placeholder.jpg')
      }

      setChain(urls)
      setCurrentIndex(0)
    } else {
      setChain([])
      setCurrentIndex(0)
    }
  }, [src, fallbackSrc])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (chain.length > 0 && currentIndex + 1 < chain.length) {
      setCurrentIndex((prev) => prev + 1)
    }
    if (onError) {
      onError(e)
    }
  }

  // StaticImport or object src
  if (typeof src !== 'string') {
    return (
      <Image
        src={src || fallbackSrc}
        alt={alt || 'Image'}
        onError={handleError}
        unoptimized={unoptimized}
        {...props}
      />
    )
  }

  const activeSrc = chain[currentIndex] || fallbackSrc

  return (
    <Image
      src={activeSrc}
      alt={alt || 'Image'}
      onError={handleError}
      unoptimized={unoptimized}
      {...props}
    />
  )
}
