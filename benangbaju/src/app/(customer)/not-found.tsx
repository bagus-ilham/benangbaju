import React from 'react'
import {
  SmartLink as Link,
  Button,
  PageContainer,
  HandDrawnIcon,
  SmartImage as Image,
} from '@/shared/components'

export default function CustomerNotFound(): React.JSX.Element {
  return (
    <PageContainer className="relative flex-1 min-h-[60vh] flex flex-col items-center justify-center text-center px-6 pt-12 pb-24 bg-brand-cream font-sans overflow-hidden">
      {/* Soft pastel ambient orbs */}
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-blue-soft/65 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-brand-gold/35 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-md space-y-6 flex flex-col items-center py-10 z-10">
        <div className="relative p-5 bg-brand-gold-soft/60 border border-brand-gold-stroke/40 rounded-2xl shadow-xs">
          <HandDrawnIcon name="alert-triangle" className="h-10 w-10 text-brand-plum" />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-center gap-2">
            <div
              className="relative w-4 h-2 opacity-40 shrink-0 pointer-events-none select-none"
              aria-hidden="true"
            >
              <Image
                src="/image/svg/decorative/accent-cross-stitch-alt.svg"
                alt=""
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <span className="text-base font-accent font-bold text-brand-blue-text leading-none">
              Benangbaju · 404
            </span>
            <div
              className="relative w-4 h-2 opacity-40 shrink-0 pointer-events-none select-none"
              aria-hidden="true"
            >
              <Image
                src="/image/svg/decorative/accent-cross-stitch-alt.svg"
                alt=""
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-medium tracking-tight text-brand-plum">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs md:text-sm text-neutral-600 leading-relaxed max-w-xs mx-auto pt-1">
            Maaf, halaman atau koleksi yang Anda cari tidak dapat ditemukan, tidak aktif, atau telah
            dipindahkan.
          </p>
        </div>

        <div className="stitch-divider stitch-divider-center w-full" />

        <div className="flex justify-center space-x-3 w-full max-w-xs pt-2">
          <Link href="/" className="flex-1">
            <Button
              variant="accent"
              className="w-full text-[10px] py-3 uppercase tracking-wider font-bold rounded-xl"
            >
              Beranda
            </Button>
          </Link>
          <Link href="/produk" className="flex-1">
            <Button
              variant="outline"
              className="w-full text-[10px] py-3 uppercase tracking-wider font-bold rounded-xl"
            >
              Katalog
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
