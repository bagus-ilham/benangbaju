import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://benangbaju.com'

  // Core static public routes
  const staticRoutes = [
    '',
    '/tentang',
    '/kontak',
    '/cara-belanja',
    '/pengiriman',
    '/retur',
    '/syarat-ketentuan',
    '/kebijakan-privasi',
    '/produk',
    '/kategori',
    '/koleksi',
    '/flash-sale',
  ]

  const sitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }))

  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const [productsRes, categoriesRes, collectionsRes] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_active', true),
      supabase.from('categories').select('slug').eq('is_active', true),
      supabase.from('collections').select('slug').eq('is_active', true),
    ])

    if (productsRes.data) {
      productsRes.data.forEach((product) => {
        sitemapEntries.push({
          url: `${baseUrl}/produk/${product.slug}`,
          lastModified: new Date(product.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      })
    }

    if (categoriesRes.data) {
      categoriesRes.data.forEach((category) => {
        sitemapEntries.push({
          url: `${baseUrl}/kategori/${category.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }

    if (collectionsRes.data) {
      collectionsRes.data.forEach((collection) => {
        sitemapEntries.push({
          url: `${baseUrl}/koleksi/${collection.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error)
  }

  return sitemapEntries
}
