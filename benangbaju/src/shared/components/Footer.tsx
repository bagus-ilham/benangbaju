'use client'

import React from 'react'
import { SmartLink as Link, CurrentYear, SmartImage as Image, HandDrawnIcon } from '@/shared/components'

import { useSiteSettings } from '@/shared/hooks/useSiteSettings'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

export function Footer(): React.JSX.Element {
  const { logoUrl, instagramUrl, tiktokUrl, whatsappUrl, shopeeUrl } = useSiteSettings()

  return (
    <footer className="relative bg-brand-cream border-t border-neutral-200/80 pb-20 md:pb-0">

      <div className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Col 1: Brand Info */}
            <div className="flex flex-col space-y-4">
              <div className="relative h-9 sm:h-10 md:h-12 w-40 sm:w-44 md:w-48 max-w-full min-w-[96px] animate-fade-in">
                <Image
                  src={getProxiedImageUrl(logoUrl || '/image/svg/logo/logo-benangbaju.svg')}
                  fallbackSrc="/image/svg/logo/logo-benangbaju.svg"
                  alt="Benangbaju Logotype"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 160px, 200px"
                  className="object-contain object-left"
                />
              </div>
              <div className="flex items-start space-x-3">
                <div className="relative w-8 h-8 shrink-0 opacity-85 mt-0.5">
                  <Image
                    src="/image/svg/logo/logo-jarum-benang.svg"
                    alt="Gulungan Benang"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed max-w-xs font-sans">
                  Benangbaju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan
                  diri lewat sepotong pakaian yang sederhana namun unik.
                </p>
              </div>
            </div>

            {/* Col 2: Pelayanan Pelanggan */}
            <div className="flex flex-col space-y-3">
              <p className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-widest text-brand-plum">
                Pelayanan
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/cara-belanja"
                    className="text-xs text-neutral-600 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    Cara Belanja
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pengiriman"
                    className="text-xs text-neutral-600 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    Informasi Pengiriman
                  </Link>
                </li>
                <li>
                  <Link
                    href="/retur"
                    className="text-xs text-neutral-600 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    Kebijakan Pengembalian (Retur)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kontak"
                    className="text-xs text-neutral-600 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Kebijakan & Hukum */}
            <div className="flex flex-col space-y-3">
              <p className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-widest text-brand-plum">
                Informasi
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/syarat-ketentuan"
                    className="text-xs text-neutral-600 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    Syarat & Ketentuan
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kebijakan-privasi"
                    className="text-xs text-neutral-600 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tentang"
                    className="text-xs text-neutral-600 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    Tentang Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Social */}
            <div className="flex flex-col space-y-3">
              <p className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-widest text-brand-plum">
                Ikuti Kami
              </p>
              <p className="text-xs text-neutral-600 font-sans mt-1">
                Temukan inspirasi gaya unik di media sosial kami.
              </p>
              <div className="flex space-x-3 pt-1">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-amber-300 hover:text-brand-plum hover:bg-brand-gold/40 transition-all duration-200 rounded-lg flex items-center justify-center"
                    aria-label="Instagram"
                  >
                    <HandDrawnIcon name="instagram" className="w-4 h-4" />
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-amber-300 hover:text-brand-plum hover:bg-brand-gold/40 transition-all duration-200 rounded-lg flex items-center justify-center"
                    aria-label="TikTok"
                  >
                    <HandDrawnIcon name="tiktok" className="w-4 h-4" />
                  </a>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-amber-300 hover:text-brand-plum hover:bg-brand-gold/40 transition-all duration-200 rounded-lg flex items-center justify-center"
                    aria-label="WhatsApp"
                  >
                    <HandDrawnIcon name="whatsapp" className="w-4 h-4" />
                  </a>
                )}
                {shopeeUrl && (
                  <a
                    href={shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-amber-300 hover:text-brand-plum hover:bg-brand-gold/40 transition-all duration-200 rounded-lg flex items-center justify-center"
                    aria-label="Shopee"
                  >
                    <HandDrawnIcon name="shopee" className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Decorative Stitch Line Divider */}
          <div className="mt-10 pt-4 flex justify-center opacity-40 select-none pointer-events-none" aria-hidden="true">
            <Image
              src="/image/svg/decorative/divider-stitch-line.svg"
              alt=""
              width={1000}
              height={30}
              className="w-full max-w-4xl h-auto object-contain"
              unoptimized
            />
          </div>

          <div className="border-t border-neutral-200/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p className="text-[11px] text-neutral-600 font-sans">
              &copy; <CurrentYear /> Benangbaju. All rights reserved.
            </p>
            <div className="flex space-x-6 text-[10px] text-neutral-600 font-sans font-bold uppercase tracking-wider">
              <Link href="/syarat-ketentuan" className="hover:text-brand-plum transition-colors nav-link-underline">
                Syarat
              </Link>
              <Link href="/kebijakan-privasi" className="hover:text-brand-plum transition-colors nav-link-underline">
                Privasi
              </Link>
              <Link href="/kontak" className="hover:text-brand-plum transition-colors nav-link-underline">
                Kontak
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
