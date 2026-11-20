/**
 * Decode numeric/common HTML entities and strip whitespace/control chars
 * for checking dangerous URI schemes (javascript:, vbscript:, data:).
 */
function normalizeUriForSchemeCheck(raw: string): string {
  const decoded = raw
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16) || 0)
    )
    .replace(/&#(\d+);?/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10) || 0)
    )
    .replace(/&colon;?/gi, ':')
    .replace(/&tab;?|&newline;?/gi, '')
  return decoded.replace(/[\s\u0000-\u0020]+/g, '').toLowerCase()
}

/**
 * Server/client-safe HTML sanitizer to prevent XSS in dynamic HTML strings.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''

  let clean = html
    // Remove dangerous container tags and their contents (including unclosed trailing tags)
    .replace(/<(script|style|iframe|object|form|svg|math)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, '')
    // Remove dangerous void, self-closing, or orphaned tags
    .replace(/<\/?(?:script|style|iframe|object|embed|form|svg|math|base|meta|link)\b[^>]*>/gi, '')

  // Repeatedly strip inline event handlers (handles slash separators like <img/onerror=...>)
  let prev = ''
  while (prev !== clean) {
    prev = clean
    clean = clean
      .replace(
        /(<[^>]*?)[\s/]+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+)/gi,
        '$1'
      )
      // Remove dangerous URI protocols in href/src/action/formaction (including entity/whitespace obfuscation)
      .replace(
        /\b(href|src|action|formaction)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi,
        (match: string, attr: string, dq?: string, sq?: string, bare?: string) => {
          const val = dq ?? sq ?? bare ?? ''
          const normalized = normalizeUriForSchemeCheck(val)
          if (
            normalized.startsWith('javascript:') ||
            normalized.startsWith('vbscript:') ||
            normalized.startsWith('data:')
          ) {
            return attr.toLowerCase() === 'href' ? 'href="#"' : `${attr}=""`
          }
          return match
        }
      )
  }

  return clean
}
