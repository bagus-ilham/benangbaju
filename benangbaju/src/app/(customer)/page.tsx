import React from 'react'
import { homeService } from '@/modules/home/home.service'
import { HeroSection } from '@/modules/banners/components/HeroSection'
import { MidBannerSection } from '@/modules/banners/components/MidBannerSection'
import { CategorySection } from '@/modules/categories/components/CategorySection'
import { FlashSaleSection } from '@/modules/flash-sales/components/FlashSaleSection'
import { CollectionShowcase } from '@/modules/collections/components/CollectionShowcase'
import { TrustStrip } from '@/modules/banners/components/TrustStrip'
import { FeaturedProductsSection } from '@/modules/products/components/FeaturedProductsSection'
import { NewArrivalsSection } from '@/modules/products/components/NewArrivalsSection'
import { RecentlyViewedSection } from '@/modules/products/components/RecentlyViewedSection'

export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.benangbaju.com'
  return {
    title: 'Benangbaju - Show How Really Well-Dressed You Are',
    description:
      'Belanja koleksi pakaian sederhana namun unik dari Benangbaju. Belanja mudah, cepat, dan aman.',
    openGraph: {
      title: 'Benangbaju - Show How Really Well-Dressed You Are',
      description: 'Temukan koleksi pakaian sederhana namun unik di Benangbaju.',
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

  const heroBanners = banners.filter((b) => b.position === 'homepage_hero' || !b.position)
  const midBanners = banners.filter((b) => b.position === 'mid_banner')

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

  const sanitizeJsonLd = (obj: Record<string, unknown>) =>
    JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(websiteJsonLd) }}
      />
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* 1. Banner */}
        <HeroSection banners={heroBanners} />

        {/* Trust strip right after banner */}
        <TrustStrip />

        {/* 2. Produk Pilihan */}
        <FeaturedProductsSection products={featuredProducts} />

        {/* 3. Collection 1 */}
        {col1 && <CollectionShowcase collection={col1} products={collection1Products} index={0} />}

        {/* Mid Banner */}
        <MidBannerSection banners={midBanners} />

        {/* 5. Collection 2 */}
        {col2 && <CollectionShowcase collection={col2} products={collection2Products} index={1} />}

        {/* Additional sections */}
        <FlashSaleSection flashSale={flashSale} />
        <CategorySection categories={categories} />
        <NewArrivalsSection products={newestProducts} />
        <RecentlyViewedSection />
      </div>
    </>
  )
}
