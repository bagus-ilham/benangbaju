import '@/lib/env'
import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.benangbaju.com'),
  title: 'Benangbaju — Fashion Muslim Premium Indonesia',
  description: 'Temukan koleksi busana muslim wanita premium, modern, dan elegan hanya di Benangbaju.',
  icons: {
    icon: '/logo_favicon.PNG',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) : React.JSX.Element {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col font-sans bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white"
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>

        {/* Phase 1: Vercel Web Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />

        {/* TODO: Phase 2 & 3 - Google Analytics (GA4) & Google Tag Manager (GTM)
            Menunggu User membuat akun dan memberikan Measurement ID (G-XXXX) serta GTM ID (GTM-XXXX).
            Instalasi dilakukan menggunakan paket resmi @next/third-parties.
        */}
      </body>
    </html>
  )
}
