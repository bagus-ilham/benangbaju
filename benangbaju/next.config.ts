import type { NextConfig } from 'next'

const remotePatterns: import('next/dist/shared/lib/image-config').RemotePattern[] = [
  {
    protocol: 'https',
    hostname: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : 'jwvbzuoatffoxaahdwdx.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
]

if (process.env.NODE_ENV === 'development') {
  remotePatterns.unshift({
    protocol: 'http',
    hostname: '127.0.0.1',
    port: '54321',
    pathname: '/storage/v1/object/public/**',
  })
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-API-Version',
            value: '1.0',
          },
          {
            key: 'Content-Security-Policy',
            value:
              `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com https://vercel.live https://vercel.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : 'https://jwvbzuoatffoxaahdwdx.supabase.co'} https://lh3.googleusercontent.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.sandbox.midtrans.com https://app.midtrans.com https://vercel.live https://vercel.com; frame-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com https://vercel.live https://vercel.com;`
                .replace(/\s+/g, ' ')
                .trim(),
          },
        ],
      },
    ]
  },
  cacheComponents: true,
  experimental: {
    viewTransition: true,
  },
}

export default nextConfig
