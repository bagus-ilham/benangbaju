'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Button, Card } from '@/components/shared'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useRecentlyViewedStore, RecentlyViewedState } from '@/stores/recentlyViewedStore'
import { RelatedProducts } from './RelatedProducts' // Similar products slider
import { formatIDR, cn } from '@/lib/utils'
import { Heart, Plus, Minus, Shield, RefreshCw, Truck } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProductDetailClientProps {
  product: ProductDetailItem
  relatedProducts: ProductListItem[]
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart()
  const { isLiked, toggleWishlist } = useWishlist()
  const addProductToRecentlyViewed = useRecentlyViewedStore((s: RecentlyViewedState) => s.addProduct)
  const router = useRouter()

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'care'>('details')
  const [isAdding, setIsAdding] = useState(false)
  const [isBuying, setIsBuying] = useState(false)

  const liked = isLiked(product.id)

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
        name: product.name,
        sku: selectedVariant.sku,
        price: Number(selectedVariant.price),
        comparePrice: selectedVariant.compare_price ? Number(selectedVariant.compare_price) : null,
        imageUrl: product.product_images[0]?.url || null,
        slug: product.slug,
        stock: selectedVariant.stock,
      }

      await addItem(cartItem, quantity)
      toast.success(`${product.name} (${selectedVariant.name}) dimasukkan ke keranjang.`)
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
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-[10px] uppercase tracking-wider text-neutral-400 mb-8 font-heading">
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
          <span className="text-brand-black font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Grid: Left Gallery, Right Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* Left Gallery column (takes 7 cols) */}
          <div className="md:col-span-7">
            <ProductGallery 
              images={product.product_images} 
              productName={product.name} 
              selectedVariantId={selectedVariant?.id || null}
            />
          </div>

          {/* Right sticky Details column (takes 5 cols) */}
          <div className="md:col-span-5 md:sticky md:top-24 space-y-6">
            
            {/* Title, Category & Price */}
            <div className="space-y-2">
              {product.categories && (
                <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
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
            </div>

            {/* Description intro */}
            {product.short_description && (
              <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* Varian Picker */}
            <VariantPicker
              variants={product.product_variants}
              selectedVariantId={selectedVariant?.id || null}
              onVariantSelect={(variant: ProductVariant | null) => {
                setSelectedVariant(variant)
                // reset qty to 1 when changing variants
                setQuantity(1)
              }}
            />

            {/* Varian Stock indicator */}
            {selectedVariant && (
              <div className="text-[11px] text-neutral-500 font-sans">
                {selectedVariant.stock > 0 ? (
                  <span>Stok Tersedia: <strong className="text-brand-black">{selectedVariant.stock} pcs</strong></span>
                ) : (
                  <span className="text-red-500 font-semibold">Stok Habis</span>
                )}
              </div>
            )}

            {/* Actions: Quantity & Add to Cart & Wishlist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3">
                {/* Quantity adjustments */}
                <div className="flex items-center border border-neutral-200 bg-white">
                  <button
                    onClick={handleDecrement}
                    className="p-3 text-neutral-500 hover:text-brand-black transition-colors"
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-4 text-xs font-sans font-semibold text-brand-black w-8 text-center select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="p-3 text-neutral-500 hover:text-brand-black transition-colors"
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Wishlist Heart button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="p-4 border border-neutral-200 hover:border-brand-black bg-white transition-all text-neutral-500 hover:text-brand-black"
                  aria-label={liked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
                >
                  <Heart className={cn('h-4 w-4', liked && 'fill-red-500 text-red-500')} />
                </button>
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
            </div>

            {/* Info Badges (Shipping / Return / Guarantee) */}
            <div className="grid grid-cols-3 gap-2 border-t border-b border-neutral-100 py-4">
              <div className="flex flex-col items-center text-center space-y-1">
                <Truck className="h-4 w-4 text-neutral-400" />
                <span className="text-[9px] uppercase tracking-wider font-heading font-medium text-brand-black">Flat Shipping</span>
                <span className="text-[8px] text-neutral-400 font-sans">Tarif murah per zona</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-1">
                <RefreshCw className="h-4 w-4 text-neutral-400" />
                <span className="text-[9px] uppercase tracking-wider font-heading font-medium text-brand-black">7 Hari Retur</span>
                <span className="text-[8px] text-neutral-400 font-sans">Bebas tukar ukuran</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-1">
                <Shield className="h-4 w-4 text-neutral-400" />
                <span className="text-[9px] uppercase tracking-wider font-heading font-medium text-brand-black">Premium Quality</span>
                <span className="text-[8px] text-neutral-400 font-sans">Bahan terkurasi</span>
              </div>
            </div>

            {/* Marketplace Purchase Links */}
            <MarketplaceLinks links={product.product_marketplace_links} />

            {/* Accordion Tabs (Details, Shipping, Care Guides) */}
            <div className="space-y-2 pt-2">
              <div className="flex border-b border-neutral-200 font-heading text-[10px] font-medium uppercase tracking-widest">
                <button
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'pb-2 pr-4 transition-all border-b-2',
                    activeTab === 'details' ? 'border-brand-black text-brand-black' : 'border-transparent text-neutral-400'
                  )}
                >
                  Detail
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={cn(
                    'pb-2 px-4 transition-all border-b-2',
                    activeTab === 'shipping' ? 'border-brand-black text-brand-black' : 'border-transparent text-neutral-400'
                  )}
                >
                  Panduan
                </button>
                <button
                  onClick={() => setActiveTab('care')}
                  className={cn(
                    'pb-2 px-4 transition-all border-b-2',
                    activeTab === 'care' ? 'border-brand-black text-brand-black' : 'border-transparent text-neutral-400'
                  )}
                >
                  Perawatan
                </button>
              </div>

              <div className="pt-2 text-xs text-neutral-500 font-sans leading-relaxed">
                {activeTab === 'details' && (
                  <div className="space-y-2">
                    <p>{product.description || 'Tidak ada deskripsi tambahan.'}</p>
                    {selectedVariant && (
                      <p className="text-[10px] text-neutral-400 font-sans">SKU: {selectedVariant.sku}</p>
                    )}
                  </div>
                )}
                {activeTab === 'shipping' && (
                  <div className="space-y-1">
                    <p><strong>Pengiriman:</strong> Pesanan dikirimkan dalam 1-2 hari kerja setelah pembayaran dikonfirmasi.</p>
                    <p><strong>Ukuran:</strong> Pastikan mengukur detail ukuran badan sebelum membeli.</p>
                  </div>
                )}
                {activeTab === 'care' && (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Cuci dengan suhu dingin menggunakan warna senada</li>
                    <li>Hindari pemutih pakaian</li>
                    <li>Setrika dengan suhu rendah jika diperlukan</li>
                  </ul>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section at the bottom */}
        <ReviewSection productId={product.id} ratingSummary={product.product_rating_summary} />

        {/* Related Products Section */}
        <RelatedProducts products={relatedProducts} />

      </div>
    </div>
  )
}
