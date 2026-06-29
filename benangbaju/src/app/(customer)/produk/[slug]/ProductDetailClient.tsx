'use client'

import React, { useState, useEffect, Suspense, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ProductDetailItem,
  ProductVariant,
  ProductListItem
} from '@/services/products'
import {
  ProductGallery,
  VariantPicker,
  MarketplaceLinks,
  ReviewSection
} from '@/components/product'
import { Button, PageContainer } from '@/components/shared'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useRecentlyViewedStore, RecentlyViewedState } from '@/stores/recentlyViewedStore'
import { RelatedProducts } from './RelatedProducts' // Similar products slider
import { formatIDR, cn, formatProductDescription } from '@/lib/utils'
import { Heart, Plus, Minus, Shield, RefreshCw, Truck, X } from 'lucide-react'
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
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 }
  }
}


export function ProductDetailClient({ product, relatedProductsNode }: ProductDetailClientProps) : React.JSX.Element {
  const addItem = useCartStore(state => state.addItem)
  const setCartDrawerOpen = useCartStore(state => state.setCartDrawerOpen)
  
  const liked = useWishlistStore(state => state.productIds.includes(product.id))
  const toggleWishlist = useWishlistStore(state => state.toggleWishlist)
  
  const addProductToRecentlyViewed = useRecentlyViewedStore((s: RecentlyViewedState) => s.addProduct)
  const router = useRouter()

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'care'>('details')
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
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-sm w-full bg-white shadow-2xl border border-neutral-100 flex pointer-events-auto border-t-2 border-t-brand-gold`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  {product.product_images[0]?.url ? (
                    <div className="relative aspect-[3/4] w-10 border border-neutral-100 overflow-hidden">
                      <Image
                        className="object-cover"
                        src={product.product_images[0].url}
                        alt={product.name}
                        fill
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400 font-sans">
                      No Img
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-gold">
                    Ditambahkan ke Wishlist
                  </p>
                  <p className="text-[11px] font-heading font-medium uppercase text-brand-black line-clamp-1 mt-0.5">
                    {product.name}
                  </p>
                  <p className="text-[9px] text-neutral-400 uppercase font-sans mt-0.5">
                    Tersimpan di daftar impian Anda.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-neutral-100">
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  router.push('/wishlist')
                }}
                className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-xs font-heading font-bold uppercase tracking-wider text-brand-gold hover:text-brand-gold-light focus:outline-none cursor-pointer"
              >
                Lihat
              </button>
            </div>
          </div>
        ))
      }
    } catch (err) {
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
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-sm w-full bg-white shadow-2xl border border-neutral-100 flex pointer-events-auto border-t-2 border-t-brand-gold`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                {product.product_images[0]?.url ? (
                  <div className="relative aspect-[3/4] w-10 border border-neutral-100 overflow-hidden">
                    <Image
                      className="object-cover"
                      src={product.product_images[0].url}
                      alt={product.name}
                      fill
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400 font-sans">
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
                  Varian: {selectedVariant.name} &bull; Qty: {quantity}
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
    } catch (error) {
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
    } catch (error) {
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
          <Link href="/" className="hover:text-brand-black transition-colors">Home</Link>
          <span>/</span>
          <Link href="/produk" className="hover:text-brand-black transition-colors">Produk</Link>
          <span>/</span>
          {product.categories && (
            <>
              <Link href={`/kategori/${product.categories.slug}`} className="hover:text-brand-black transition-colors">
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
                  staggerChildren: 0.06
                }
              }
            }}
            className="md:col-span-5 md:sticky md:top-24 space-y-6"
          >
            
            {/* Title, Category & Price */}
            <motion.div variants={itemVariants} className="space-y-2">
              {product.categories && (
                <span className="text-[10px] uppercase tracking-[0.25em] font-heading font-medium text-brand-gold">
                  {product.categories.name}
                </span>
              )}
              <h1 className="text-xl lg:text-3xl font-heading font-light uppercase tracking-wider text-brand-black leading-tight">
                {product.name}
              </h1>

              {/* Price display */}
              <div className="flex items-baseline space-x-3 pt-2">
                <span className="text-lg lg:text-xl font-sans font-semibold text-brand-black">
                  {selectedVariant
                    ? formatIDR(selectedVariant.price)
                    : minPrice === maxPrice
                    ? formatIDR(minPrice)
                    : `${formatIDR(minPrice)} - ${formatIDR(maxPrice)}`}
                </span>
                
                {/* Compare Price */}
                {selectedVariant?.compare_price && (
                  <span className="text-xs text-neutral-400 line-through font-sans">
                    {formatIDR(selectedVariant.compare_price)}
                  </span>
                )}
                
                {!selectedVariant && product.product_variants[0]?.compare_price && (
                  <span className="text-xs text-neutral-400 line-through font-sans">
                    {formatIDR(product.product_variants[0].compare_price)}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Description intro */}
            {product.short_description && (
              <motion.p variants={itemVariants} className="text-xs text-neutral-500 font-sans leading-relaxed whitespace-pre-line">
                {product.short_description}
              </motion.p>
            )}

            {/* Varian Picker */}
            <motion.div variants={itemVariants} className="relative">
              {product.product_variants.some(v => v.product_variant_attrs?.some(a => a.attr_name.toLowerCase().includes('ukuran'))) && (
                <div className="flex justify-end absolute top-1 right-0 z-10">
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[9px] uppercase tracking-wider font-heading font-semibold text-brand-gold hover:text-brand-gold-light transition-colors underline underline-offset-2 cursor-pointer"
                  >
                    Panduan Ukuran
                  </button>
                </div>
              )}
              <VariantPicker
                variants={product.product_variants}
                selectedVariantId={selectedVariant?.id || null}
                onVariantSelect={(variant: ProductVariant | null) => {
                  setSelectedVariant(variant)
                  // reset qty to 1 when changing variants
                  setQuantity(1)
                }}
              />
            </motion.div>

            {/* Varian Stock indicator */}
            {selectedVariant && (
              <motion.div variants={itemVariants} className="text-[11px] text-neutral-500 font-sans">
                {selectedVariant.stock > 0 ? (
                  <span>Stok Tersedia: <strong className="text-brand-black">{selectedVariant.stock} pcs</strong></span>
                ) : (
                  <span className="text-red-500 font-semibold">Stok Habis</span>
                )}
              </motion.div>
            )}

            {/* Actions: Quantity & Add to Cart & Wishlist */}
            <motion.div variants={itemVariants} className="space-y-3 pt-2">
              <div className="flex items-center space-x-3">
                {/* Quantity adjustments */}
                <div className="flex items-center border border-neutral-200 bg-white gold-border-hover">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDecrement}
                    className="p-3 text-neutral-500 hover:text-brand-black transition-colors"
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <Minus className="h-3 w-3" />
                  </motion.button>
                  <span className="px-4 text-xs font-sans font-semibold text-brand-black w-8 text-center select-none">
                    {quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleIncrement}
                    className="p-3 text-neutral-500 hover:text-brand-black transition-colors"
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <Plus className="h-3 w-3" />
                  </motion.button>
                </div>

                {/* Wishlist Heart button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={handleToggleWishlist}
                  className="p-4 border border-neutral-200 hover:border-brand-gold bg-white transition-all text-neutral-500 hover:text-brand-gold relative gold-border-hover"
                  aria-label={liked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
                >
                  <Heart className={cn('h-4 w-4 transition-colors duration-300', liked && 'fill-red-500 text-red-500')} />
                </motion.button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full">
                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="flex-1"
                  isLoading={isAdding}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                >
                  {!selectedVariant
                    ? 'Pilih Varian'
                    : selectedVariant.stock === 0
                    ? 'Stok Habis'
                    : 'Tambah Ke Keranjang'}
                </Button>

                {/* Buy Now Button */}
                <Button
                  onClick={handleBuyNow}
                  variant="primary"
                  className="flex-1"
                  isLoading={isBuying}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                >
                  {!selectedVariant
                    ? 'Pilih Varian'
                    : selectedVariant.stock === 0
                    ? 'Stok Habis'
                    : 'Beli Sekarang'}
                </Button>
              </div>
            </motion.div>

            {/* Info Badges (Shipping / Return / Guarantee) */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 border border-neutral-100 py-4 px-2 card-hover-lift gold-border-hover bg-brand-cream/30">
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center space-y-1 cursor-default group"
              >
                <Truck className="h-4 w-4 text-brand-gold/70 group-hover:text-brand-gold transition-colors" />
                <span className="text-[9px] uppercase tracking-wider font-heading font-medium text-brand-black">Ongkir Flat</span>
                <span className="text-[8px] text-neutral-400 font-sans">Tarif murah per zona</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center space-y-1 cursor-default group"
              >
                <RefreshCw className="h-4 w-4 text-brand-gold/70 group-hover:text-brand-gold transition-colors" />
                <span className="text-[9px] uppercase tracking-wider font-heading font-medium text-brand-black">7 Hari Retur</span>
                <span className="text-[8px] text-neutral-400 font-sans">Bebas tukar ukuran</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center space-y-1 cursor-default group"
              >
                <Shield className="h-4 w-4 text-brand-gold/70 group-hover:text-brand-gold transition-colors" />
                <span className="text-[9px] uppercase tracking-wider font-heading font-medium text-brand-black">Kualitas Premium</span>
                <span className="text-[8px] text-neutral-400 font-sans">Bahan terkurasi</span>
              </motion.div>
            </motion.div>

            {/* Marketplace Purchase Links */}
            <motion.div variants={itemVariants}>
              <MarketplaceLinks links={product.product_marketplace_links} />
            </motion.div>

            {/* Accordion Tabs (Details, Shipping, Care Guides) */}
            <motion.div variants={itemVariants} className="space-y-2 pt-2">
              <div className="flex border-b border-neutral-200 font-heading text-[10px] font-medium uppercase tracking-widest relative">
                <button
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'pb-2 pr-4 transition-colors relative z-10',
                    activeTab === 'details' ? 'text-brand-black' : 'text-neutral-400'
                  )}
                >
                  Detail
                  {activeTab === 'details' && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-4 h-[2px] bg-brand-gold"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={cn(
                    'pb-2 px-4 transition-colors relative z-10',
                    activeTab === 'shipping' ? 'text-brand-black' : 'text-neutral-400'
                  )}
                >
                  Panduan
                  {activeTab === 'shipping' && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand-gold"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('care')}
                  className={cn(
                    'pb-2 px-4 transition-colors relative z-10',
                    activeTab === 'care' ? 'text-brand-black' : 'text-neutral-400'
                  )}
                >
                  Perawatan
                  {activeTab === 'care' && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand-gold"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              <div className="pt-2 text-xs text-neutral-500 font-sans leading-relaxed min-h-[80px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === 'details' && (
                      <div className="space-y-2">
                        <p className="whitespace-pre-line">
                          {formatProductDescription(product.description)}
                        </p>
                        {selectedVariant && (
                          <p className="text-[10px] text-neutral-400 font-sans">SKU: {selectedVariant.sku}</p>
                        )}
                      </div>
                    )}
                    {activeTab === 'shipping' && (
                      <div className="space-y-1 whitespace-pre-line">
                        {product.size_guide ? (
                          formatProductDescription(product.size_guide)
                        ) : (
                          <>
                            <p><strong>Pengiriman:</strong> Pesanan dikirimkan dalam 1-2 hari kerja setelah pembayaran dikonfirmasi.</p>
                            <p><strong>Ukuran:</strong> Pastikan mengukur detail ukuran badan sebelum membeli.</p>
                          </>
                        )}
                      </div>
                    )}
                    {activeTab === 'care' && (
                      <div className="space-y-1 whitespace-pre-line">
                        {product.care_guide ? (
                          product.care_guide.replace(/<br\s*\/?>/gi, '\n')
                        ) : (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Cuci dengan suhu dingin menggunakan warna senada</li>
                            <li>Hindari pemutih pakaian</li>
                            <li>Setrika dengan suhu rendah jika diperlukan</li>
                          </ul>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* Reviews Section at the bottom */}
        <ReviewSection productId={product.id} ratingSummary={product.product_rating_summary} />

        {/* Related Products Section (Loaded asynchronously via Server Component) */}
        {relatedProductsNode}
      </PageContainer>

      {/* Dynamic Premium Sticky Bar (Desktop & Mobile) */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-neutral-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] py-3 px-4 md:py-4 md:px-8"
          >
            <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
              {/* Product Info (Desktop/Tablet) */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="relative w-8 h-10 bg-neutral-100 border border-neutral-100 flex-shrink-0">
                  <Image
                    src={product.product_images.find((img) => img.is_primary)?.url || product.product_images[0]?.url || ''}
                    alt={product.name}
                    className="object-cover"
                    fill
                    sizes="32px"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-heading font-semibold uppercase tracking-wider text-brand-black line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-xs font-sans font-semibold text-brand-gold mt-0.5">
                    {selectedVariant ? formatIDR(selectedVariant.price) : formatIDR(minPrice)}
                  </p>
                </div>
              </div>

              {/* Variant and Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                {/* Small variant display or picker dropdown */}
                {product.product_variants.length > 0 && (
                  <div className="text-xs font-sans text-neutral-500">
                    {selectedVariant ? (
                      <span>Varian: <strong className="text-brand-black">{selectedVariant.name}</strong></span>
                    ) : (
                      <span className="italic text-neutral-400">Pilih varian di atas</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    size="sm"
                    className="py-2.5 px-4 text-[10px]"
                    isLoading={isAdding}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    Keranjang
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    variant="primary"
                    size="sm"
                    className="py-2.5 px-4 text-[10px]"
                    isLoading={isBuying}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    Beli
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeGuideOpen(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white p-6 shadow-2xl z-10 border border-t-4 border-t-brand-gold border-neutral-100"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-brand-black transition-colors cursor-pointer"
                aria-label="Tutup panduan ukuran"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-brand-gold">
                    Panduan
                  </span>
                  <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-brand-black">
                    Panduan Ukuran Pakaian (Size Chart)
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-sans">
                    Semua ukuran dalam centimeter (cm). Toleransi perbedaan ukuran 1-2 cm wajar terjadi.
                  </p>
                </div>

                {product.size_guide ? (
                  <div className="whitespace-pre-line text-xs text-neutral-600 font-sans leading-relaxed border border-neutral-100 p-4 bg-neutral-50/30">
                    {formatProductDescription(product.size_guide)}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10px] font-sans">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50">
                          <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">Ukuran</th>
                          <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">Lingkar Dada</th>
                          <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">Lebar Bahu</th>
                          <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">Panjang Lengan</th>
                          <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">Panjang Baju</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-600">
                        <tr className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-brand-black">S</td>
                          <td className="py-2.5 px-3">92 cm</td>
                          <td className="py-2.5 px-3">37 cm</td>
                          <td className="py-2.5 px-3">55 cm</td>
                          <td className="py-2.5 px-3">135 cm</td>
                        </tr>
                        <tr className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-brand-black">M</td>
                          <td className="py-2.5 px-3">96 cm</td>
                          <td className="py-2.5 px-3">38 cm</td>
                          <td className="py-2.5 px-3">56 cm</td>
                          <td className="py-2.5 px-3">137 cm</td>
                        </tr>
                        <tr className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-brand-black">L</td>
                          <td className="py-2.5 px-3">102 cm</td>
                          <td className="py-2.5 px-3">40 cm</td>
                          <td className="py-2.5 px-3">57 cm</td>
                          <td className="py-2.5 px-3">140 cm</td>
                        </tr>
                        <tr className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-brand-black">XL</td>
                          <td className="py-2.5 px-3">110 cm</td>
                          <td className="py-2.5 px-3">42 cm</td>
                          <td className="py-2.5 px-3">58 cm</td>
                          <td className="py-2.5 px-3">142 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-100">
                  <h4 className="text-[9px] uppercase tracking-widest font-heading font-medium text-brand-black/70 mb-1">
                    Tips Menentukan Ukuran:
                  </h4>
                  <ul className="list-disc list-inside text-[9px] text-neutral-500 space-y-1 leading-relaxed">
                    <li><strong>Lingkar Dada</strong>: Ukur di sekeliling bagian dada terlebar Anda dengan pas.</li>
                    <li><strong>Lebar Bahu</strong>: Ukur dari ujung bahu kiri ke ujung bahu kanan.</li>
                    <li><strong>Panjang Baju</strong>: Ukur secara vertikal dari pangkal leher/bahu hingga batas bawah baju yang diinginkan.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

