import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { paymentSyncService } from '@/modules/orders/payment-sync.service'
import { safeLogError } from '@/lib/logger'

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function POST(req: NextRequest) {
  try {
    const secretKey = (process.env.DOKU_SECRET_KEY || '').trim()
    if (!secretKey) {
      safeLogError(
        'DOKU_WEBHOOK_CONFIG',
        new Error('Missing DOKU_SECRET_KEY in server environment')
      )
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    const rawBody = await req.text()
    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Verify DOKU signature
    const clientId = req.headers.get('Client-Id') || ''
    const requestId = req.headers.get('Request-Id') || ''
    const requestTimestamp = req.headers.get('Request-Timestamp') || ''
    const incomingSignature = req.headers.get('Signature') || ''
    const requestTarget = req.headers.get('Request-Target') || req.nextUrl.pathname

    if (incomingSignature && clientId && requestId && requestTimestamp) {
      // Digest = base64(sha256(rawBody))
      const digest = crypto.createHash('sha256').update(rawBody).digest('base64')
      const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`
      const calculatedSignature = `HMACSHA256=${crypto
        .createHmac('sha256', secretKey)
        .update(component)
        .digest('base64')}`

      if (!constantTimeCompare(calculatedSignature, incomingSignature)) {
        safeLogError(
          'DOKU_WEBHOOK_SIGNATURE',
          new Error('Invalid DOKU webhook signature received')
        )
        return NextResponse.json(
          { success: false, message: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const invoiceNumber = payload.order?.invoice_number
    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, message: 'Missing order.invoice_number' },
        { status: 400 }
      )
    }

    // Process status update & database synchronization
    const result = await paymentSyncService.syncOrderPayment(invoiceNumber)

    return NextResponse.json(
      { success: result.success, data: result.data },
      { status: result.success ? 200 : 400 }
    )
  } catch (error: any) {
    safeLogError('Unhandled error in doku-webhook route:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
