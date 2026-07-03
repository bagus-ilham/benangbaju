import React from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getActiveBanners } from '@/features/marketing/services/banners'
import { getActiveCategories } from '@/features/marketing/services/categories'
import { getActiveCollections, getCollectionBySlug } from '@/features/marketing/services/collections'
import { getActiveFlashSale } from '@/features/marketing/services/flashSales'
import { getProducts } from '@/features/products/services'
import { getSiteSettings } from '@/features/core/services/settings'
import { HeroSection } from '@/features/marketing/components/HeroSection';
import { CategorySection } from '@/features/marketing/components/CategorySection';
import { FlashSaleSection } from '@/features/marketing/components/FlashSaleSection';
import { CollectionSpotlight } from '@/features/marketing/components/CollectionSpotlight';
import { TrustStrip } from '@/features/marketing/components/TrustStrip';
import { FeaturedProductsSection } from '@/features/products/components/FeaturedProductsSection';
import { NewArrivalsSection } from '@/features/products/components/NewArrivalsSection';
import { ProductGridSection } from '@/features/products/components/ProductGridSection';
import { RecentlyViewedSection } from '@/features/products/components/RecentlyViewedSection';

async function getCachedHomepageData() {
  'use cache'
  cacheLife('hours')
  cacheTag('banners', 'categories', 'collections', 'flash-sales', 'products', 'settings', 'homepage-data')

  const supabase = createStaticClient()

  const [
    bannersRes,
    categories,
    collectionsRes,
    flashSaleRes,
    featuredResponse,
    newestResponse,
    settingsRes,
  ] = await Promise.all([
    getActiveBanners(supabase),
    getActiveCategories(supabase),
    getActiveCollections(supabase),
    getActiveFlashSale(supabase),
    getProducts(supabase, { sortBy: 'featured', limit: 4 }),
    getProducts(supabase, { sortBy: 'newest', limit: 4 }),
    getSiteSettings(supabase),
  ])

  const settings = settingsRes.data || []
  const collections = collectionsRes.data || []
  const flashSale = flashSaleRes.data || null
  const spotlight1Slug = settings.find((s) => s.key === 'homepage_spotlight_collection_1')?.value || ''
  const spotlight2Slug = settings.find((s) => s.key === 'homepage_spotlight_collection_2')?.value || ''

  const [col1Res, col2Res] = await Promise.all([
    spotlight1Slug ? getCollectionBySlug(supabase, spotlight1Slug) : Promise.resolve(null),
    spotlight2Slug ? getCollectionBySlug(supabase, spotlight2Slug) : Promise.resolve(null),
  ])

  const col1 = col1Res?.data || collections[0] || null
  const col2 = col2Res?.data || collections[1] || null


  const [collection1Products, collection2Products] = await Promise.all([
    col1
      ? getProducts(supabase, { collectionSlug: col1.slug, limit: 4 })
      : Promise.resolve({ data: [], success: true }),
    col2
      ? getProducts(supabase, { collectionSlug: col2.slug, limit: 4 })
      : Promise.resolve({ data: [], success: true }),
  ])

  return {
    banners: bannersRes.data || [],
    categories,
    collections,
    flashSale,
    featuredProducts: featuredResponse.data || [],
    newestProducts: newestResponse.data || [],
    col1,
    col2,
    collection1Products: collection1Products.data || [],
    collection2Products: collection2Products.data || [],
  }
}

export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.benangbaju.com'
  return {
    title: 'Benangbaju - Premium Modest Fashion',
    description: 'Temukan koleksi modest fashion terbaik, kemeja linen, dan gaya busana premium di Benangbaju. Belanja mudah, cepat, dan aman.',
    openGraph: {
      title: 'Benangbaju - Premium Modest Fashion',
      description: 'Temukan koleksi modest fashion terbaik di Benangbaju.',
      url: baseUrl,
      type: 'website',
    },
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.benangbaju.com'

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Benangbaju',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    sameAs: [
      'https://www.instagram.com/benangbaju',
      'https://www.facebook.com/benangbaju'
    ]
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Benangbaju',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
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
    </>
  )
}
