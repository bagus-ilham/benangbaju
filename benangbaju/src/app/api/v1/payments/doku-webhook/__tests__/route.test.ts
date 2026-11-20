import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

const syncOrderPaymentMock = vi.fn()

vi.mock('@/modules/orders/payment-sync.service', () => ({
  paymentSyncService: {
    syncOrderPayment: (...args: unknown[]) => syncOrderPaymentMock(...args),
  },
}))

vi.mock('@/lib/logger', () => ({
  safeLogError: vi.fn(),
}))

import { POST } from '../route'

describe('POST /api/v1/payments/doku-webhook', () => {
  const ORIGINAL_SECRET = process.env.DOKU_SECRET_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.DOKU_SECRET_KEY = 'test-doku-secret-key'
  })

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env.DOKU_SECRET_KEY
    } else {
      process.env.DOKU_SECRET_KEY = ORIGINAL_SECRET
    }
  })

  function buildSignature(
    rawBody: string,
    secretKey: string,
    clientId: string,
    requestId: string,
    timestamp: string,
    target: string
  ) {
    const digest = crypto.createHash('sha256').update(rawBody).digest('base64')
    const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${target}\nDigest:${digest}`
    return `HMACSHA256=${crypto.createHmac('sha256', secretKey).update(component).digest('base64')}`
  }

  it('rejects requests missing signature headers with 401 and does not sync order', async () => {
    const body = JSON.stringify({ order: { invoice_number: 'BB-2026-0001' } })
    const req = new NextRequest('https://benangbaju.com/api/v1/payments/doku-webhook', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(syncOrderPaymentMock).not.toHaveBeenCalled()
  })

  it('returns 401 (not 500) when signature contains multi-byte UTF-8 characters of equal JS length', async () => {
    const body = JSON.stringify({ order: { invoice_number: 'BB-2026-0002' } })
    const target = '/api/v1/payments/doku-webhook'
    const validSig = buildSignature(
      body,
      'test-doku-secret-key',
      'BRN-123',
      'req-1',
      '2026-11-20T00:00:00Z',
      target
    )
    // Same JS .length as validSig, but larger UTF-8 byte length
    const multiByteSig = 'é'.repeat(validSig.length)

    const req = new NextRequest(`https://benangbaju.com${target}`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': 'BRN-123',
        'Request-Id': 'req-1',
        'Request-Timestamp': '2026-11-20T00:00:00Z',
        Signature: multiByteSig,
      },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(syncOrderPaymentMock).not.toHaveBeenCalled()
  })

  it('verifies valid signature and calls paymentSyncService.syncOrderPayment', async () => {
    const body = JSON.stringify({ order: { invoice_number: 'BB-2026-0003' } })
    const target = '/api/v1/payments/doku-webhook'
    const validSig = buildSignature(
      body,
      'test-doku-secret-key',
      'BRN-123',
      'req-2',
      '2026-11-20T00:00:00Z',
      target
    )

    syncOrderPaymentMock.mockResolvedValueOnce({
      success: true,
      data: { order_status: 'processing', payment_status: 'success' },
    })

    const req = new NextRequest(`https://benangbaju.com${target}`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': 'BRN-123',
        'Request-Id': 'req-2',
        'Request-Timestamp': '2026-11-20T00:00:00Z',
        Signature: validSig,
      },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(syncOrderPaymentMock).toHaveBeenCalledWith('BB-2026-0003')
  })

  it('accepts signature signed against explicit Request-Target header', async () => {
    const body = JSON.stringify({ order: { invoice_number: 'BB-2026-0004' } })
    const customTarget = '/custom/proxy/doku-webhook'
    const validSig = buildSignature(
      body,
      'test-doku-secret-key',
      'BRN-123',
      'req-3',
      '2026-11-20T00:00:00Z',
      customTarget
    )

    syncOrderPaymentMock.mockResolvedValueOnce({
      success: true,
      data: { order_status: 'processing', payment_status: 'success' },
    })

    const req = new NextRequest('https://www.benangbaju.com/api/v1/payments/doku-webhook', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': 'BRN-123',
        'Request-Id': 'req-3',
        'Request-Timestamp': '2026-11-20T00:00:00Z',
        'Request-Target': customTarget,
        Signature: validSig,
      },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(syncOrderPaymentMock).toHaveBeenCalledWith('BB-2026-0004')
  })
})
