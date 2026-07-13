import React from 'react'
import { homeService } from '@/modules/home/home.service'
import { HeroSection } from '@/modules/banners/components/HeroSection'
import { CategorySection } from '@/modules/categories/components/CategorySection'
import { FlashSaleSection } from '@/modules/flash-sales/components/FlashSaleSection'
import { CollectionSpotlight } from '@/modules/collections/components/CollectionSpotlight'
import { TrustStrip } from '@/modules/banners/components/TrustStrip'
import { FeaturedProductsSection } from '@/modules/products/components/FeaturedProductsSection'
import { NewArrivalsSection } from '@/modules/products/components/NewArrivalsSection'
import { ProductGridSection } from '@/modules/products/components/ProductGridSection'
import { RecentlyViewedSection } from '@/modules/products/components/RecentlyViewedSection'

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
collections,
    flashSale,
    featuredProducts,
    newestProducts,
    col1,
    col2,
    collection1Products,
    collection2Products,
  } = await homeService.getCachedHomepageData()

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
