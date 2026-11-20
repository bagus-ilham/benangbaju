'use client'

import { useMarket, type Market } from '@/shared/stores/marketStore'
import { ORDER_STATUS_LABELS_BILINGUAL } from '@/lib/constants'

export interface TranslationContext {
  market: Market
  isMY: boolean
  t: (idText: string, enText: string) => string
}

/**
 * Hook for component localization based on the selected market.
 * - 'ID' -> Indonesian (default)
 * - 'MY' -> English
 * 
 * Works consistently with hydration safety (useMarket).
 */
export function useTranslation(): TranslationContext {
  const market = useMarket()
  const isMY = market === 'MY'

  const t = (idText: string, enText: string): string => {
    return isMY ? enText : idText
  }

  return {
    market,
    isMY,
    t,
  }
}

/**
 * Translates common variant attribute group names (e.g. "Ukuran" -> "Size", "Warna" -> "Color").
 */
export function translateVariantAttrName(attrName: string, isMY: boolean): string {
  if (!isMY) return attrName
  const lower = attrName.trim().toLowerCase()
  if (lower === 'ukuran' || lower === 'size') return 'Size'
  if (lower === 'warna' || lower === 'colour' || lower === 'color') return 'Color'
  if (lower === 'bahan' || lower === 'material') return 'Material'
  if (lower === 'motif' || lower === 'pattern') return 'Pattern'
  if (lower === 'model' || lower === 'type') return 'Model'
  return attrName
}

/**
 * Order Status bilingual label mapping (re-exported from canonical constants).
 */
export const ORDER_STATUS_LABELS = ORDER_STATUS_LABELS_BILINGUAL

export function getOrderStatusLabel(status: string, isMY: boolean): string {
  const entry = ORDER_STATUS_LABELS[status]
  if (!entry) return status
  return isMY ? entry.en : entry.id
}

