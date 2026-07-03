import Link from 'next/link'
import React from 'react'
import { CurrentYear } from '@/shared/components/CurrentYear'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) : React.JSX.Element {
  return (
    <div className="min-h-screen flex">
      {/* Brand panel — visible on desktop */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative bg-brand-black overflow-hidden">
        <div className="absolute inset-0 section-texture opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-black via-brand-dark to-brand-black" />

        {/* Decorative gold accent lines */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-brand-gold/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <Link
            href="/"
            className="font-heading text-sm font-bold tracking-[0.25em] text-white uppercase hover:text-brand-gold-light transition-colors duration-300"
          >
            BENANGBAJU
          </Link>

          <div className="space-y-6 max-w-md">
            <div className="accent-line">
              <span className="text-[10px] uppercase tracking-[0.25em] font-heading font-medium text-brand-gold-light">
                Fashion Muslim Premium
              </span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-heading font-light uppercase tracking-wider text-white leading-tight">
              Elegan dalam Setiap Benang
            </h1>
            <p className="text-sm text-neutral-400 font-sans leading-relaxed">
              Temukan koleksi busana muslim wanita dengan desain minimalis, bahan berkualitas premium, dan kenyamanan sepanjang hari.
            </p>
          </div>

          <p className="text-[10px] text-neutral-500 font-sans tracking-wide">
            &copy; <CurrentYear /> Benangbaju Store
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-brand-cream py-12 px-4 sm:px-6 lg:px-8 section-texture">
        <Link
          href="/"
          className="mb-8 lg:hidden font-heading text-sm font-bold tracking-[0.2em] text-brand-black uppercase hover:text-brand-gold transition-colors"
        >
          BENANGBAJU
        </Link>
        {children}
      </div>
    </div>
  )
}
