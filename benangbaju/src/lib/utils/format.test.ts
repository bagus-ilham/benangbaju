import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatProductDescription, formatLocalISO } from './format'

describe('formatProductDescription', () => {
  it('should return a default message for null or undefined input', () => {
    expect(formatProductDescription(null)).toBe('Tidak ada deskripsi tambahan.')
    expect(formatProductDescription(undefined)).toBe('Tidak ada deskripsi tambahan.')
    expect(formatProductDescription('')).toBe('Tidak ada deskripsi tambahan.')
  })

  it('should replace HTML line breaks with newlines', () => {
    expect(formatProductDescription('Line 1<br>Line 2')).toBe('Line 1\nLine 2')
    expect(formatProductDescription('Line 1<br/>Line 2')).toBe('Line 1\nLine 2')
    expect(formatProductDescription('Line 1<br />Line 2')).toBe('Line 1\nLine 2')
    expect(formatProductDescription('Line 1<BR>Line 2')).toBe('Line 1\nLine 2')
  })

  it('should ensure bullet points start on a new line', () => {
    expect(formatProductDescription('Feature 1 • Feature 2 • Feature 3')).toBe('Feature 1\n• Feature 2\n• Feature 3')
    expect(formatProductDescription('•Feature 1•Feature 2')).toBe('• Feature 1\n• Feature 2')
    expect(formatProductDescription('List:\n• Item 1\n• Item 2')).toBe('List:\n• Item 1\n• Item 2')
  })

  it('should ensure listing dashes start on a new line when followed by list keywords', () => {
    expect(formatProductDescription('Details — 4 warna — Panduan')).toBe('Details\n— 4 warna\n— Panduan')
    expect(formatProductDescription('Info— Ukuran — Care')).toBe('Info\n— Ukuran\n— Care')
    expect(formatProductDescription('Dashes — Catatan — Note')).toBe('Dashes\n— Catatan\n— Note')
    // Should not break if not followed by keyword
    expect(formatProductDescription('Some — random text')).toBe('Some — random text')
  })

  it('should trim leading and trailing whitespace', () => {
    expect(formatProductDescription('   Text here   ')).toBe('Text here')
    expect(formatProductDescription('\n\nText here\n\n')).toBe('Text here')
  })

  it('should add a double newline between bullet point section and dash section', () => {
    // Actually the function regex `/(\n•[^\n]+)\n(—)/g` expects `\n• Point 2` followed by `\n—`
    expect(formatProductDescription('Features:\n• Point 1\n• Point 2\n— 4 warna')).toBe('Features:\n• Point 1\n• Point 2\n\n— 4 warna')
  })

  it('should handle complex mixed input correctly', () => {
    const input = '   Product name<br/>Details: • High quality • Durable<br>Options: — 4 warna — Ukuran L   '
    const expected = 'Product name\nDetails:\n• High quality\n• Durable\nOptions:\n— 4 warna\n— Ukuran L'

    // Let's test how the actual function processes this step-by-step
    // 1. Product name\nDetails: • High quality • Durable\nOptions: — 4 warna — Ukuran L
    // 2. Product name\nDetails:\n• High quality\n• Durable\nOptions: — 4 warna — Ukuran L
    // 3. Product name\nDetails:\n• High quality\n• Durable\nOptions:\n— 4 warna\n— Ukuran L
    // 4. (trim) Product name\nDetails:\n• High quality\n• Durable\nOptions:\n— 4 warna\n— Ukuran L
    // 5. Product name\nDetails:\n• High quality\n• Durable\nOptions:\n— 4 warna\n— Ukuran L
    expect(formatProductDescription(input)).toBe(expected)
  })
})

describe('formatLocalISO', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return an empty string for null, undefined, or empty string', () => {
    expect(formatLocalISO(null)).toBe('')
    expect(formatLocalISO(undefined)).toBe('')
    expect(formatLocalISO('')).toBe('')
  })

  it('should return an empty string for invalid date strings', () => {
    expect(formatLocalISO('invalid-date')).toBe('')
    expect(formatLocalISO('2023-13-45')).toBe('')
  })

  it('should return an empty string for invalid Date objects', () => {
    expect(formatLocalISO(new Date('invalid-date'))).toBe('')
  })

  it('should format valid Date object to local ISO string', () => {
    // Create a fixed date and a known timezone offset mock
    const date = new Date('2023-10-25T14:30:00.000Z')

    // Mock getTimezoneOffset to return -420 (UTC+7, e.g., Jakarta)
    // Offset is in minutes. -420 means local time is 420 minutes ahead of UTC.
    const spy = vi.spyOn(Date.prototype, 'getTimezoneOffset')
    spy.mockReturnValue(-420)

    // If UTC is 14:30, and local is UTC+7, local time is 21:30
    expect(formatLocalISO(date)).toBe('2023-10-25T21:30')

    // Mock getTimezoneOffset to return 300 (UTC-5, e.g., EST)
    // Local time is 300 minutes behind UTC.
    spy.mockReturnValue(300)
    expect(formatLocalISO(date)).toBe('2023-10-25T09:30')
  })

  it('should format valid date string to local ISO string', () => {
    const spy = vi.spyOn(Date.prototype, 'getTimezoneOffset')
    spy.mockReturnValue(0) // UTC

    // Use an ISO string
    expect(formatLocalISO('2023-10-25T14:30:00.000Z')).toBe('2023-10-25T14:30')
  })
})
