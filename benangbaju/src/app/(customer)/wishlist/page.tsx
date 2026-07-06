'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'
import { useProducts } from '@/modules/products/hooks/useProducts'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { PageContainer, ProductGridSkeleton, EmptyState, PageHero } from '@/shared/components'
import { Heart } from 'lucide-react'

export default function WishlistPage(): React.JSX.Element {
  const productIds = useWishlistStore((state) => state.productIds)

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
        )}
      </PageContainer>
    </div>
  )
}
