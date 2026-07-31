const SUPABASE_STORAGE_PREFIX =
  'https://jwvbzuoatffoxaahdwdx.supabase.co/storage/v1/object/public'
const WORKER_URL = 'https://cdn.benangbaju.com'
const DEFAULT_PLACEHOLDER = '/images/placeholder.jpg'

export function getProxiedImageUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return DEFAULT_PLACEHOLDER

  if (process.env.NEXT_PUBLIC_USE_CDN_WORKER === 'true') {
    if (originalUrl.startsWith(SUPABASE_STORAGE_PREFIX)) {
      return originalUrl.replace(SUPABASE_STORAGE_PREFIX, WORKER_URL)
    }
  }

  return originalUrl
}

/**
 * Generates an ordered fallback chain of URLs for multi-tier image resilience:
 * Tier 1: Cloudflare CDN Worker URL (Fast Edge Cache)
 * Tier 2: Supabase Storage Direct URL (Original Raw Bucket Source)
 * Tier 3: Local Placeholder Image (Fallback UI Protection)
 */
export function getImageFallbackChain(originalUrl: string | null | undefined): string[] {
  if (!originalUrl || originalUrl.trim() === '') {
    return [DEFAULT_PLACEHOLDER]
  }

  const trimmed = originalUrl.trim()

  // Local static asset (e.g. /svg/logo-benangbaju.svg)
  if (trimmed.startsWith('/')) {
    return [trimmed, DEFAULT_PLACEHOLDER]
  }

  // Supabase Storage URL -> Tier 1: Cloudflare Worker, Tier 2: Supabase Storage, Tier 3: Local Placeholder
  if (trimmed.startsWith(SUPABASE_STORAGE_PREFIX)) {
    const workerCdnUrl = trimmed.replace(SUPABASE_STORAGE_PREFIX, WORKER_URL)
    return [workerCdnUrl, trimmed, DEFAULT_PLACEHOLDER]
  }

  // Any other external URL
  return [trimmed, DEFAULT_PLACEHOLDER]
}


