'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { CurrentYear } from '@/shared/components'

import { useSiteSettings } from '@/shared/hooks/useSiteSettings'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

export function Footer(): React.JSX.Element {
  const { logoUrl, instagramUrl, tiktokUrl, whatsappUrl, shopeeUrl } = useSiteSettings()

  return (
    <footer className="relative bg-brand-cream border-t border-neutral-200/80 pb-20 md:pb-0">
      {/* Stitch Line Divider (LOGO_BENANGBAJU_04.png) */}
      <div className="w-full overflow-hidden h-3 relative opacity-60 pointer-events-none -mt-1.5 mb-2">
        <Image
          src="/LOGO_BENANGBAJU_04.png"
          alt=""
          fill
          className="object-cover object-center"
          aria-hidden="true"
        />
      </div>

      <div className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Col 1: Brand Info */}
            <div className="flex flex-col space-y-4">
              <div className="relative h-9 sm:h-10 md:h-12 w-40 sm:w-44 md:w-48 max-w-full min-w-[96px] animate-fade-in">
                <Image
                  src={getProxiedImageUrl(logoUrl || '/LOGO_BENANGBAJU_07.png')}
                  alt="Benangbaju Logotype"
                  fill
                  sizes="(max-width: 768px) 160px, 200px"
                  className="object-contain object-left"
                />
              </div>
              <div className="flex items-start space-x-3">
                <div className="relative w-8 h-8 shrink-0 opacity-85 mt-0.5">
                  <Image
                    src="/LOGO_BENANGBAJU_09.png"
                    alt="Gulungan Benang"
                    fill
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
              <h4 className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-widest text-brand-black">
                Pelayanan
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/cara-belanja"
                    className="text-xs text-neutral-600 hover:text-brand-accent transition-colors font-sans"
                  >
                    Cara Belanja
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pengiriman"
                    className="text-xs text-neutral-600 hover:text-brand-accent transition-colors font-sans"
                  >
                    Informasi Pengiriman
                  </Link>
                </li>
                <li>
                  <Link
                    href="/retur"
                    className="text-xs text-neutral-600 hover:text-brand-accent transition-colors font-sans"
                  >
                    Kebijakan Pengembalian (Retur)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kontak"
                    className="text-xs text-neutral-600 hover:text-brand-accent transition-colors font-sans"
                  >
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Kebijakan & Hukum */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-widest text-brand-black">
                Informasi
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/syarat-ketentuan"
                    className="text-xs text-neutral-600 hover:text-brand-accent transition-colors font-sans"
                  >
                    Syarat & Ketentuan
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kebijakan-privasi"
                    className="text-xs text-neutral-600 hover:text-brand-accent transition-colors font-sans"
                  >
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tentang"
                    className="text-xs text-neutral-600 hover:text-brand-accent transition-colors font-sans"
                  >
                    Tentang Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Social */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-widest text-brand-black">
                Ikuti Kami
              </h4>
              <p className="text-xs text-neutral-500 font-sans mt-1">
                Temukan inspirasi gaya unik di media sosial kami.
              </p>
              <div className="flex space-x-3 pt-1">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="Instagram"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="TikTok"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                  </a>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="WhatsApp"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </a>
                )}
                {shopeeUrl && (
                  <a
                    href={shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="Shopee"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.2 7h-2.12c-.52-2.76-2.58-4.8-5.08-4.8s-4.56 2.04-5.08 4.8H4.8c-.99 0-1.8.81-1.8 1.8v10.4c0 .99.81 1.8 1.8 1.8h14.4c.99 0 1.8-.81 1.8-1.8V8.8c0-.99-.81-1.8-1.8-1.8zm-7.2-3c1.47 0 2.7 1.25 3.08 3H8.92c.38-1.75 1.61-3 3.08-3zm7.2 15.2H4.8V8.8h14.4v10.4zm-10.2-7.2c0-.99.81-1.8 1.8-1.8s1.8.81 1.8 1.8v1.2c0 .99-.81 1.8-1.8 1.8s-1.8-.81-1.8-1.8v-1.2z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p className="text-[11px] text-neutral-400 font-sans">
              &copy; <CurrentYear /> Benangbaju. All rights reserved.
            </p>
            <div className="flex space-x-6 text-[10px] text-neutral-400 font-heading uppercase tracking-wider">
              <Link href="/syarat-ketentuan" className="hover:text-brand-accent transition-colors">
                Syarat
              </Link>
              <Link href="/kebijakan-privasi" className="hover:text-brand-accent transition-colors">
                Privasi
              </Link>
              <Link href="/kontak" className="hover:text-brand-accent transition-colors">
                Kontak
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
