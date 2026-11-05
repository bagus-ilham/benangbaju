import { describe, it, expect } from 'vitest'
import { formatDateWithTimezone, formatApproxMYR } from '../format'

describe('formatDateWithTimezone', () => {
  const utcDate = '2026-11-05T03:30:00.000Z' // 10:30 WIB (UTC+7), 11:30 MYT (UTC+8)

  it('formats Indonesian dates with WIB suffix by default', () => {
    const formatted = formatDateWithTimezone(utcDate)
    expect(formatted).toContain('WIB')
    expect(formatted).toContain('10.30') // id-ID uses dot for time separator
    expect(formatted).toContain('2026')
  })

  it('formats Indonesian dates with explicit ID country code', () => {
    const formatted = formatDateWithTimezone(utcDate, 'ID')
    expect(formatted).toContain('WIB')
    expect(formatted).toContain('10.30')
  })

  it('formats Malaysian dates with MYT (GMT+8) suffix and +1h offset', () => {
    const formatted = formatDateWithTimezone(utcDate, 'MY')
    expect(formatted).toContain('MYT (GMT+8)')
    expect(formatted).toMatch(/11[:.]30/)
    expect(formatted).toContain('2026')
  })

  it('handles lowercase country code', () => {
    const formatted = formatDateWithTimezone(utcDate, 'my')
    expect(formatted).toContain('MYT (GMT+8)')
    expect(formatted).toMatch(/11[:.]30/)
  })

  it('handles null, undefined, and invalid inputs gracefully', () => {
    expect(formatDateWithTimezone(null)).toBe('-')
    expect(formatDateWithTimezone(undefined)).toBe('-')
    expect(formatDateWithTimezone('')).toBe('-')
    expect(formatDateWithTimezone('invalid-date')).toBe('-')
  })

  it('supports Date objects', () => {
    const d = new Date(utcDate)
    const formatted = formatDateWithTimezone(d, 'MY')
    expect(formatted).toContain('MYT (GMT+8)')
    expect(formatted).toMatch(/11[:.]30/)
  })
})

describe('formatApproxMYR', () => {
  it('formats IDR to MYR correctly with default rate', () => {
    expect(formatApproxMYR(360000, 3600)).toBe('≈ RM 100.00')
    expect(formatApproxMYR(180000, 3600)).toBe('≈ RM 50.00')
  })

  it('handles zero and negative amounts safely', () => {
    expect(formatApproxMYR(0)).toBe('≈ RM 0.00')
    expect(formatApproxMYR(-5000)).toBe('≈ RM 0.00')
  })
})

