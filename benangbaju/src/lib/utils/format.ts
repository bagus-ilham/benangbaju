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
  })
    .format(numericAmount)
    .replace(/^Rp\s*/i, 'Rp ') // Ensure exactly one space after Rp
}

/**
 * Formats a date into a readable Indonesian date string.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
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

/**
 * Formats product description to clean up HTML breaks, and automatically
 * inserts newlines before bullet points (•) and listing dashes (—) if they
 * are not already formatted.
 */
export function formatProductDescription(text: string | null | undefined): string {
  if (!text) return 'Tidak ada deskripsi tambahan.'

  // 1. Replace HTML line breaks with newlines
  let formatted = text.replace(/<br\s*\/?>/gi, '\n')

  // 2. Ensure bullet points (•) start on a new line
  formatted = formatted.replace(/(?:\s*•\s*)/g, '\n• ')

  // 3. Ensure listing dashes (—) start on a new line when followed by list keywords (e.g. "4 warna", "Panduan")
  formatted = formatted.replace(
    /(?:\s*—\s*)(?=\d+\s*(?:warna|pcs|item|buah|col|pilihan)|Panduan|Ukuran|Size|Care|Detail|Catatan|Note)/gi,
    '\n— '
  )

  // 4. Trim leading/trailing whitespace
  formatted = formatted.trim()

  // 5. Add a double newline between bullet point section and dash section for visual grouping
  formatted = formatted.replace(/(\n•[^\n]+)\n(—)/g, '$1\n\n$2')

  return formatted
}
