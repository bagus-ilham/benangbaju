'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { ProductListItem } from '@/services/products'
import { cn, formatIDR } from '@/lib/utils'

interface ProductCardProps {
  product: ProductListItem
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { isLiked, toggleWishlist } = useWishlist()
  const [isHovered, setIsHovered] = useState(false)

  const liked = isLiked(product.id)

  // Get active pricing (minimum price from variants)
  const activeVariants = product.product_variants.filter((v) => v.is_active)
  const prices = activeVariants.map((v) => Number(v.price))
  const comparePrices = activeVariants.map((v) => v.compare_price ? Number(v.compare_price) : null)
  
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  
  // Find compare price matching the min price variant
  const minPriceVariant = activeVariants.find((v) => Number(v.price) === minPrice)
  const comparePrice = minPriceVariant?.compare_price ? Number(minPriceVariant.compare_price) : null

  // Images swap layout
  const primaryImage = product.product_images.find((img) => img.is_primary)?.url || product.product_images[0]?.url || null
  const hoverImage = product.product_images.find((img) => !img.is_primary && img.sort_order > 0)?.url || product.product_images[1]?.url || primaryImage

  return (
    <div
      className={cn('group relative flex flex-col w-full text-left bg-white', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 transition-colors duration-300">
        <Link href={`/produk/${product.slug}`} className="block w-full h-full">
          {primaryImage ? (
            <div className="relative w-full h-full">
              {/* Primary Image */}
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="(max-w-7xl) 33vw, 50vw"
                className={cn(
                  'object-cover transition-opacity duration-700 ease-in-out',
                  isHovered && hoverImage !== primaryImage ? 'opacity-0' : 'opacity-100'
                )}
                priority={false}
              />
              {/* Hover Swap Image */}
              {hoverImage && hoverImage !== primaryImage && (
                <Image
                  src={hoverImage}
                  alt={`${product.name} detail`}
                  fill
                  sizes="(max-w-7xl) 33vw, 50vw"
                  className={cn(
                    'object-cover absolute inset-0 transition-opacity duration-700 ease-in-out',
                    isHovered ? 'opacity-100' : 'opacity-0'
                  )}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-xs text-neutral-400 font-sans">
              Tidak ada gambar
            </div>
          )}
        </Link>

        {/* Wishlist Toggle Button (Top-Right overlay) */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWishlist(product.id)
          }}
          className="absolute top-3 right-3 p-1.5 bg-white/85 hover:bg-white border border-neutral-100 transition-all rounded-none duration-300 hover:scale-105 z-10"
          aria-label={liked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
        >
          <Heart
            className={cn(
              'h-3.5 w-3.5 transition-colors duration-300',
              liked ? 'fill-red-500 text-red-500' : 'text-neutral-500 hover:text-brand-black'
            )}
          />
        </button>

        {/* Special Out of Stock overlay */}
        {activeVariants.every((v) => v.stock === 0) && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
            <span className="bg-brand-black text-white text-[9px] font-heading font-medium uppercase tracking-widest px-3 py-1.5">
              Habis Terjual
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex flex-col pt-4 pb-2 space-y-1">
        {/* Category Name */}
        {product.categories && (
          <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            {product.categories.name}
          </span>
        )}

        {/* Product Title */}
        <Link href={`/produk/${product.slug}`} className="block">
          <h3 className="text-xs font-heading font-medium uppercase tracking-wider text-brand-black hover:text-brand-gray transition-colors truncate">
            {product.name}
          </h3>
        </Link>

        {/* Price Tag */}
        <div className="flex items-center space-x-2 pt-0.5">
          <span className="text-xs font-sans font-semibold text-brand-black">
            {prices.length > 1 && minPrice !== maxPrice
              ? `${formatIDR(minPrice)} - ${formatIDR(maxPrice)}`
              : formatIDR(minPrice)}
          </span>
          {comparePrice && comparePrice > minPrice && (
            <span className="text-[10px] font-sans text-neutral-400 line-through">
              {formatIDR(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
