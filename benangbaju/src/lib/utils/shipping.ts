/**
 * Utility helpers for shipping and courier calculations.
 */

export function getCourierLabel(courierName: string): string {
  const name = courierName.toLowerCase()
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
