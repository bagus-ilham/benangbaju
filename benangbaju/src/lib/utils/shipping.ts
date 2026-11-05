/**
 * Utility helpers for shipping and courier calculations.
 */

export function getCourierLabel(courierName: string): string {
  const name = courierName.toLowerCase()
  if (name.includes('ninja')) return 'Ninja Van MY'
  if (name.includes('lion') || name.includes('interpack')) return 'Lion Parcel INTERPACK'
  if (name.includes('janio')) return 'Janio Asia'
  if (name.includes('aramex')) return 'Aramex'
  if (name.includes('dhl')) return 'DHL Express'
  if (name.includes('pos malaysia') || name.includes('ems')) return 'Pos Malaysia / EMS'
  if (name.includes('rayspeed')) return 'Rayspeed Asia'
  if (name.includes('kiriminaja')) return 'KiriminAja Export'
  if (name.includes('jne')) return 'JNE Express'
  if (name.includes('tiki')) return 'TIKI'
  if (name.includes('pos')) return 'POS Indonesia'
  if (name.includes('j&t') || name.includes('jnt')) return 'J&T Express'
  if (name.includes('sicepat')) return 'SiCepat'
  return courierName
}

export function formatWeight(weightGram: number): string {
  if (weightGram >= 1000) {
    return `${(weightGram / 1000).toFixed(2)} kg`
  }
  return `${weightGram} gr`
}

export function estimateDeliveryDate(minDays: number, maxDays: number): string {
  const format = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const today = new Date()
  const minDate = new Date(today)
  minDate.setDate(today.getDate() + minDays)

  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + maxDays)

  return `${format(minDate)} - ${format(maxDate)}`
}

/**
 * Generates an external tracking URL for the specified courier.
 * Falls back to 17TRACK universal tracker.
 */
export function getCourierTrackingUrl(courierName: string, trackingNumber: string): string {
  const cleanTracking = trackingNumber.trim()
  if (!cleanTracking) return ''

  const name = courierName.toLowerCase()

  if (name.includes('ninja')) {
    return `https://www.ninjavan.co/en-my/tracking?id=${cleanTracking}`
  }
  if (name.includes('lion') || name.includes('interpack')) {
    return `https://lionparcel.com/track/stt?q=${cleanTracking}`
  }
  if (name.includes('pos malaysia') || name.includes('ems')) {
    return `https://www.pos.com.my/tracking?trackingNo=${cleanTracking}`
  }
  if (name.includes('sicepat')) {
    return `https://www.sicepat.com/checkAwb/${cleanTracking}`
  }
  if (name.includes('jne')) {
    return `https://www.jne.co.id/id/tracking/trace/${cleanTracking}`
  }
  if (name.includes('j&t') || name.includes('jnt')) {
    return `https://www.jet.co.id/track?awb=${cleanTracking}`
  }
  if (name.includes('pos ind') || name.includes('kantor pos')) {
    return `https://www.posindonesia.co.id/id/tracking/${cleanTracking}`
  }

  // Universal international tracker fallback
  return `https://t.17track.net/en#nums=${encodeURIComponent(cleanTracking)}`
}

/**
 * Parses comma/semicolon/newline separated tracking numbers (e.g., multi-box/koli shipments).
 */
export function parseTrackingNumbers(trackingNumber: string | null | undefined): string[] {
  if (!trackingNumber) return []
  return trackingNumber
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean)
}
