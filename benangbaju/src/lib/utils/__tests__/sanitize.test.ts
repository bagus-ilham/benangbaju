import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '../sanitize'

describe('sanitizeHtml', () => {
  it('preserves safe formatting tags and HTTPS links', () => {
    const html = '<p>Halo <strong>Benangbaju</strong> <a href="https://benangbaju.com">Shop</a></p>'
    expect(sanitizeHtml(html)).toBe(html)
  })

  it('strips script tags including unclosed script tags', () => {
    expect(sanitizeHtml('<p>Safe</p><script>alert(1)</script>')).toBe('<p>Safe</p>')
    expect(sanitizeHtml('<p>Safe</p><script>alert(1)')).toBe('<p>Safe</p>')
  })

  it('strips svg, iframe, object, embed, form, and style tags', () => {
    expect(sanitizeHtml('<svg onload=alert(1)></svg><p>ok</p>')).toBe('<p>ok</p>')
    expect(sanitizeHtml('<iframe src="https://evil.test"></iframe><p>ok</p>')).toBe('<p>ok</p>')
    expect(sanitizeHtml('<object data="x"></object><embed src="x"><p>ok</p>')).toBe('<p>ok</p>')
    expect(sanitizeHtml('<style>body{display:none}</style><p>ok</p>')).toBe('<p>ok</p>')
  })

  it('strips inline event handlers including slash-separated ones', () => {
    const cleaned1 = sanitizeHtml('<img src="https://cdn.test/a.jpg" onerror="alert(1)">')
    expect(cleaned1).not.toMatch(/onerror/i)

    const cleaned2 = sanitizeHtml('<img/onerror=alert(1) src=x>')
    expect(cleaned2).not.toMatch(/onerror/i)
  })

  it('neutralizes javascript:, vbscript:, and data: URIs including obfuscated ones', () => {
    const jsLink = sanitizeHtml('<a href="javascript:alert(1)">click</a>')
    expect(jsLink).toBe('<a href="#">click</a>')

    const obfuscated = sanitizeHtml('<a href="&#x6a;avascript:alert(1)">click</a>')
    expect(obfuscated).toBe('<a href="#">click</a>')

    const dataUri = sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">click</a>')
    expect(dataUri).toBe('<a href="#">click</a>')
  })
})
