'use client'

import React, { useState, useEffect } from 'react'

import { SmartLink as Link } from '@/shared/components'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ProductDetailItem, ProductVariant } from '@/modules/products/types'
import {
  ProductGallery,
  ProductThumbnails,
  MarketplaceLinks,
  ReviewSection,
  ProductInfoSection,
  ProductAccordionTabs,
  ProductStickyAction,
  ProductSizeGuideModal,
} from '@/modules/products/components'
import { PageContainer, CustomToast } from '@/shared/components'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'
import { useMarket } from '@/shared/stores/marketStore'
import {
  useRecentlyViewedStore,
  RecentlyViewedState,
} from '@/modules/products/stores/recentlyViewedStore'
import { trackViewContent, trackAddToCart } from '@/lib/analytics'

import toast from 'react-hot-toast'

interface ProductDetailClientProps {
  product: ProductDetailItem
  relatedProductsNode?: React.ReactNode
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 },
  },
}

export function ProductDetailClient({
  product,
  relatedProductsNode,
}: ProductDetailClientProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'
  const addItem = useCartStore((state) => state.addItem)
  const setCartDrawerOpen = useCartStore((state) => state.setCartDrawerOpen)

  const liked = useWishlistStore((state) => state.productIds.includes(product.id))
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist)

  const addProductToRecentlyViewed = useRecentlyViewedStore(
    (s: RecentlyViewedState) => s.addProduct
  )
  const router = useRouter()

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)

  // B3-2: Filter flash sale price overlay based on active market
  const effectiveProduct = React.useMemo<ProductDetailItem>(() => {
    const resolvedVariants = (product.product_variants || []).map((v) => {
      if (
        v.flash_sale_target_market &&
        v.flash_sale_target_market !== 'ALL' &&
        v.flash_sale_target_market !== market &&
        v.regular_price !== undefined
      ) {
        return {
          ...v,
          price: v.regular_price,
          compare_price: v.regular_compare_price ?? null,
        }
      }
      return v
    })
    return {
      ...product,
      product_variants: resolvedVariants,
    }
  }, [product, market])

  const effectiveSelectedVariant = React.useMemo<ProductVariant | null>(() => {
    if (!selectedVariant) return null
    return (
      effectiveProduct.product_variants.find((v) => v.id === selectedVariant.id) || selectedVariant
    )
  }, [selectedVariant, effectiveProduct.product_variants])

  const [activeImage, setActiveImage] = useState<string | null>(
    product.product_images.find((img) => img.is_primary)?.url ||
      product.product_images[0]?.url ||
      null
  )

  const handleToggleWishlist = async () => {
    try {
      await toggleWishlist(product.id, selectedVariant?.id)
      if (liked) {
        toast.success(isMY ? 'Removed from wishlist.' : 'Dihapus dari wishlist.')
      } else {
        toast.custom((t) => (
          <CustomToast
            t={t}
            title={isMY ? "Added to Wishlist" : "Ditambahkan ke Wishlist"}
            subtitle={`${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}`}
            description={isMY ? "Saved to your dream list." : "Tersimpan di daftar impian Anda."}
            imageUrl={product.product_images[0]?.url}
            actionLabel={isMY ? "View" : "Lihat"}
            onAction={() => router.push('/wishlist')}
          />
        ))
      }
    } catch {
      toast.error(isMY ? 'Failed to update wishlist.' : 'Gagal memperbarui wishlist.')
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowStickyBar(true)
      } else {
        setShowStickyBar(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 1. Record viewed item in recently viewed list on load
  useEffect(() => {
    // Find representative price (first active variant price)
    const firstVariant = effectiveProduct.product_variants[0]
    const basePrice = firstVariant?.price ? Number(firstVariant.price) : 0
    const baseComparePrice = firstVariant?.compare_price ? Number(firstVariant.compare_price) : null

    addProductToRecentlyViewed({
      id: effectiveProduct.id,
      name: effectiveProduct.name,
      slug: effectiveProduct.slug,
      price: basePrice,
      comparePrice: baseComparePrice,
      imageUrl: effectiveProduct.product_images[0]?.url || null,
    })

    // Track ViewContent event with strictly locked IDR currency
    trackViewContent({
      id: effectiveProduct.id,
      name: effectiveProduct.name,
      price: basePrice,
      category: effectiveProduct.categories?.name,
    })
  }, [effectiveProduct, addProductToRecentlyViewed])

  // 2. Add item to cart handler
  const handleAddToCart = async () => {
    if (!effectiveSelectedVariant) {
      toast.error(isMY ? 'Please select a variant (size/color) first.' : 'Silakan pilih varian (ukuran/warna) terlebih dahulu.')
      return
    }

    if (effectiveSelectedVariant.stock <= 0) {
      toast.error(isMY ? 'This variant is out of stock.' : 'Stok untuk varian ini habis.')
      return
    }

    setIsAdding(true)
    try {
      const cartItem = {
        variantId: effectiveSelectedVariant.id,
        productName: effectiveProduct.name,
        variantName: effectiveSelectedVariant.name,
        name: effectiveProduct.name,
        sku: effectiveSelectedVariant.sku,
        price: Number(effectiveSelectedVariant.price),
        comparePrice: effectiveSelectedVariant.compare_price ? Number(effectiveSelectedVariant.compare_price) : null,
        imageUrl: effectiveProduct.product_images[0]?.url || null,
        slug: effectiveProduct.slug,
        stock: effectiveSelectedVariant.stock,
      }

      await addItem(cartItem, quantity)

      // Track AddToCart event with strictly locked IDR currency
      trackAddToCart(
        {
          id: effectiveProduct.id,
          name: effectiveProduct.name,
          price: Number(effectiveSelectedVariant.price),
          variant: effectiveSelectedVariant.name,
          category: effectiveProduct.categories?.name,
        },
        quantity
      )
      toast.custom((t) => (
        <CustomToast
          t={t}
          title={isMY ? "Added to Bag!" : "Berhasil Ditambahkan!"}
          subtitle={effectiveProduct.name}
          description={isMY ? `Variant: ${effectiveSelectedVariant.name} • Qty: ${quantity}` : `Varian: ${effectiveSelectedVariant.name} • Qty: ${quantity}`}
          imageUrl={effectiveProduct.product_images[0]?.url}
          actionLabel={isMY ? "View" : "Lihat"}
          onAction={() => setCartDrawerOpen(true)}
        />
      ))
    } catch {
      toast.error(isMY ? 'Failed to add to bag.' : 'Gagal menambahkan ke keranjang.')
    } finally {
      setIsAdding(false)
    }
  }

  // 2b. Buy now handler (adds to cart and redirects to checkout)
  const handleBuyNow = async () => {
    if (!effectiveSelectedVariant) {
      toast.error(isMY ? 'Please select a variant (size/color) first.' : 'Silakan pilih varian (ukuran/warna) terlebih dahulu.')
      return
    }

    if (effectiveSelectedVariant.stock <= 0) {
      toast.error(isMY ? 'This variant is out of stock.' : 'Stok untuk varian ini habis.')
      return
    }

    setIsBuying(true)
    try {
      const cartItem = {
        variantId: effectiveSelectedVariant.id,
        productName: effectiveProduct.name,
        variantName: effectiveSelectedVariant.name,
        name: effectiveProduct.name,
        sku: effectiveSelectedVariant.sku,
        price: Number(effectiveSelectedVariant.price),
        comparePrice: effectiveSelectedVariant.compare_price ? Number(effectiveSelectedVariant.compare_price) : null,
        imageUrl: effectiveProduct.product_images[0]?.url || null,
        slug: effectiveProduct.slug,
        stock: effectiveSelectedVariant.stock,
      }

      await addItem(cartItem, quantity)

      // Track AddToCart event with strictly locked IDR currency
      trackAddToCart(
        {
          id: effectiveProduct.id,
          name: effectiveProduct.name,
          price: Number(effectiveSelectedVariant.price),
          variant: effectiveSelectedVariant.name,
          category: effectiveProduct.categories?.name,
        },
        quantity
      )
      router.push('/checkout')
    } catch {
      toast.error(isMY ? 'Failed to process purchase.' : 'Gagal memproses pembelian.')
    } finally {
      setIsBuying(false)
    }
  }

  const handleIncrement = () => {
    if (!effectiveSelectedVariant) return
    setQuantity((prev) => Math.min(prev + 1, effectiveSelectedVariant.stock))
  }

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  // Calculate pricing displays based on selections
  const variants = effectiveProduct.product_variants || []
  const minPrice = variants.length > 0 ? Math.min(...variants.map((v: ProductVariant) => Number(v.price))) : 0
  const maxPrice = variants.length > 0 ? Math.max(...variants.map((v: ProductVariant) => Number(v.price))) : 0

  return (
    <div className="bg-brand-cream min-h-screen pb-24 md:pb-10 font-sans">
      <PageContainer className="py-10 md:py-12 page-content">
        {/* Breadcrumbs */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] uppercase tracking-wider text-neutral-500 mb-8 font-sans font-bold"
        >
          <Link href="/" className="hover:text-brand-plum transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/produk" className="hover:text-brand-plum transition-colors">
            {isMY ? 'Shop' : 'Produk'}
          </Link>
          <span>/</span>
          {product.categories && (
            <>
              <Link
                href={`/kategori/${product.categories.slug}`}
                className="hover:text-brand-plum transition-colors"
              >
                {product.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-brand-plum font-bold truncate max-w-xs">{product.name}</span>
        </motion.nav>

        {/* Main Grid: Left Gallery, Right Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Left Gallery column (takes 7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 space-y-8"
          >
            <ProductGallery
              images={product.product_images}
              productName={product.name}
              selectedVariantId={selectedVariant?.id || null}
              activeImage={activeImage}
              setActiveImage={setActiveImage}
              hideThumbnailsOnDesktop={true}
            />

            <div className="hidden md:block space-y-8">
              <motion.div variants={itemVariants}>
                <MarketplaceLinks links={effectiveProduct.product_marketplace_links} />
              </motion.div>
              <ProductAccordionTabs product={effectiveProduct} selectedVariant={effectiveSelectedVariant} />
            </div>
          </motion.div>

          {/* Right sticky Details column (takes 5 cols) */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.06,
                },
              },
            }}
            className="md:col-span-5 md:sticky md:top-24 space-y-6"
          >
            <ProductInfoSection
              product={effectiveProduct}
              selectedVariant={effectiveSelectedVariant}
              minPrice={minPrice}
              maxPrice={maxPrice}
              quantity={quantity}
              liked={liked}
              isAdding={isAdding}
              isBuying={isBuying}
              onSizeGuideOpen={() => setIsSizeGuideOpen(true)}
              onVariantSelect={(variant) => {
                setSelectedVariant(variant)
                setQuantity(1)
              }}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              thumbnailsNode={
                <ProductThumbnails
                  images={effectiveProduct.product_images}
                  activeImage={activeImage}
                  setActiveImage={setActiveImage}
                  productName={effectiveProduct.name}
                />
              }
            />

            <div className="md:hidden space-y-6 pt-4 border-t border-neutral-100">
              <motion.div variants={itemVariants}>
                <MarketplaceLinks links={effectiveProduct.product_marketplace_links} />
              </motion.div>
              <ProductAccordionTabs product={effectiveProduct} selectedVariant={effectiveSelectedVariant} />
            </div>
          </motion.div>
        </div>

        {/* Reviews Section at the bottom */}
        <ReviewSection productId={effectiveProduct.id} ratingSummary={effectiveProduct.product_rating_summary} />

        {/* Related Products Section (Loaded asynchronously via Server Component) */}
        {relatedProductsNode}
      </PageContainer>

      <ProductStickyAction
        showStickyBar={showStickyBar}
        product={effectiveProduct}
        selectedVariant={effectiveSelectedVariant}
        minPrice={minPrice}
        isAdding={isAdding}
        isBuying={isBuying}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <ProductSizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        productSizeGuide={product.size_guide}
        productSizeGuideInch={product.size_guide_inch}
      />
    </div>
  )
}
