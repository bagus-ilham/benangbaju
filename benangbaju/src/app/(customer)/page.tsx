import React from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getActiveBannersAction } from '@/modules/banners/actions'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { getActiveCollectionsAction, getCollectionBySlugAction } from '@/modules/collections/actions'
import { flashSaleService } from '@/modules/flash-sales/flash-sale.service'
import { getProductsAction } from '@/modules/products/actions'
import { settingsService } from '@/modules/settings/settings.service'
import { HeroSection } from '@/modules/banners/components/HeroSection'
import { CategorySection } from '@/modules/categories/components/CategorySection'
import { FlashSaleSection } from '@/modules/flash-sales/components/FlashSaleSection'
import { CollectionSpotlight } from '@/modules/collections/components/CollectionSpotlight'
import { TrustStrip } from '@/modules/banners/components/TrustStrip'
import { FeaturedProductsSection } from '@/modules/products/components/FeaturedProductsSection'
import { NewArrivalsSection } from '@/modules/products/components/NewArrivalsSection'
import { ProductGridSection } from '@/modules/products/components/ProductGridSection'
import { RecentlyViewedSection } from '@/modules/products/components/RecentlyViewedSection'

async function getCachedHomepageData() {
  'use cache'
  cacheLife('hours')
  cacheTag(
    'banners',
    'categories',
    'collections',
    'flash-sales',
    'products',
    'settings',
    'homepage-data'
  )

  const supabase = createStaticClient()

  const [
    bannersRes,
    categoriesRes,
    collectionsRes,
    flashSaleRes,
    featuredResponse,
    newestResponse,
    settingsRes,
  ] = await Promise.all([
    getActiveBannersAction(),
    getActiveCategoriesAction(),
    getActiveCollectionsAction(),
    flashSaleService.getActiveFlashSale(supabase),
    getProductsAction({ sortBy: 'featured', limit: 4 }),
    getProductsAction({ sortBy: 'newest', limit: 4 }),
    settingsService.getSiteSettings(),
  ])

  const settings = settingsRes.data || []
  const collections = collectionsRes.data || []
  const flashSale = flashSaleRes.data || null
  const spotlight1Slug =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings.find((s: any) => s.key === 'homepage_spotlight_collection_1')?.value || ''
  const spotlight2Slug =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings.find((s: any) => s.key === 'homepage_spotlight_collection_2')?.value || ''

  const [col1Res, col2Res] = await Promise.all([
    spotlight1Slug ? getCollectionBySlugAction(spotlight1Slug) : Promise.resolve(null),
    spotlight2Slug ? getCollectionBySlugAction(spotlight2Slug) : Promise.resolve(null),
  ])

  const col1 = col1Res?.data || collections[0] || null
  const col2 = col2Res?.data || collections[1] || null

  const [collection1Products, collection2Products] = await Promise.all([
    col1
      ? getProductsAction({ collectionSlug: col1.slug, limit: 4 })
      : Promise.resolve({ data: [], success: true }),
    col2
      ? getProductsAction({ collectionSlug: col2.slug, limit: 4 })
      : Promise.resolve({ data: [], success: true }),
  ])

  return {
    banners: bannersRes.data || [],
    categories: categoriesRes.data || [],
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
    description:
      'Temukan koleksi modest fashion terbaik, kemeja linen, dan gaya busana premium di Benangbaju. Belanja mudah, cepat, dan aman.',
    openGraph: {
      title: 'Benangbaju - Premium Modest Fashion',
      description: 'Temukan koleksi modest fashion terbaik di Benangbaju.',
      url: baseUrl,
      type: 'website',
    },
  }
}

export default async function Homepage(): Promise<React.JSX.Element> {
  const {
    banners,
    categories,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    sameAs: ['https://www.instagram.com/benangbaju', 'https://www.facebook.com/benangbaju'],
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Benangbaju',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
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
