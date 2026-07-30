export function getProxiedImageUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return '/images/placeholder.jpg'

  // URL prefix Supabase Storage public buckets
  const SUPABASE_STORAGE_PREFIX =
    'https://jwvbzuoatffoxaahdwdx.supabase.co/storage/v1/object/public'

  // URL Cloudflare CDN Worker
  const WORKER_URL = 'https://cdn.benangbaju.com'

  // Jika URL-nya berasal dari Supabase Storage public, ganti prefix dengan URL Worker CDN
  if (originalUrl.startsWith(SUPABASE_STORAGE_PREFIX)) {
    return originalUrl.replace(SUPABASE_STORAGE_PREFIX, WORKER_URL)
  }

  return originalUrl
}
