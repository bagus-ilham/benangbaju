/**
 * Canonical public site URL (always https://www.benangbaju.com form).
 * Normalizes NEXT_PUBLIC_BASE_URL so a non-www value doesn't produce og:url /
 * og:image URLs that 308-redirect (Facebook flags this as a redirect loop).
 */
function normalizeSiteUrl(raw: string | undefined): string {
  const fallback = 'https://www.benangbaju.com'
  if (!raw) return fallback
  try {
    const url = new URL(raw)
    if (url.hostname === 'benangbaju.com') url.hostname = 'www.benangbaju.com'
    return url.origin
  } catch {
    return fallback
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_BASE_URL)

/** Default share image (served by src/app/opengraph-image.png file convention). */
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/opengraph-image.png`,
  width: 1024,
  height: 1024,
  alt: 'Benangbaju',
}
