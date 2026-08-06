import { SmartLink as Link, SmartImage as Image } from '@/shared/components'
import React from 'react'
import { CurrentYear } from '@/shared/components/CurrentYear'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen flex">
      {/* Brand panel — visible on desktop */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative bg-brand-gold overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-gold via-[#fdf4cf] to-brand-gold" />

        {/* Decorative thread wave accent */}
        <div className="absolute -bottom-10 -left-20 w-[140%] h-64 opacity-15 pointer-events-none select-none" aria-hidden="true">
          <Image
            src="/svg/accent-thread-wave.svg"
            alt=""
            fill
            unoptimized
            className="object-contain object-bottom"
          />
        </div>

        {/* Decorative accent lines */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-brand-plum/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-plum/30 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <Link
            href="/"
            className="font-sans text-sm font-bold tracking-[0.25em] text-brand-plum uppercase hover:opacity-80 transition-colors duration-300"
          >
            BENANGBAJU
          </Link>

          <div className="space-y-6 max-w-md">
            <div className="stitch-divider">
              <span className="text-[10px] uppercase tracking-[0.25em] font-sans font-bold text-brand-plum">
                Show How Really Well-Dressed You Are
              </span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-sans font-bold uppercase tracking-wider text-brand-plum leading-tight">
              Elegan dalam Setiap Benang
            </h1>
            <p className="text-sm text-brand-plum/80 font-sans leading-relaxed">
              Ungkapkan kepribadian dan gaya unikmu dengan menggunakan produk dari Benangbaju yang
              mengedepankan kesederhanaan.
            </p>
          </div>

          <p className="text-[10px] text-brand-plum/60 font-sans tracking-wide">
            &copy; <CurrentYear /> Benangbaju
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-brand-cream py-12 px-4 sm:px-6 lg:px-8 section-texture">
        <Link
          href="/"
          className="mb-8 lg:hidden font-sans text-sm font-bold tracking-[0.2em] text-brand-plum uppercase hover:text-brand-blue transition-colors"
        >
          BENANGBAJU
        </Link>
        {children}
      </div>
    </div>
  )
}
