'use client'

import React from 'react'
import {
  SmartLink as Link,
  CurrentYear,
  SmartImage as Image,
  HandDrawnIcon,
  ScallopEdge,
} from '@/shared/components'

import { useSiteSettings } from '@/shared/hooks/useSiteSettings'
import { getProxiedImageUrl } from '@/lib/getImageUrl'
import { useMarket } from '@/shared/stores/marketStore'

export function Footer(): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'
  const { logoUrl, instagramUrl, tiktokUrl, whatsappUrl, shopeeUrl, shopeeMyUrl } = useSiteSettings()
  const activeShopeeUrl = isMY ? shopeeMyUrl : shopeeUrl

  return (
    <footer className="relative bg-brand-gold text-brand-plum pt-4 pb-20 md:pb-0">
      {/* Upward scalloped top edge rising organically into whatever section sits above */}
      <ScallopEdge
        direction="up"
        fill="var(--color-brand-gold)"
        stroke="var(--color-brand-gold-stroke)"
        strokeOpacity={0.55}
        tileWidth={32}
        height={12}
        className="absolute left-0 right-0 bottom-full mb-[-1px] pointer-events-none z-10"
      />

      <div className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Col 1: Brand Info */}
            <div className="flex flex-col space-y-4">
              <div className="relative h-8 sm:h-9 md:h-10 w-36 sm:w-40 md:w-44 max-w-full min-w-[96px] animate-fade-in">
                <Image
                  src={getProxiedImageUrl(logoUrl || '/image/svg/logo/logo-benangbaju.svg')}
                  fallbackSrc="/image/svg/logo/logo-benangbaju.svg"
                  alt="Benangbaju Logotype"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 150px, 180px"
                  className="object-contain object-left"
                />
              </div>
              <div className="flex items-start space-x-3">
                <div className="relative w-8 h-8 shrink-0 opacity-90 mt-0.5">
                  <Image
                    src="/image/svg/logo/logo-jarum-benang.svg"
                    alt="Gulungan Benang"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-brand-plum/80 leading-relaxed max-w-xs font-sans">
                  {isMY
                    ? 'Benangbaju is here to help you express your true self through simple yet distinctively crafted daily apparel.'
                    : 'Benangbaju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.'}
                </p>
              </div>
            </div>

            {/* Col 2: Pelayanan Pelanggan */}
            <div className="flex flex-col space-y-3">
              <p className="text-sm font-serif font-medium tracking-tight text-brand-plum">
                {isMY ? 'Customer Care' : 'Pelayanan'}
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/cara-belanja"
                    className="text-xs text-brand-plum/80 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    {isMY ? 'How to Shop' : 'Cara Belanja'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pengiriman"
                    className="text-xs text-brand-plum/80 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    {isMY ? 'Shipping Information' : 'Informasi Pengiriman'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/retur"
                    className="text-xs text-brand-plum/80 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    {isMY ? 'Return Policy' : 'Kebijakan Pengembalian (Retur)'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kontak"
                    className="text-xs text-brand-plum/80 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    {isMY ? 'Contact Us' : 'Hubungi Kami'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Kebijakan & Hukum */}
            <div className="flex flex-col space-y-3">
              <p className="text-sm font-serif font-medium tracking-tight text-brand-plum">
                {isMY ? 'Information' : 'Informasi'}
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/syarat-ketentuan"
                    className="text-xs text-brand-plum/80 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    {isMY ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kebijakan-privasi"
                    className="text-xs text-brand-plum/80 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    {isMY ? 'Privacy Policy' : 'Kebijakan Privasi'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tentang"
                    className="text-xs text-brand-plum/80 hover:text-brand-plum transition-colors font-sans nav-link-underline inline-block"
                  >
                    {isMY ? 'About Us' : 'Tentang Kami'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Social */}
            <div className="flex flex-col space-y-3">
              <p className="text-sm font-serif font-medium tracking-tight text-brand-plum">
                {isMY ? 'Follow Us' : 'Ikuti Kami'}
              </p>
              <p className="text-xs text-brand-plum/80 font-sans mt-1">
                {isMY
                  ? 'Discover style inspiration on our social channels.'
                  : 'Temukan inspirasi gaya unik di media sosial kami.'}
              </p>
              <div className="flex space-x-2.5 pt-1">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-brand-cream/75 border border-brand-plum/15 text-brand-plum hover:bg-brand-cream hover:border-brand-plum/30 hover:-translate-y-0.5 transition-all duration-200 rounded-xl flex items-center justify-center shadow-2xs"
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
                    className="p-2.5 bg-brand-cream/75 border border-brand-plum/15 text-brand-plum hover:bg-brand-cream hover:border-brand-plum/30 hover:-translate-y-0.5 transition-all duration-200 rounded-xl flex items-center justify-center shadow-2xs"
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
                    className="p-2.5 bg-brand-cream/75 border border-brand-plum/15 text-brand-plum hover:bg-brand-cream hover:border-brand-plum/30 hover:-translate-y-0.5 transition-all duration-200 rounded-xl flex items-center justify-center shadow-2xs"
                    aria-label="WhatsApp"
                  >
                    <HandDrawnIcon name="whatsapp" className="w-4 h-4" />
                  </a>
                )}
                {activeShopeeUrl && (
                  <a
                    href={activeShopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-brand-cream/75 border border-brand-plum/15 text-brand-plum hover:bg-brand-cream hover:border-brand-plum/30 hover:-translate-y-0.5 transition-all duration-200 rounded-xl flex items-center justify-center shadow-2xs"
                    aria-label={isMY ? 'Shopee Malaysia' : 'Shopee'}
                  >
                    <HandDrawnIcon name="shopee" className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Decorative Stitch Line Divider */}
          <div
            className="mt-10 pt-4 flex justify-center opacity-45 select-none pointer-events-none"
            aria-hidden="true"
          >
            <Image
              src="/image/svg/decorative/divider-stitch-line.svg"
              alt=""
              width={1000}
              height={30}
              className="w-full max-w-4xl h-auto object-contain"
              unoptimized
            />
          </div>

          <div className="border-t border-brand-plum/15 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p className="text-[11px] text-brand-plum/75 font-sans">
              &copy; <CurrentYear /> Benangbaju. All rights reserved.
            </p>
            <div className="flex space-x-6 text-[10px] text-brand-plum/75 font-sans font-bold uppercase tracking-wider">
              <Link
                href="/syarat-ketentuan"
                className="hover:text-brand-plum transition-colors nav-link-underline"
              >
                {isMY ? 'Terms' : 'Syarat'}
              </Link>
              <Link
                href="/kebijakan-privasi"
                className="hover:text-brand-plum transition-colors nav-link-underline"
              >
                {isMY ? 'Privacy' : 'Privasi'}
              </Link>
              <Link
                href="/kontak"
                className="hover:text-brand-plum transition-colors nav-link-underline"
              >
                {isMY ? 'Contact' : 'Kontak'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
