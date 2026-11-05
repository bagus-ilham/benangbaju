import '@/lib/env'
import type { Metadata } from 'next'
import { Providers } from '@/shared/providers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { Mulish, Caveat } from 'next/font/google'
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/siteUrl'
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
  metadataBase: new URL(SITE_URL),
  title: 'Benangbaju — Show How Really Well-Dressed You Are',
  description:
    'Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Benang baju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.',
  icons: {
    icon: '/image/svg/logo/logo-favicon.svg',
  },
  openGraph: {
    title: 'Benangbaju — Show How Really Well-Dressed You Are',
    description:
      'Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Benang Baju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.',
    url: SITE_URL,
    siteName: 'Benangbaju',
    locale: 'id_ID',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Benangbaju — Show How Really Well-Dressed You Are',
    description:
      'Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Benang Baju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.',
    images: [DEFAULT_OG_IMAGE],
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
        <Providers>
          {children}
          <Analytics />
          <SpeedInsights />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
          {process.env.NEXT_PUBLIC_GTM_ID && (
            <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
          )}
        </Providers>
      </body>
    </html>
  )
}
