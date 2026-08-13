'use client'

import { SmartLink as Link, SmartImage as Image } from '@/shared/components'
import React from 'react'
import { usePathname } from 'next/navigation'
import { CurrentYear } from '@/shared/components/CurrentYear'

interface AuthLayoutProps {
  children: React.ReactNode
  bgImage?: string
}

const DEFAULT_BG = '/images/auth-login-bg.jpg'

const ROUTE_BG_MAP: Record<string, { image: string; title: string; subtitle: string }> = {
  '/masuk': {
    image: '/images/auth-login-bg.jpg',
    title: 'Elegan dalam Setiap Benang',
    subtitle: 'Show How Really Well-Dressed You Are',
  },
  '/daftar': {
    image: '/images/auth-register-bg.jpg',
    title: 'Bergabung Bersama Kami',
    subtitle: 'Temukan Koleksi Busana Impianmu',
  },
  '/lupa-password': {
    image: '/images/auth-forgot-password-bg.jpg',
    title: 'Pulihkan Akses Akunmu',
    subtitle: 'Kami Siap Membantu Anda Kembali',
  },
  '/reset-password': {
    image: '/images/auth-reset-password-bg.jpg',
    title: 'Pembaruan Kata Sandi',
    subtitle: 'Amankan Akun Anda Dengan Sandi Baru',
  },
}

export function AuthLayout({ children, bgImage }: AuthLayoutProps): React.JSX.Element {
  const pathname = usePathname()
  const routeInfo = ROUTE_BG_MAP[pathname] || {
    image: bgImage || DEFAULT_BG,
    title: 'Elegan dalam Setiap Benang',
    subtitle: 'Show How Really Well-Dressed You Are',
  }
  const currentBg = bgImage || routeInfo.image

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row">
      {/* Brand panel — visible on desktop */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 lg:h-full relative overflow-hidden flex-shrink-0 bg-brand-plum">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={currentBg}
            alt="Auth Background"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Gradient Overlay for Text Legibility & Brand Touch */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-plum/90 via-brand-plum/40 to-brand-plum/30" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Decorative thread wave accent */}
        <div className="absolute -bottom-10 -left-20 w-[140%] h-64 opacity-20 pointer-events-none select-none z-10" aria-hidden="true">
          <Image
            src="/image/svg/decorative/accent-thread-wave.svg"
            alt=""
            fill
            unoptimized
            className="object-contain object-bottom brightness-0 invert"
          />
        </div>

        {/* Decorative accent lines */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent z-10" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

        <div className="relative z-20 flex flex-col justify-between p-12 xl:p-16 w-full text-white">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <div className="relative h-10 w-44">
              <Image
                src="/image/svg/logo/logo-benangbaju.svg"
                alt="Benangbaju"
                fill
                className="object-contain object-left brightness-0 invert"
                priority
              />
            </div>
          </Link>

          <div className="space-y-6 max-w-md">
            <div className="stitch-divider border-white/30">
              <span className="text-[10px] uppercase tracking-[0.25em] font-sans font-bold text-brand-gold">
                {routeInfo.subtitle}
              </span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-sans font-bold uppercase tracking-wider text-white leading-tight drop-shadow-sm">
              {routeInfo.title}
            </h1>
            <p className="text-sm text-white/85 font-sans leading-relaxed drop-shadow-xs">
              Ungkapkan kepribadian dan gaya unikmu dengan menggunakan produk dari Benangbaju yang
              mengedepankan kesederhanaan.
            </p>
          </div>

          <p className="text-[10px] text-white/70 font-sans tracking-wide">
            &copy; <CurrentYear /> Benangbaju
          </p>
        </div>
      </div>

      {/* Form panel */}
      <main className="flex-1 flex flex-col items-center lg:overflow-y-auto lg:h-full bg-brand-cream py-12 px-4 sm:px-6 lg:px-8 section-texture">
        <div className="w-full max-w-md my-auto flex flex-col items-center">
          <Link href="/" className="mb-8 lg:hidden inline-block hover:opacity-80 transition-opacity">
            <div className="relative h-9 w-40">
              <Image
                src="/image/svg/logo/logo-benangbaju.svg"
                alt="Benangbaju"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
