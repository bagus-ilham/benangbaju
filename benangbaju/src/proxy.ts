import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

import { createServerClient } from '@supabase/ssr'

async function checkRateLimit(
  request: NextRequest,
  ip: string,
  route: string,
  maxRequests: number,
  windowSec: number
): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Rate limiting requires service role to operate securely.'
    )
    // If we fail open here, we lose rate limit protection but keep app running.
    // For strict security, we could return false (fail close).
    return true
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_ip: ip,
    p_route: route,
    p_window_sec: windowSec,
    p_max_requests: maxRequests,
  })

  if (error) {
    console.error('Rate limit error:', error)
    return true // fail open
  }

  return data === true
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const aHash = await crypto.subtle.digest('SHA-256', enc.encode(a))
  const bHash = await crypto.subtle.digest('SHA-256', enc.encode(b))

  const aArr = new Uint8Array(aHash)
  const bArr = new Uint8Array(bHash)

  let result = 0
  for (let i = 0; i < aArr.length; i++) {
    result |= aArr[i] ^ bArr[i]
  }
  return result === 0
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Rate limiting for authentication routes
  const authPaths = ['/masuk', '/daftar', '/lupa-password', '/reset-password']
  if (authPaths.some((p) => pathname.startsWith(p) || pathname === `/api/auth/callback`)) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const allowed = await checkRateLimit(request, ip, 'auth', 5, 60) // 5 requests per minute

    if (!allowed) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
          { status: 429 }
        )
      } else {
        return new NextResponse('Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.', {
          status: 429,
          headers: { 'Retry-After': '60' },
        })
      }
    }
  }

  // API v1 Rate Limiting & Auth
  if (pathname.startsWith('/api/v1/')) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const allowed = await checkRateLimit(request, ip, 'api_v1', 60, 60) // 60 requests per minute

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan' } },
        { status: 429, headers: { 'x-api-version': '1.0' } }
      )
    }

    // specific check for M2M endpoints
    if (pathname.startsWith('/api/v1/inventory/sync')) {
      const apiKey = request.headers.get('x-api-key') || ''
      const validKey = process.env.ERP_API_KEY || ''

      let isAuthorized = false
      if (apiKey.length > 0 && validKey.length > 0) {
        isAuthorized = await timingSafeEqual(apiKey, validKey)
      }

      if (!isAuthorized) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API Key' },
          },
          { status: 401, headers: { 'x-api-version': '1.0' } }
        )
      }
    }
  }

  // Continue to updateSession (which internally creates response and passes through)
  const response = await updateSession(request)

  if (pathname.startsWith('/api/v1/')) {
    response.headers.set('x-api-version', '1.0')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (static assets like images)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
