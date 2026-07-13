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

export function validatePostalCode(postalCode: string): boolean {
  // 5 digits
  return /^[0-9]{5}$/.test(postalCode)
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0
}

export function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}
