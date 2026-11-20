import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cache for database-driven redirects
// Max size prevents unbounded memory growth in long-lived server processes
const MAX_CACHE_SIZE = 500
const redirectCache = new Map<string, { to_path: string; status_code: number; expiresAt: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute
const NEGATIVE_CACHE_TTL = 10 * 1000 // 10 seconds

export async function updateSession(request: NextRequest): Promise<NextResponse<unknown>> {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Skip database checks for static assets and API routes
  const isStaticAsset =
    /\.(?:ico|png|jpg|jpeg|gif|webp|avif|svg|css|js|woff|woff2|ttf|eot|map|txt|xml|json)$/i.test(
      pathname
    )
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || isStaticAsset) {
    return supabaseResponse
  }

  const buildRedirectTarget = (target: string): URL => {
    if (target.startsWith('http://') || target.startsWith('https://')) {
      return new URL(target)
    }
    return new URL(target.startsWith('/') ? target : `/${target}`, request.nextUrl.origin)
  }

  // Database-driven redirects check with cache
  const cached = redirectCache.get(pathname)
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.to_path) {
      return NextResponse.redirect(buildRedirectTarget(cached.to_path), cached.status_code)
    }
  } else {
    try {
      const { data: redirectData } = await supabase
        .from('redirects')
        .select('to_path, status_code')
        .eq('from_path', pathname)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (redirectCache.size > MAX_CACHE_SIZE) {
        const now = Date.now()
        for (const [key, val] of redirectCache.entries()) {
          if (val.expiresAt < now) {
            redirectCache.delete(key)
          }
        }
        if (redirectCache.size > MAX_CACHE_SIZE) {
          redirectCache.clear()
        }
      }

      if (redirectData) {
        const statusCode = redirectData.status_code || 301
        redirectCache.set(pathname, {
          to_path: redirectData.to_path,
          status_code: statusCode,
          expiresAt: Date.now() + CACHE_TTL,
        })
        return NextResponse.redirect(buildRedirectTarget(redirectData.to_path), statusCode)
      } else {
        // Cache negative lookup (no redirect found)
        redirectCache.set(pathname, {
          to_path: '',
          status_code: 301,
          expiresAt: Date.now() + NEGATIVE_CACHE_TTL,
        })
      }
    } catch (error) {
      console.error('Redirect check error:', error)
    }
  }

  // Refresh session - important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes: redirect to login if not authenticated
  const protectedPaths = ['/akun', '/checkout', '/pesanan']
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/masuk'
    url.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  // Admin routes: redirect if not admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/masuk'
      url.searchParams.set('redirect', '/admin')
      return NextResponse.redirect(url)
    }

    // Check admin role & active status (fetched from profiles)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Middleware] Admin role check failed:', profileError.message, 'User:', user.id)
    }

    const role = profile?.role?.trim()?.toLowerCase()
    if (profile?.is_active === false || (role !== 'admin' && role !== 'staff')) {
      console.warn(
        '[Middleware] Admin access denied. User:',
        user.id,
        'Role:',
        profile?.role ?? 'NULL (no profile found)',
        'Active:',
        profile?.is_active
      )
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Auth pages: redirect to home if already logged in
  const authPaths = ['/masuk', '/daftar', '/lupa-password']
  const isAuthPage = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isAuthPage && user) {
    let redirect = request.nextUrl.searchParams.get('redirect') || '/'
    // Safe redirect validation: must start with / and not //
    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
      redirect = '/'
    }
    return NextResponse.redirect(new URL(redirect, request.nextUrl.origin))
  }

  return supabaseResponse
}
