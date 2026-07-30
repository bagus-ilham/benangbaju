import '@/lib/env'
import type { Metadata } from 'next'
import { Providers } from '@/shared/providers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { Mulish, Caveat } from 'next/font/google'
import './globals.css'

const mulish = Mulish({
  variable: '--font-mulish',
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
})

const caveat = Caveat({
  variable: '--font-caveat',
  display: 'swap',
  subsets: ['latin'],
  weight: ['500', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.benangbaju.com'),
  title: 'Benangbaju — Show How Really Well-Dressed You Are',
  description:
    'Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Benang baju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.',
  icons: {
    icon: '/svg/logo-favicon.svg',
  },
  openGraph: {
    title: 'Benangbaju — Show How Really Well-Dressed You Are',
    description:
      'Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Benang Baju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.',
    url: 'https://www.benangbaju.com',
    siteName: 'Benangbaju',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Benangbaju — Show How Really Well-Dressed You Are',
    description:
      'Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Benang Baju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="id" className={`${mulish.variable} ${caveat.variable} h-full antialiased`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col font-sans bg-brand-cream text-brand-plum selection:bg-brand-gold selection:text-brand-plum"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>

        {/* Phase 1: Vercel Web Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />

        {/* Phase 2: Google Analytics & Tag Manager */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID &&
          process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID !== 'G-XXXXXXX' && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          )}
        {process.env.NEXT_PUBLIC_GTM_CONTAINER_ID &&
          process.env.NEXT_PUBLIC_GTM_CONTAINER_ID !== 'GTM-XXXXXXX' && (
            <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_CONTAINER_ID} />
          )}
      </body>
    </html>
  )
}
