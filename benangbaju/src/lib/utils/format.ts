/**
 * Formats a number as Indonesian Rupiah (IDR).
 */
export function formatIDR(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numericAmount)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount)
}

/**
 * Formats a date into a readable Indonesian date string.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(d)
}

/**
 * Formats a date string into a local ISO string (YYYY-MM-DDTHH:MM) for datetime-local input.
 */
export function formatLocalISO(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  
  // Shift by timezone offset to get local time in ISO format
  const offset = d.getTimezoneOffset() * 60000
  const localTime = new Date(d.getTime() - offset)
  return localTime.toISOString().substring(0, 16)
}

