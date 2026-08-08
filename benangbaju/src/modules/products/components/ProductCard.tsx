'use client'

import React, { useState } from 'react'
import { SmartLink as Link } from '@/shared/components'
import { useRouter } from 'next/navigation'
import { SmartImage as Image } from '@/shared/components'
import { motion } from 'framer-motion'
import { HandDrawnIcon } from '@/shared/components'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'
import { ProductListItem } from '@/modules/products/types'
import { cn, formatIDR } from '@/lib/utils'
import { Badge } from '@/shared/components/Badge'
import toast from 'react-hot-toast'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

interface ProductCardProps {
  product: ProductListItem
  className?: string
}

export const ProductCard = React.memo(function ProductCard({
  product,
  className,
}: ProductCardProps): React.JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter()
  const isLiked = useWishlistStore((state) => state.productIds.includes(product.id))
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist)
  const [isHovered, setIsHovered] = useState(false)
  const [showAltImage, setShowAltImage] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const liked = isLiked

  const {
    minPrice,
    maxPrice,
    comparePrice,
    discountPercent,
    primaryImage,
    hoverImage,
  } = product

  const displayAltImage = isHovered || showAltImage

  const productUrl = `/produk/${product.slug}`

  return (
    <div
      className={cn(
        'group relative flex flex-col w-full text-left bg-brand-cream transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-10px_rgba(45,38,64,0.08)] rounded-2xl overflow-hidden border border-neutral-200/60 card-stitch-hover',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 transition-colors duration-300">
        <Link
          href={productUrl}
          prefetch={true}
          className="block w-full h-full"
          onClick={() => {
            if (hoverImage && hoverImage !== primaryImage) {
              setShowAltImage((prev) => !prev)
            }
          }}
        >
          {primaryImage ? (
            <div
              className={cn(
                'relative w-full h-full',
                !imageLoaded && 'animate-pulse bg-neutral-200'
              )}
            >
              {/* Primary Image */}
              <Image
                src={getProxiedImageUrl(primaryImage)}
                alt={product.name}
                fill
                sizes="(max-w-7xl) 33vw, 50vw"
                className={cn(
                  'object-cover transition-opacity duration-700 ease-in-out',
                  !imageLoaded
                    ? 'opacity-0'
                    : displayAltImage && hoverImage !== primaryImage
                      ? 'opacity-0'
                      : 'opacity-100'
                )}
                priority={false}
                onLoad={() => setImageLoaded(true)}
              />
              {/* Hover Swap Image */}
              {hoverImage && hoverImage !== primaryImage && (
                <Image
                  src={getProxiedImageUrl(hoverImage)}
                  alt={`${product.name} detail`}
                  fill
                  sizes="(max-w-7xl) 33vw, 50vw"
                  className={cn(
                    'object-cover absolute inset-0 transition-opacity duration-700 ease-in-out',
                    displayAltImage ? 'opacity-100' : 'opacity-0'
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

        {/* Discount badge */}
        {typeof discountPercent === 'number' && discountPercent > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="sale" size="sm">
              -{discountPercent}%
            </Badge>
          </div>
        )}

        {/* Featured badge */}
        {product.is_featured && !discountPercent && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="gold" size="sm">
              Pilihan
            </Badge>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWishlist(product.id)
            if (liked) {
              toast.success('Produk dihapus dari Wishlist', { icon: '🤍' })
            } else {
              toast.success('Produk disimpan ke Wishlist', { icon: '❤️' })
            }
          }}
          className="absolute top-3 right-3 p-1.5 bg-brand-cream/85 hover:bg-brand-cream border border-neutral-100 transition-all rounded-xl duration-300 hover:scale-110 active:scale-90 z-10 shadow-sm"
          aria-label={liked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
          aria-pressed={liked}
        >
          <motion.div
            key={liked ? 'liked' : 'unliked'}
            initial={{ scale: 0.6 }}
            animate={{ scale: [0.6, 1.4, 1] }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <HandDrawnIcon
              name={liked ? 'heart-filled' : 'heart'}
              className={cn(
                'h-3.5 w-3.5 transition-all duration-300',
                liked ? 'scale-110' : 'opacity-70 hover:opacity-100'
              )}
              aria-hidden="true"
            />
          </motion.div>
        </button>

        {/* Special Out of Stock overlay */}
        {product.product_variants.every((v) => v.stock === 0) && (
          <div className="absolute inset-0 bg-brand-cream/60 flex items-center justify-center pointer-events-none">
            <Badge variant="brand" size="md">
              Habis Terjual
            </Badge>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex flex-col pt-3.5 pb-4 px-3 space-y-1">
        {/* Category Name */}
        {product.categories && (
          <span className="text-[9px] uppercase tracking-widest font-sans font-semibold text-neutral-500">
            {product.categories.name}
          </span>
        )}

        {/* Product Title (H3 scale: 16px/600 Mulish) */}
        <Link href={productUrl} prefetch={true} className="block">
          <h3 className="text-sm md:text-base font-sans font-semibold text-brand-plum hover:text-brand-blue transition-colors truncate">
            {product.name}
          </h3>
        </Link>

        {/* Price Tag (Caption/Price scale: 13px/700 Mulish) */}
        <div className="flex items-center space-x-2 pt-0.5">
          <span className="text-[13px] font-sans font-bold text-brand-plum">
            {minPrice !== maxPrice
              ? `${formatIDR(minPrice)} - ${formatIDR(maxPrice)}`
              : formatIDR(minPrice)}
          </span>
          {comparePrice && comparePrice > minPrice && (
            <span className="text-xs font-sans text-neutral-400 line-through">
              {formatIDR(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
