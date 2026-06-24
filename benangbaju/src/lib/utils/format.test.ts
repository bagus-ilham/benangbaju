import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  beforeEach(() => {
    // Set a consistent timezone if needed, though formatDate relies on the local environment.
    // For id-ID long date, short time, the exact time value depends on the local timezone
    // but the formatting itself can be verified for consistency.
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats a Date object correctly', () => {
    // We mock the date specifically to avoid timezone issues during tests
    // by using an explicit UTC string, then check format
    const dateStr = '2023-12-01T10:30:00Z'
    const d = new Date(dateStr)

    // As formatDate uses `Intl.DateTimeFormat('id-ID')`, the exact output
    // depends on the environment's timezone.
    // So we match the expected regex or specific parts.
    const result = formatDate(d)

    // Example format: 1 Desember 2023 pukul 17.30 (for WIB/UTC+7)
    // We can just verify it includes the month and year, which should be constant
    expect(result).toMatch(/Desember 2023/)
  })

  it('formats a string representation of a Date correctly', () => {
    const dateStr = '2023-12-01T10:30:00Z'

    const result = formatDate(dateStr)

    expect(result).toMatch(/Desember 2023/)
  })

  it('formats different months correctly', () => {
    const d = new Date('2024-05-15T00:00:00Z')
    const result = formatDate(d)
    expect(result).toMatch(/Mei 2024/)
  })
})
