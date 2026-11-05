import { describe, it, expect } from 'vitest'
import { getProxiedImageUrl, getImageFallbackChain } from '../getImageUrl'

describe('getImageUrl resilience & logo mapping', () => {
  it('correctly normalizes legacy logo path /svg/logo-benangbaju.svg', () => {
    const result = getProxiedImageUrl('/svg/logo-benangbaju.svg')
    expect(result).toBe('/image/svg/logo/logo-benangbaju.svg')
  })

  it('correctly normalizes legacy /logo.PNG to standard SVG', () => {
    const result = getProxiedImageUrl('/logo.PNG')
    expect(result).toBe('/image/svg/logo/logo-benangbaju.svg')
  })

  it('correctly normalizes legacy /logo_favicon.PNG', () => {
    const result = getProxiedImageUrl('/logo_favicon.PNG')
    expect(result).toBe('/image/svg/logo/logo-favicon.svg')
  })

  it('preserves valid static paths', () => {
    const result = getProxiedImageUrl('/image/svg/logo/logo-benangbaju.svg')
    expect(result).toBe('/image/svg/logo/logo-benangbaju.svg')
  })

  it('returns default placeholder for empty or null input', () => {
    expect(getProxiedImageUrl(null)).toBe('/images/placeholder.jpg')
    expect(getProxiedImageUrl(undefined)).toBe('/images/placeholder.jpg')
    expect(getProxiedImageUrl('')).toBe('/images/placeholder.jpg')
  })

  it('provides a resilient fallback chain with normalized legacy path', () => {
    const chain = getImageFallbackChain('/svg/logo-benangbaju.svg')
    expect(chain[0]).toBe('/image/svg/logo/logo-benangbaju.svg')
    expect(chain[1]).toBe('/images/placeholder.jpg')
  })
})
