import React from 'react'
import { SmartLink as Link, Button, PageContainer, HandDrawnIcon, SmartImage as Image } from '@/shared/components'

export default function CustomerNotFound(): React.JSX.Element {
  return (
    <PageContainer className="relative flex-1 min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-brand-cream font-sans overflow-hidden">
      {/* Decorative Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none select-none bg-center bg-repeat"
        style={{ backgroundImage: 'url(/image/svg/decorative/pattern-stitch-card.svg)', backgroundSize: '300px' }}
        aria-hidden="true"
      />

      {/* Decorative Logo Mark Accent Watermark */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 opacity-5 pointer-events-none select-none" aria-hidden="true">
        <Image src="/image/svg/decorative/logo-mark.svg" alt="" fill unoptimized className="object-contain" />
      </div>

      <div className="relative max-w-md space-y-6 flex flex-col items-center py-12 z-10">
        <div className="relative p-4 bg-brand-cream border border-neutral-200/80 rounded-2xl shadow-xs">
          <HandDrawnIcon name="alert-triangle" className="h-10 w-10 text-brand-plum" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="relative w-4 h-2 opacity-40 shrink-0 pointer-events-none select-none" aria-hidden="true">
              <Image src="/image/svg/decorative/accent-cross-stitch-alt.svg" alt="" fill unoptimized className="object-contain" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-sans font-bold text-brand-plum">
              BENANGBAJU
            </span>
            <div className="relative w-4 h-2 opacity-40 shrink-0 pointer-events-none select-none" aria-hidden="true">
              <Image src="/image/svg/decorative/accent-cross-stitch-alt.svg" alt="" fill unoptimized className="object-contain" />
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-heading font-semibold uppercase tracking-wider text-brand-black">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto pt-1">
            Maaf, halaman atau koleksi yang Anda cari tidak dapat ditemukan, tidak aktif, atau telah
            dipindahkan.
          </p>
        </div>

        <div className="stitch-divider stitch-divider-center w-full" />

        <div className="flex justify-center space-x-3 w-full max-w-xs pt-2">
          <Link href="/" className="flex-1">
            <Button
              variant="primary"
              className="w-full text-[10px] py-3 uppercase tracking-wider font-bold rounded-xl"
            >
              Beranda
            </Button>
          </Link>
          <Link href="/produk" className="flex-1">
            <Button
              variant="outline"
              className="w-full text-[10px] py-3 uppercase tracking-wider font-bold border-neutral-200 rounded-xl"
            >
              Katalog
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
