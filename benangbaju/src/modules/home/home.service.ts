import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getActiveBannersAction } from '@/modules/banners/actions'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import {
  getActiveCollectionsAction,
  getCollectionBySlugAction,
} from '@/modules/collections/actions'
import { flashSaleService } from '@/modules/flash-sales/flash-sale.service'
import { getProductsAction } from '@/modules/products/actions'
import { settingsService } from '@/modules/settings/settings.service'

export class HomeService {
  getCachedHomepageData = async () => {
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
}

export const homeService = new HomeService()
