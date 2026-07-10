'use client'

import React, { useState, useEffect } from 'react'

import { SmartLink as Link } from '@/shared/components'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ProductDetailItem, ProductVariant } from '@/modules/products/types'
import {
  ProductGallery,
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
import {
  useRecentlyViewedStore,
  RecentlyViewedState,
} from '@/modules/products/stores/recentlyViewedStore'

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

  const handleToggleWishlist = async () => {
    try {
      await toggleWishlist(product.id)
      if (liked) {
        toast.success('Dihapus dari wishlist.')
      } else {
        toast.custom((t) => (
          <CustomToast
            t={t}
            title="Ditambahkan ke Wishlist"
            subtitle={product.name}
            description="Tersimpan di daftar impian Anda."
            imageUrl={product.product_images[0]?.url}
            actionLabel="Lihat"
            onAction={() => router.push('/wishlist')}
          />
        ))
      }
    } catch {
      toast.error('Gagal memperbarui wishlist.')
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
    const basePrice = product.product_variants[0]?.price
      ? Number(product.product_variants[0].price)
      : 0

    addProductToRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: basePrice,
      imageUrl: product.product_images[0]?.url || null,
    })
  }, [product, addProductToRecentlyViewed])

  // 2. Add item to cart handler
  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Silakan pilih varian (ukuran/warna) terlebih dahulu.')
      return
    }

    if (selectedVariant.stock <= 0) {
      toast.error('Stok untuk varian ini habis.')
      return
    }

    setIsAdding(true)
    try {
      const cartItem = {
        variantId: selectedVariant.id,
        productName: product.name,
        variantName: selectedVariant.name,
        name: product.name,
        sku: selectedVariant.sku,
        price: Number(selectedVariant.price),
        comparePrice: selectedVariant.compare_price ? Number(selectedVariant.compare_price) : null,
        imageUrl: product.product_images[0]?.url || null,
        slug: product.slug,
        stock: selectedVariant.stock,
      }

      await addItem(cartItem, quantity)
      toast.custom((t) => (
        <CustomToast
          t={t}
          title="Berhasil Ditambahkan!"
          subtitle={product.name}
          description={`Varian: ${selectedVariant.name} • Qty: ${quantity}`}
          imageUrl={product.product_images[0]?.url}
          actionLabel="Lihat"
          onAction={() => setCartDrawerOpen(true)}
        />
      ))
    } catch {
      toast.error('Gagal menambahkan ke keranjang.')
    } finally {
      setIsAdding(false)
    }
  }

  // 2b. Buy now handler (adds to cart and redirects to checkout)
  const handleBuyNow = async () => {
    if (!selectedVariant) {
      toast.error('Silakan pilih varian (ukuran/warna) terlebih dahulu.')
      return
    }

    if (selectedVariant.stock <= 0) {
      toast.error('Stok untuk varian ini habis.')
      return
    }

    setIsBuying(true)
    try {
      const cartItem = {
        variantId: selectedVariant.id,
        productName: product.name,
        variantName: selectedVariant.name,
        name: product.name,
        sku: selectedVariant.sku,
        price: Number(selectedVariant.price),
        comparePrice: selectedVariant.compare_price ? Number(selectedVariant.compare_price) : null,
        imageUrl: product.product_images[0]?.url || null,
        slug: product.slug,
        stock: selectedVariant.stock,
      }

      await addItem(cartItem, quantity)
      router.push('/checkout')
    } catch {
      toast.error('Gagal memproses pembelian.')
    } finally {
      setIsBuying(false)
    }
  }

  const handleIncrement = () => {
    if (!selectedVariant) return
    setQuantity((prev) => Math.min(prev + 1, selectedVariant.stock))
  }

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  // Calculate pricing displays based on selections
  const minPrice = Math.min(...product.product_variants.map((v: ProductVariant) => Number(v.price)))
  const maxPrice = Math.max(...product.product_variants.map((v: ProductVariant) => Number(v.price)))

  return (
    <div className="bg-white min-h-screen pb-24 md:pb-10">
      <PageContainer className="py-10 md:py-12 page-content">
        {/* Breadcrumbs */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] uppercase tracking-wider text-neutral-400 mb-8 font-heading"
        >
          <Link href="/" className="hover:text-brand-black transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/produk" className="hover:text-brand-black transition-colors">
            Produk
          </Link>
          <span>/</span>
          {product.categories && (
            <>
              <Link
                href={`/kategori/${product.categories.slug}`}
                className="hover:text-brand-black transition-colors"
              >
                {product.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-brand-gold font-semibold truncate max-w-xs">{product.name}</span>
        </motion.nav>

        {/* Main Grid: Left Gallery, Right Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Left Gallery column (takes 7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7"
          >
            <ProductGallery
              images={product.product_images}
              productName={product.name}
              selectedVariantId={selectedVariant?.id || null}
            />
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
              product={product}
              selectedVariant={selectedVariant}
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
            />

            <motion.div variants={itemVariants}>
              <MarketplaceLinks links={product.product_marketplace_links} />
            </motion.div>

            <ProductAccordionTabs product={product} selectedVariant={selectedVariant} />
          </motion.div>
        </div>

        {/* Reviews Section at the bottom */}
        <ReviewSection productId={product.id} ratingSummary={product.product_rating_summary} />

        {/* Related Products Section (Loaded asynchronously via Server Component) */}
        {relatedProductsNode}
      </PageContainer>

      <ProductStickyAction
        showStickyBar={showStickyBar}
        product={product}
        selectedVariant={selectedVariant}
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
      />
    </div>
  )
}
