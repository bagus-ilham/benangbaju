import React from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getActiveBanners } from '@/services/banners'
import { getActiveCategories } from '@/services/categories'
import { getActiveCollections, getCollectionBySlug } from '@/services/collections'
import { getActiveFlashSale } from '@/services/flashSales'
import { getProducts } from '@/services/products'
import { getSiteSettings } from '@/services/settings'
import {
  HeroSection,
  TrustStrip,
  FlashSaleSection,
  CategorySection,
  FeaturedProductsSection,
  NewArrivalsSection,
  CollectionSpotlight,
  ProductGridSection,
  RecentlyViewedSection
} from '@/components/home'

export const revalidate = 60

async function getCachedHomepageData() {
  'use cache'
  cacheLife('hours')
  cacheTag('banners', 'categories', 'collections', 'flash-sales', 'products', 'settings', 'homepage-data')

  const supabase = createStaticClient()

  const [
    banners,
    categories,
    collections,
    flashSale,
    featuredResponse,
    newestResponse,
    settings,
  ] = await Promise.all([
    getActiveBanners(supabase),
    getActiveCategories(supabase),
    getActiveCollections(supabase),
    getActiveFlashSale(supabase),
    getProducts(supabase, { sortBy: 'featured', limit: 4 }),
    getProducts(supabase, { sortBy: 'newest', limit: 4 }),
    getSiteSettings(supabase),
  ])

  const spotlight1Slug = settings.find((s) => s.key === 'homepage_spotlight_collection_1')?.value || ''
  const spotlight2Slug = settings.find((s) => s.key === 'homepage_spotlight_collection_2')?.value || ''

  let col1 = null
  let col2 = null

  if (spotlight1Slug) {
    col1 = await getCollectionBySlug(supabase, spotlight1Slug)
  }
  if (spotlight2Slug) {
    col2 = await getCollectionBySlug(supabase, spotlight2Slug)
  }

  // Fallback to defaults if not set or not found
  if (!col1) {
    col1 = collections[0] ?? null
  }
  if (!col2) {
    col2 = collections[1] ?? null
  }

  const [collection1Products, collection2Products] = await Promise.all([
    col1
      ? getProducts(supabase, { collectionSlug: col1.slug, limit: 4 })
      : Promise.resolve({ products: [], totalCount: 0 }),
    col2
      ? getProducts(supabase, { collectionSlug: col2.slug, limit: 4 })
      : Promise.resolve({ products: [], totalCount: 0 }),
  ])

  return {
    banners,
    categories,
    collections,
    flashSale,
    featuredProducts: featuredResponse.products,
    newestProducts: newestResponse.products,
    col1,
    col2,
    collection1Products: collection1Products.products,
    collection2Products: collection2Products.products,
  }
}

export default async function Homepage() : Promise<React.JSX.Element> {
  const {
    banners,
    categories,
    collections,
    flashSale,
    featuredProducts,
    newestProducts,
    col1,
    col2,
    collection1Products,
    collection2Products,
  } = await getCachedHomepageData()

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      {/* 1. Banner */}
      <HeroSection banners={banners} />

      {/* Trust strip right after banner */}
      <TrustStrip />

      {/* 2. Produk Pilihan */}
      <FeaturedProductsSection products={featuredProducts} />

      {/* 3. Collection 1 */}
      {col1 && <CollectionSpotlight collection={col1} index={0} />}

      {/* 4. Produk dari Collection 1 */}
      {col1 && (
        <ProductGridSection
          products={collection1Products}
          eyebrow="Dari Koleksi"
          title={`Produk ${col1.name}`}
          viewAllHref={`/koleksi/${col1.slug}`}
          viewAllLabel={`Lihat Semua ${col1.name}`}
          variant="alt"
        />
      )}

      {/* 5. Collection 2 */}
      {col2 && <CollectionSpotlight collection={col2} variant="dark" index={1} />}

      {/* 6. Produk dari Collection 2 */}
      {col2 && (
        <ProductGridSection
          products={collection2Products}
          eyebrow="Dari Koleksi"
          title={`Produk ${col2.name}`}
          viewAllHref={`/koleksi/${col2.slug}`}
          viewAllLabel={`Lihat Semua ${col2.name}`}
        />
      )}

      {/* Additional sections */}
      <FlashSaleSection flashSale={flashSale} />
      <CategorySection categories={categories} />
      <NewArrivalsSection products={newestProducts} />
      <RecentlyViewedSection />
    </div>
  )
}
