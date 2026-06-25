import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'jwvbzuoatffoxaahdwdx.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
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
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://jwvbzuoatffoxaahdwdx.supabase.co https://lh3.googleusercontent.com; connect-src 'self' https://jwvbzuoatffoxaahdwdx.supabase.co wss://jwvbzuoatffoxaahdwdx.supabase.co https://app.sandbox.midtrans.com https://app.midtrans.com; frame-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com;"
          },
        ],
      },
    ]
  },
  experimental: {
    viewTransition: true,
    cacheComponents: true,
  }
};

export default nextConfig;
