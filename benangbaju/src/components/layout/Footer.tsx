import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button, Input } from '@/components/shared'
import { SOCIAL_LINKS } from '@/lib/constants'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import { getSiteSettings } from '@/services/settings'

export function Footer(): React.JSX.Element {
  const supabase = createBrowserClient()
  const { data: settings = [] } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => getSiteSettings(supabase),
  })

  const logoSetting = settings.find((s) => s.key === 'store_logo_url')
  const logoUrl = logoSetting?.value && logoSetting.value.trim() !== '' ? logoSetting.value : null

  const instagramSetting = settings.find((s) => s.key === 'social_instagram' || s.key === 'instagram_username')
  const tiktokSetting = settings.find((s) => s.key === 'social_tiktok' || s.key === 'tiktok_username')
  const whatsappSetting = settings.find((s) => s.key === 'store_whatsapp' || s.key === 'whatsapp_number')
  const shopeeSetting = settings.find((s) => s.key === 'social_shopee')

  const instagramUrl = instagramSetting?.value
    ? (instagramSetting.value.startsWith('http') ? instagramSetting.value : `https://instagram.com/${instagramSetting.value}`)
    : SOCIAL_LINKS.instagram

  const tiktokUrl = tiktokSetting?.value
    ? (tiktokSetting.value.startsWith('http') ? tiktokSetting.value : `https://tiktok.com/@${tiktokSetting.value}`)
    : SOCIAL_LINKS.tiktok

  const whatsappUrl = whatsappSetting?.value
    ? (whatsappSetting.value.startsWith('http') ? whatsappSetting.value : `https://wa.me/${whatsappSetting.value}`)
    : SOCIAL_LINKS.whatsapp

  const shopeeUrl = shopeeSetting?.value
    ? (shopeeSetting.value.startsWith('http') ? shopeeSetting.value : `https://shopee.co.id/${shopeeSetting.value}`)
    : SOCIAL_LINKS.shopee

  return (
    <footer className="bg-brand-cream border-t border-neutral-200">
      {/* Newsletter CTA band */}
      <div className="border-b border-neutral-200 bg-brand-black py-12 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-heading font-medium text-brand-gold-light">
            Tetap Terhubung
          </span>
          <h3 className="text-lg md:text-xl font-heading font-light uppercase tracking-wider text-white">
            Dapatkan Info Koleksi Terbaru
          </h3>
          <p className="text-xs text-neutral-400 font-sans max-w-md mx-auto">
            Berlangganan newsletter untuk promo eksklusif dan akses early ke koleksi baru.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              toast.success('Terima kasih! Fitur newsletter segera hadir.')
            }}
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2"
          >
            <Input
              type="email"
              label="Email"
              placeholder="Email Anda"
              required
              className="flex-1 [&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder:text-neutral-500 [&_label]:text-neutral-400"
            />
            <Button type="submit" variant="primary" size="sm" className="sm:self-end bg-white text-brand-black border-white hover:bg-brand-gold hover:text-white hover:border-brand-gold transition-all duration-300">
              Daftar
            </Button>
          </form>
        </div>
      </div>

      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Col 1: Brand Info */}
            <div className="flex flex-col space-y-4">
              {logoUrl ? (
                <div className="relative h-10 md:h-14 w-full max-w-[200px] animate-fade-in">
                  <Image
                    src={logoUrl}
                    alt="Benangbaju Logo"
                    fill
                    sizes="200px"
                    className="object-contain object-left"
                  />
                </div>
              ) : (
                <span className="font-heading text-base font-bold tracking-[0.2em] text-brand-black uppercase">
                  BENANGBAJU
                </span>
              )}
              <p className="text-[11px] text-neutral-500 leading-relaxed max-w-xs font-sans">
                Benangbaju menghadirkan fashion muslim premium modern untuk wanita Indonesia dengan desain minimalis, bahan berkualitas, dan kenyamanan terbaik.
              </p>
            </div>

            {/* Col 2: Pelayanan Pelanggan */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-black">
                Pelayanan
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/cara-belanja" className="text-[11px] text-neutral-500 hover:text-brand-gold transition-colors font-sans">
                    Cara Belanja
                  </Link>
                </li>
                <li>
                  <Link href="/pengiriman" className="text-[11px] text-neutral-500 hover:text-brand-gold transition-colors font-sans">
                    Informasi Pengiriman
                  </Link>
                </li>
                <li>
                  <Link href="/retur" className="text-[11px] text-neutral-500 hover:text-brand-gold transition-colors font-sans">
                    Kebijakan Pengembalian (Retur)
                  </Link>
                </li>
                <li>
                  <Link href="/kontak" className="text-[11px] text-neutral-500 hover:text-brand-gold transition-colors font-sans">
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Kebijakan & Hukum */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-black">
                Informasi
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/syarat-ketentuan" className="text-[11px] text-neutral-500 hover:text-brand-gold transition-colors font-sans">
                    Syarat & Ketentuan
                  </Link>
                </li>
                <li>
                  <Link href="/kebijakan-privasi" className="text-[11px] text-neutral-500 hover:text-brand-gold transition-colors font-sans">
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link href="/tentang" className="text-[11px] text-neutral-500 hover:text-brand-gold transition-colors font-sans">
                    Tentang Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Social */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-black">
                Ikuti Kami
              </h4>
              <p className="text-[11px] text-neutral-500 font-sans">
                Temukan inspirasi gaya modest di media sosial kami.
              </p>
              <div className="flex space-x-3 pt-1">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="Instagram"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="TikTok"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                  </a>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </a>
                )}
                {shopeeUrl && (
                  <a
                    href={shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="Shopee"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.2 7h-2.12c-.52-2.76-2.58-4.8-5.08-4.8s-4.56 2.04-5.08 4.8H4.8c-.99 0-1.8.81-1.8 1.8v10.4c0 .99.81 1.8 1.8 1.8h14.4c.99 0 1.8-.81 1.8-1.8V8.8c0-.99-.81-1.8-1.8-1.8zm-7.2-3c1.47 0 2.7 1.25 3.08 3H8.92c.38-1.75 1.61-3 3.08-3zm7.2 15.2H4.8V8.8h14.4v10.4zm-10.2-7.2c0-.99.81-1.8 1.8-1.8s1.8.81 1.8 1.8v1.2c0 .99-.81 1.8-1.8 1.8s-1.8-.81-1.8-1.8v-1.2z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-[10px] text-neutral-400 font-sans">
              &copy; {new Date().getFullYear()} Benangbaju Store. All rights reserved.
            </p>
            <div className="flex space-x-6 text-[10px] text-neutral-400 font-heading uppercase tracking-wider">
              <Link href="/syarat-ketentuan" className="hover:text-brand-gold transition-colors">Syarat</Link>
              <Link href="/kebijakan-privasi" className="hover:text-brand-gold transition-colors">Privasi</Link>
              <Link href="/kontak" className="hover:text-brand-gold transition-colors">Kontak</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
