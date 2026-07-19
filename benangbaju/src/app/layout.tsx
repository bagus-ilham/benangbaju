import '@/lib/env'
import type { Metadata } from 'next'
import { Providers } from '@/shared/providers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import localFont from 'next/font/local'
import './globals.css'

const mulish = localFont({
  variable: '--font-mulish',
  display: 'swap',
  adjustFontFallback: false,
  src: [
    {
      path: '../../public/font/Mulish-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/font/Mulish-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/font/Mulish-SemiBoldItalic.ttf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../../public/font/Mulish-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.benangbaju.com'),
  title: 'Benangbaju — Show How Really Well-Dressed You Are',
  description:
    'Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Benangbaju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.',
  icons: {
    icon: '/logo_favicon.PNG',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="id" className={`${mulish.variable} h-full antialiased`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col font-sans bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>

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
