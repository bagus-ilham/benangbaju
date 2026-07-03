import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Basic in-memory rate limiting for Edge (Warning: memory resets per isolate/instance)
// In a real production setup with Vercel, this should be replaced with @upstash/ratelimit
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>()

function checkRateLimit(ip: string, maxRequests: number, windowSec: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  // Clean up expired records occasionally to prevent memory leaks in long-running instances
  if (Math.random() < 0.1) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.expiresAt) rateLimitMap.delete(key)
    }
  }

  if (!record || now > record.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowSec * 1000 })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Rate limiting for authentication routes
  const authPaths = ['/masuk', '/daftar', '/lupa-password', '/reset-password']
  if (authPaths.some((p) => pathname.startsWith(p) || pathname === `/api/auth/callback`)) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const allowed = checkRateLimit(ip, 5, 60) // 5 requests per minute

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
    const allowed = checkRateLimit(ip + '_v1', 60, 60) // 60 requests per minute

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan' } },
        { status: 429 }
      )
    }

    // specific check for M2M endpoints
    if (pathname.startsWith('/api/v1/inventory/sync')) {
      const apiKey = request.headers.get('x-api-key')
      const validKey = process.env.ERP_API_KEY

      if (!validKey || apiKey !== validKey) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API Key' },
          },
          { status: 401 }
        )
      }
    }
  }

  // Continue to updateSession (which internally creates response and passes through)
  return await updateSession(request)
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
