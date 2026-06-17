import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { getActiveBanners } from '@/services/banners'
import { getActiveCategories } from '@/services/categories'
import { getActiveCollections } from '@/services/collections'
import { getActiveFlashSale } from '@/services/flashSales'
import { getProducts } from '@/services/products'
import {
  HeroSection,
  FlashSaleSection,
  CategorySection,
  CollectionSection,
  FeaturedProductsSection,
  NewArrivalsSection,
  RecentlyViewedSection
} from '@/components/home'

// Enable dynamic revalidation for Server Components updates
export const revalidate = 60 // revalidate every minute

export default async function Homepage() {
  const supabase = await createServerClient()

  // Fetch all required data in parallel on the server
  const [
    banners,
    categories,
    collections,
    flashSale,
    featuredResponse,
    newestResponse
  ] = await Promise.all([
    getActiveBanners(supabase),
    getActiveCategories(supabase),
    getActiveCollections(supabase),
    getActiveFlashSale(supabase),
    getProducts(supabase, { sortBy: 'featured', limit: 4 }),
    getProducts(supabase, { sortBy: 'newest', limit: 4 }),
  ])

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      {/* 1. Carousel Hero Banner */}
      <HeroSection banners={banners} />

      {/* 2. Flash Sale Section */}
      <FlashSaleSection flashSale={flashSale} />

      {/* 3. Category Grid */}
      <CategorySection categories={categories} />

      {/* 4. Large Split Collections */}
      <CollectionSection collections={collections} />

      {/* 5. Featured Products Selection */}
      <FeaturedProductsSection products={featuredResponse.products} />

      {/* 6. New Arrivals Selection */}
      <NewArrivalsSection products={newestResponse.products} />

      {/* 7. Recently Viewed Slider (Client-Side state) */}
      <RecentlyViewedSection />
    </div>
  )
}
