import { formatIDR } from './format'

export type MyPriceRounding = 'none' | 'x.90' | 'whole'

export interface MyPricingConfig {
  exchangeRate?: number
  markupPercent?: number
  rounding?: MyPriceRounding
}

export interface MyPriceResult {
  baseIdr: number
  markupPercent: number
  exchangeRate: number
  rounding: MyPriceRounding
  rawSen: number
  finalSen: number
  priceMyr: number
  chargedIdr: number
  formattedMyr: string
  formattedChargedIdr: string
}

export interface DisplayPriceResult {
  primaryText: string
  secondaryText: string | null
  priceMyr: number | null
  chargedIdr: number
  isMY: boolean
}

/**
 * Formats a numeric MYR value to standard currency string (e.g. "RM 79.90" or "≈ RM 79.90").
 */
export function formatMYR(amountMyr: number, withApprox = false): string {
  if (isNaN(amountMyr) || amountMyr <= 0) {
    return withApprox ? '≈ RM 0.00' : 'RM 0.00'
  }
  const formatted = amountMyr.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${withApprox ? '≈ ' : ''}RM ${formatted}`
}

/**
 * Applies integer-sen psychological rounding:
 * - 'none': raw sen without change
 * - 'x.90': rounds up to the nearest .90 sen (e.g. 7986 -> 7990, 7990 -> 7990, 7991 -> 8090)
 * - 'whole': rounds up to the nearest whole Ringgit (e.g. 7986 -> 8000, 8000 -> 8000, 8001 -> 8100)
 */
export function roundSen(rawSen: number, mode: MyPriceRounding): number {
  if (rawSen <= 0) return 0
  switch (mode) {
    case 'x.90':
      return Math.floor((rawSen + 9) / 100) * 100 + 90
    case 'whole':
      return Math.floor((rawSen + 99) / 100) * 100
    case 'none':
    default:
      return rawSen
  }
}

/**
 * Core pricing engine for Malaysia (MY).
 * Single Source of Truth (R1 & R2) calculating integer sen to prevent floating point mismatch.
 */
export function getMyPrice(baseIdr: number, config?: MyPricingConfig): MyPriceResult {
  const cleanBaseIdr = Math.max(0, Math.round(baseIdr || 0))
  const exchangeRate =
    typeof config?.exchangeRate === 'number' && config.exchangeRate > 0
      ? config.exchangeRate
      : 3600
  const markupPercent =
    typeof config?.markupPercent === 'number' && !isNaN(config.markupPercent)
      ? Math.max(0, config.markupPercent)
      : 0
  const rounding = config?.rounding || 'none'

  if (cleanBaseIdr === 0) {
    return {
      baseIdr: 0,
      markupPercent,
      exchangeRate,
      rounding,
      rawSen: 0,
      finalSen: 0,
      priceMyr: 0,
      chargedIdr: 0,
      formattedMyr: formatMYR(0),
      formattedChargedIdr: formatIDR(0),
    }
  }

  // 1. Calculate raw sen: ROUND((base_idr * (100 + markup)) / exchangeRate)
  const rawSen = Math.round((cleanBaseIdr * (100 + markupPercent)) / exchangeRate)

  // 2. Apply rounding mode
  const finalSen = roundSen(rawSen, rounding)
  const priceMyr = finalSen / 100

  // 3. Calculate charged IDR:
  // If no markup and no rounding, preserve the exact base IDR
  const chargedIdr =
    markupPercent === 0 && rounding === 'none'
      ? cleanBaseIdr
      : Math.round((finalSen * exchangeRate) / 100)

  return {
    baseIdr: cleanBaseIdr,
    markupPercent,
    exchangeRate,
    rounding,
    rawSen,
    finalSen,
    priceMyr,
    chargedIdr,
    formattedMyr: formatMYR(priceMyr),
    formattedChargedIdr: formatIDR(chargedIdr),
  }
}

/**
 * Helper to produce primary and secondary price texts according to active market.
 */
export function getDisplayPrice(
  baseIdr: number,
  market: 'ID' | 'MY' | string | null | undefined,
  config?: MyPricingConfig
): DisplayPriceResult {
  const isMY = market?.toUpperCase() === 'MY'
  if (isMY) {
    const my = getMyPrice(baseIdr, config)
    return {
      primaryText: my.formattedMyr,
      secondaryText: `≈ ${my.formattedChargedIdr}`,
      priceMyr: my.priceMyr,
      chargedIdr: my.chargedIdr,
      isMY: true,
    }
  }

  const cleanIdr = Math.max(0, Math.round(baseIdr || 0))
  return {
    primaryText: formatIDR(cleanIdr),
    secondaryText: null,
    priceMyr: null,
    chargedIdr: cleanIdr,
    isMY: false,
  }
}

