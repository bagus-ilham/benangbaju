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
 * Validates Malaysia postal codes (01000 - 98999), covering both West Malaysia (01000 - 86999)
 * and East Malaysia (87000 - 98999: Sabah, Sarawak, Labuan).
 */
export function validateMalaysiaPostalCode(postalCode: string): {
  valid: boolean
  isEastMalaysia?: boolean
  reason?: 'format'
} {
  const clean = postalCode.trim()
  if (!/^[0-9]{5}$/.test(clean)) {
    return { valid: false, reason: 'format' }
  }
  const codeInt = parseInt(clean, 10)
  if (codeInt >= 1000 && codeInt <= 98999) {
    return {
      valid: true,
      isEastMalaysia: codeInt >= 87000 && codeInt <= 98999,
    }
  }
  return { valid: false, reason: 'format' }
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
 * Validates match between Malaysian State (Negeri) and Postal Code (Poskod)
 * to prevent cross-region selection (e.g. West Malaysia state selected with East Malaysia postal code).
 */
export function validateMalaysiaStatePostalCodeMatch(
  state: string,
  postalCode: string
): {
  valid: boolean
  region: 'WEST' | 'EAST' | 'UNKNOWN'
  errorMessage?: string
} {
  const cleanPostal = (postalCode || '').trim()
  if (!/^[0-9]{5}$/.test(cleanPostal)) {
    return {
      valid: false,
      region: 'UNKNOWN',
      errorMessage: 'Poskod Malaysia harus berupa 5 digit angka yang valid (01000–98999).',
    }
  }
  const codeInt = parseInt(cleanPostal, 10)
  if (codeInt < 1000 || codeInt > 98999) {
    return {
      valid: false,
      region: 'UNKNOWN',
      errorMessage: 'Poskod Malaysia di luar rentang yang valid (01000–98999).',
    }
  }

  const s = (state || '').trim().toLowerCase()
  const isLabuan = s.includes('labuan')
  const isSabah = s.includes('sabah')
  const isSarawak = s.includes('sarawak')
  const isEastState = isLabuan || isSabah || isSarawak

  const isEastPostal = codeInt >= 87000 && codeInt <= 98999

  if (isEastState) {
    if (!isEastPostal) {
      return {
        valid: false,
        region: 'EAST',
        errorMessage: 'Negeri Malaysia Timur (Sabah, Sarawak, Labuan) memerlukan poskod 87000–98999.',
      }
    }
    // Sub-region specific check
    if (isLabuan && !(codeInt >= 87000 && codeInt <= 87999)) {
      return {
        valid: false,
        region: 'EAST',
        errorMessage: 'Poskod Wilayah Persekutuan Labuan harus berada pada rentang 87000–87999.',
      }
    }
    if (isSabah && !(codeInt >= 88000 && codeInt <= 91999)) {
      return {
        valid: false,
        region: 'EAST',
        errorMessage: 'Poskod Negeri Sabah harus berada pada rentang 88000–91999.',
      }
    }
    if (isSarawak && !(codeInt >= 93000 && codeInt <= 98999)) {
      return {
        valid: false,
        region: 'EAST',
        errorMessage: 'Poskod Negeri Sarawak harus berada pada rentang 93000–98999.',
      }
    }
    return { valid: true, region: 'EAST' }
  }

  // West Malaysia State
  if (isEastPostal) {
    return {
      valid: false,
      region: 'WEST',
      errorMessage:
        'Poskod 87000–98999 merupakan wilayah Malaysia Timur. Sila pilih negeri Sabah, Sarawak, atau Labuan.',
    }
  }

  return { valid: true, region: 'WEST' }
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
