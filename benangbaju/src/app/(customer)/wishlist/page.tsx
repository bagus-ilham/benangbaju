'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'
import { useProducts } from '@/modules/products/hooks/useProducts'
import { ProductCard } from '@/modules/products/components/ProductCard'
import {
  Button,
  PageContainer,
  ProductGridSkeleton,
  EmptyState,
  PageHero,
} from '@/shared/components'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import toast from 'react-hot-toast'

export default function WishlistPage(): React.JSX.Element {
  const productIds = useWishlistStore((state) => state.productIds)
  const clearWishlist = useWishlistStore((state) => state.clearWishlist)

  const addItem = useCartStore((state) => state.addItem)
  const setCartDrawerOpen = useCartStore((state) => state.setCartDrawerOpen)

  const {
    data: dataRes,
    isLoading,
    isError,
  } = useProducts({
    productIds: productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000'],
    limit: 40,
  })

  const products = dataRes?.data || []
  const hasItems = productIds.length > 0 && products.length > 0

  const handleMoveAllToCart = async () => {
    if (products.length === 0) return
    try {
      toast.loading('Memindahkan produk ke keranjang...', { id: 'move-all' })
      let addedCount = 0
      for (const product of products) {
        const availableVariant =
          product.product_variants.find((v) => v.stock > 0) || product.product_variants[0]
        if (availableVariant) {
          const primaryImage =
            product.product_images?.find((img) => img.is_primary)?.url ||
            product.product_images?.[0]?.url ||
            null
          await addItem(
            {
              variantId: availableVariant.id,
              productName: product.name,
              variantName: availableVariant.name,
              name: product.name,
              sku: availableVariant.sku,
              price: Number(availableVariant.price),
              comparePrice: availableVariant.compare_price
                ? Number(availableVariant.compare_price)
                : null,
              imageUrl: primaryImage,
              slug: product.slug,
              stock: availableVariant.stock,
            },
            1
          )
          addedCount++
        }
      }
      toast.success(`${addedCount} produk dipindahkan ke keranjang!`, { id: 'move-all' })
      setCartDrawerOpen(true)
    } catch {
      toast.error('Gagal memindahkan produk.', { id: 'move-all' })
    }
  }

  if (isError) {
    return (
      <div className="bg-white min-h-screen">
        <PageHero
          eyebrow="Koleksi Disukai"
          title="Daftar Keinginan"
          subtitle="Simpan produk favorit Anda dan belanja kapan saja."
        />
        <PageContainer className="py-10 page-content">
          <EmptyState
            icon={Heart}
            title="Gagal Memuat Wishlist"
            description="Terjadi kesalahan saat memuat daftar keinginan Anda. Silakan coba kembali."
            action={{
              label: 'Coba Lagi',
              onClick: () => window.location.reload(),
            }}
          />
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        eyebrow="Koleksi Disukai"
        title="Daftar Keinginan"
        subtitle="Simpan produk favorit Anda dan belanja kapan saja."
      />
      <PageContainer className="py-10 page-content">
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : !hasItems ? (
          <EmptyState
            icon={Heart}
            title="Daftar Keinginan Kosong"
            description="Anda belum menambahkan produk apapun ke dalam daftar keinginan Anda."
            action={{ label: 'Cari Produk Pilihan', href: '/produk' }}
          />
        ) : (
          <div className="space-y-6">
            {/* Toolbar Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-brand-cream/60 border border-neutral-100 rounded-2xl">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                <span className="text-xs font-heading font-semibold uppercase tracking-wider text-brand-black">
                  {products.length} Produk Tersimpan
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={clearWishlist}
                  variant="ghost"
                  size="sm"
                  className="text-[10px] uppercase font-bold text-neutral-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Kosongkan
                </Button>
                <Button
                  onClick={handleMoveAllToCart}
                  variant="primary"
                  size="sm"
                  className="text-[10px] uppercase font-bold bg-brand-black text-white hover:bg-brand-accent transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Pindahkan Semua ke Keranjang
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
