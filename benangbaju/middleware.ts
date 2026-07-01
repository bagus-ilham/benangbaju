import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rate limiting for authentication routes
  const authPaths = ['/masuk', '/daftar', '/lupa-password', '/reset-password']
  if (authPaths.some(p => pathname.startsWith(p) || pathname === `/api/auth/callback`)) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const allowed = checkRateLimit(ip, 5, 60) // 5 requests per minute
    
    if (!allowed) {
      // If it's an API route, return JSON. If it's a page, redirect to a too-many-requests page or return a response.
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, { status: 429 })
      } else {
        // Return 429 page
        return new NextResponse(
          'Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.',
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Apply to auth pages and auth api routes
    '/masuk',
    '/daftar',
    '/lupa-password',
    '/reset-password',
    '/api/auth/:path*'
  ],
}
