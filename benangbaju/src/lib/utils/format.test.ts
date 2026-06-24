import { describe, it, expect } from 'vitest'
import { formatProductDescription } from './format'

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
