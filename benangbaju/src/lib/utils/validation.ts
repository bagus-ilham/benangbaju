/**
 * Shared validation helpers.
 */

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone: string): boolean {
  // Indonesian phone number format: 08... or +628... or 628...
  const re = /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/
  return re.test(phone)
}

/**
 * Validates phone numbers for supported countries (ID, MY).
 */
export function isValidPhoneByCountry(phone: string, countryCode: 'ID' | 'MY' = 'ID'): boolean {
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  if (countryCode === 'MY') {
    // Malaysia: mobile (01x-xxx xxxx / +601x) or landline (03-xxxx xxxx, 04, 05, etc.)
    return /^(?:\+?60|0)(?:1[0-9]{8,9}|[3-9][0-9]{7,8})$/.test(cleanPhone)
  }
  // Default ID: 08... or +628... or 628...
  return /^(?:\+?62|0)8[1-9][0-9]{6,10}$/.test(cleanPhone)
}

/**
 * Normalizes phone numbers to standard E.164 format (+62... or +60...).
 */
export function normalizePhoneE164(phone: string, countryCode: 'ID' | 'MY' = 'ID'): string {
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  if (!cleanPhone) return ''

  if (countryCode === 'MY') {
    if (cleanPhone.startsWith('+60')) return cleanPhone
    if (cleanPhone.startsWith('60')) return `+${cleanPhone}`
    if (cleanPhone.startsWith('0')) return `+60${cleanPhone.slice(1)}`
    if (cleanPhone.startsWith('1')) return `+60${cleanPhone}`
    return cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`
  }

  // ID normalization
  if (cleanPhone.startsWith('+62')) return cleanPhone
  if (cleanPhone.startsWith('62')) return `+${cleanPhone}`
  if (cleanPhone.startsWith('0')) return `+62${cleanPhone.slice(1)}`
  if (cleanPhone.startsWith('8')) return `+62${cleanPhone}`
  return cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`
}

export function validatePostalCode(postalCode: string): boolean {
  // 5 digits
  return /^[0-9]{5}$/.test(postalCode)
}

/**
 * Validates West Malaysia postal codes (01000 - 86999).
 * Blocks East Malaysia postal codes (87000 - 98999: Sabah, Sarawak, Labuan).
 */
export function validateMalaysiaWestPostalCode(postalCode: string): {
  valid: boolean
  reason?: 'format' | 'east_malaysia'
} {
  const clean = postalCode.trim()
  if (!/^[0-9]{5}$/.test(clean)) {
    return { valid: false, reason: 'format' }
  }
  const codeInt = parseInt(clean, 10)
  if (codeInt >= 87000 && codeInt <= 98999) {
    return { valid: false, reason: 'east_malaysia' }
  }
  if (codeInt >= 1000 && codeInt <= 86999) {
    return { valid: true }
  }
  return { valid: false, reason: 'format' }
}

/**
 * Checks if an address contains PO Box or Peti Surat keywords, which are unsupported by export couriers.
 */
export function hasPoBoxAddress(address: string): boolean {
  if (!address) return false
  const poBoxRegex = /\b(p\.?\s*o\.?\s*box|peti\s+surat|locked\s+bag|karung\s+berkunci)\b/i
  return poBoxRegex.test(address)
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0
}

export function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}
