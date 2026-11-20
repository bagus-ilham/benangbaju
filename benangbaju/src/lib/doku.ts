import crypto from 'crypto'

export interface DokuSignatureParams {
  clientId: string
  requestId: string
  requestTimestamp: string
  requestTarget: string
  secretKey: string
  rawBody?: string
}

/**
 * Constant-time UTF-8 string comparison to prevent timing side-channel attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

/**
 * Resolves the DOKU Jokul API base URL from environment variables.
 */
export function getDokuApiUrl(): string {
  const isProd =
    process.env.DOKU_ENVIRONMENT?.toLowerCase() === 'production' ||
    process.env.ENVIRONMENT?.toLowerCase() === 'production'
  const defaultApiUrl = isProd ? 'https://api.doku.com' : 'https://api-sandbox.doku.com'
  return (process.env.DOKU_API_URL || defaultApiUrl).trim().replace(/\/$/, '')
}

/**
 * Generates a DOKU Jokul HMAC-SHA256 signature header value (`HMACSHA256=...`).
 * Includes the SHA-256 body `Digest:` line when `rawBody` is provided (POST/webhook).
 */
export function generateDokuSignature({
  clientId,
  requestId,
  requestTimestamp,
  requestTarget,
  secretKey,
  rawBody,
}: DokuSignatureParams): string {
  let component =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${requestTimestamp}\n` +
    `Request-Target:${requestTarget}`

  if (rawBody !== undefined) {
    const digest = crypto.createHash('sha256').update(rawBody).digest('base64')
    component += `\nDigest:${digest}`
  }

  return `HMACSHA256=${crypto.createHmac('sha256', secretKey).update(component).digest('base64')}`
}
