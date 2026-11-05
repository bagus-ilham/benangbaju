const supabaseBaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwvbzuoatffoxaahdwdx.supabase.co'
const SUPABASE_STORAGE_PREFIX = `${supabaseBaseUrl.replace(/\/$/, '')}/storage/v1/object/public`
const WORKER_URL = 'https://cdn.benangbaju.com'
const DEFAULT_PLACEHOLDER = '/images/placeholder.jpg'

const LEGACY_PATH_MAP: Record<string, string> = {
  '/svg/logo-benangbaju.svg': '/image/svg/logo/logo-benangbaju.svg',
  '/svg/logo-favicon.svg': '/image/svg/logo/logo-favicon.svg',
  '/logo.PNG': '/image/svg/logo/logo-benangbaju.svg',
  '/logo.png': '/image/svg/logo/logo-benangbaju.svg',
  '/logo_favicon.PNG': '/image/svg/logo/logo-favicon.svg',
  '/logo_favicon.png': '/image/svg/logo/logo-favicon.svg',
}

function resolveAssetPath(url: string): string {
  return LEGACY_PATH_MAP[url] || url
}

export function getProxiedImageUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return DEFAULT_PLACEHOLDER

  const normalized = resolveAssetPath(originalUrl.trim())

  // CDN is enabled by default — set NEXT_PUBLIC_USE_CDN_WORKER=false to disable
  if (process.env.NEXT_PUBLIC_USE_CDN_WORKER !== 'false') {
    if (normalized.startsWith(SUPABASE_STORAGE_PREFIX)) {
      return normalized.replace(SUPABASE_STORAGE_PREFIX, WORKER_URL)
    }
  }

  return normalized
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

  const trimmed = resolveAssetPath(originalUrl.trim())

  // Local static asset (e.g. /image/svg/logo/logo-benangbaju.svg)
  if (trimmed.startsWith('/')) {
    return [trimmed, DEFAULT_PLACEHOLDER]
  }

  // Supabase Storage URL -> Tier 1: Cloudflare Worker, Tier 2: Local Placeholder (No raw Supabase leak)
  if (trimmed.startsWith(SUPABASE_STORAGE_PREFIX)) {
    const workerCdnUrl = trimmed.replace(SUPABASE_STORAGE_PREFIX, WORKER_URL)
    return [workerCdnUrl, DEFAULT_PLACEHOLDER]
  }

  // Any other external URL
  return [trimmed, DEFAULT_PLACEHOLDER]
}
