'use client'

import React, { useState } from 'react'
import { SmartLink as Link } from '@/shared/components'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { ProductListItem, ProductVariant } from '@/modules/products/types'
import { cn, formatIDR } from '@/lib/utils'
import { Badge } from '@/shared/components/Badge'
import toast from 'react-hot-toast'

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
  const addItem = useCartStore((state) => state.addItem)
  const setCartDrawerOpen = useCartStore((state) => state.setCartDrawerOpen)
  const [isHovered, setIsHovered] = useState(false)
  const [showAltImage, setShowAltImage] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const liked = isLiked

  const {
    minPrice,
    maxPrice,
    comparePrice,
    discountPercent,
    primaryImage,
    hoverImage,
    hasMultipleColors,
    sizeVariants,
  } = product

  const displayAltImage = isHovered || showAltImage

  const handleQuickAdd = async (e: React.MouseEvent, variant: ProductVariant) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAdding) return
    setIsAdding(variant.id)
    try {
      const cartItem = {
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        name: product.name,
        sku: variant.sku,
        price: Number(variant.price),
        comparePrice: variant.compare_price ? Number(variant.compare_price) : null,
        imageUrl: primaryImage,
        slug: product.slug,
        stock: variant.stock,
      }
      await addItem(cartItem, 1)
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-sm w-full bg-white shadow-2xl border border-neutral-100 flex pointer-events-auto border-t-2 border-t-brand-gold`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                {primaryImage ? (
                  <div
                    className="relative aspect-[3/4] w-10 border border-neutral-100 overflow-hidden"
                    aria-hidden="true"
                  >
                    <Image
                      className="object-cover"
                      src={primaryImage}
                      alt={product.name}
                      fill
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div
                    className="h-10 w-10 bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400 font-sans"
                    aria-hidden="true"
                  >
                    No Img
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-gold">
                  Berhasil Ditambahkan!
                </p>
                <p className="text-[11px] font-heading font-medium uppercase text-brand-black line-clamp-1 mt-0.5">
                  {product.name}
                </p>
                <p className="text-[9px] text-neutral-400 uppercase font-sans mt-0.5">
                  Varian: {variant.name} &bull; Qty: 1
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-neutral-100">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                setCartDrawerOpen(true)
              }}
              className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-xs font-heading font-bold uppercase tracking-wider text-brand-gold hover:text-brand-gold-light focus:outline-none cursor-pointer"
            >
              Lihat
            </button>
          </div>
        </div>
      ))
    } catch {
      toast.error('Gagal menambahkan ke keranjang.')
    } finally {
      setIsAdding(null)
    }
  }

  const productUrl = `/produk/${product.slug}`

  return (
    <div
      className={cn(
        'group relative flex flex-col w-full text-left bg-white transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(23,23,23,0.12)] rounded-xl overflow-hidden',
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
                src={primaryImage}
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
                  src={hoverImage}
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
        {discountPercent && discountPercent > 0 && (
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

        {/* 🎨 PALETTE ENHANCEMENT
        Problem: Tombol Wishlist pada product card membutuhkan aria-pressed state dan visual feedback.
        Fix: Menambahkan aria-pressed={liked} dan toast notification.
        Impact: Aksesibilitas interaksi toggle lebih baik untuk screen reader dan feedback visual yang jelas */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWishlist(product.id)
            if (liked) {
              toast.success('Dihapus dari wishlist', { icon: '🤍' })
            } else {
              toast.success('Ditambahkan ke wishlist', { icon: '❤️' })
            }
          }}
          className="absolute top-3 right-3 p-1.5 bg-white/85 hover:bg-white border border-neutral-100 transition-all rounded-none duration-300 hover:scale-110 active:scale-90 z-10"
          aria-label={liked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
          aria-pressed={liked}
        >
          <Heart
            className={cn(
              'h-3.5 w-3.5 transition-colors duration-300',
              liked ? 'fill-red-500 text-red-500' : 'text-neutral-500 hover:text-brand-black'
            )}
            aria-hidden="true"
          />
        </button>

        {/* Special Out of Stock overlay */}
        {product.product_variants.every((v) => v.stock === 0) && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
            <Badge variant="brand" size="md">
              Habis Terjual
            </Badge>
          </div>
        )}

        {/* Quick add or view details overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-brand-black/85 backdrop-blur-xs py-2 px-3 transform translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 md:group-hover:translate-y-0 max-md:translate-y-0 z-20 flex flex-col items-center justify-center min-h-[44px]">
          {!hasMultipleColors && sizeVariants.length > 0 ? (
            <div className="w-full space-y-1 text-center">
              <span className="text-[8px] font-heading font-medium uppercase tracking-widest text-brand-gold-light">
                + Keranjang Instan
              </span>
              <div className="flex flex-wrap gap-1 justify-center">
                {sizeVariants.map((v) => {
                  const sizeAttr = v.product_variant_attrs?.find((a) =>
                    a.attr_name.toLowerCase().includes('ukuran')
                  )
                  const sizeLabel = sizeAttr ? sizeAttr.attr_value : v.name
                  const isCurrentAdding = isAdding === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isAdding !== null}
                      aria-busy={isCurrentAdding}
                      aria-label={`Tambah ukuran ${sizeLabel} ke keranjang`}
                      onClick={(e) => handleQuickAdd(e, v)}
                      className="px-2 py-0.5 bg-white hover:bg-brand-gold hover:text-white text-[9px] font-heading font-bold uppercase tracking-wider text-brand-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none min-w-[28px] border border-neutral-100 flex items-center justify-center cursor-pointer"
                    >
                      {isCurrentAdding ? (
                        <div
                          className="w-2.5 h-2.5 border border-brand-black border-t-transparent animate-spin rounded-full"
                          aria-hidden="true"
                        />
                      ) : (
                        sizeLabel
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <span className="text-[9px] font-heading font-medium uppercase tracking-widest text-white py-1 text-center w-full block">
              Lihat Detail
            </span>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="flex flex-col pt-4 pb-4 px-3 space-y-1">
        {/* Category Name */}
        {product.categories && (
          <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            {product.categories.name}
          </span>
        )}

        {/* Product Title */}
        <Link href={productUrl} prefetch={true} className="block">
          <h3 className="text-xs font-heading font-medium uppercase tracking-wider text-brand-black hover:text-brand-gray transition-colors truncate">
            {product.name}
          </h3>
        </Link>

        {/* Price Tag */}
        <div className="flex items-center space-x-2 pt-0.5">
          <span className="text-xs font-sans font-semibold text-brand-black">
            {minPrice !== maxPrice
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
})
