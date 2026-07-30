export function getProxiedImageUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return '/images/placeholder.jpg'

  // Jika CDN Worker sudah aktif dan aman, bisa di-enable via env var NEXT_PUBLIC_USE_CDN_WORKER
  // Secara default gunakan originalUrl (Supabase Storage) yang 100% working (HTTP 200)
  if (process.env.NEXT_PUBLIC_USE_CDN_WORKER === 'true') {
    const SUPABASE_STORAGE_PREFIX =
      'https://jwvbzuoatffoxaahdwdx.supabase.co/storage/v1/object/public'
    const WORKER_URL = 'https://cdn.benangbaju.com'

    if (originalUrl.startsWith(SUPABASE_STORAGE_PREFIX)) {
      return originalUrl.replace(SUPABASE_STORAGE_PREFIX, WORKER_URL)
    }
  }

  return originalUrl
}

