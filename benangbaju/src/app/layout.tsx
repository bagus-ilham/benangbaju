import '@/lib/env'
import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
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
  title: 'Benangbaju — Fashion Muslim Premium Indonesia',
  description: 'Temukan koleksi busana muslim wanita premium, modern, dan elegan hanya di Benangbaju.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
