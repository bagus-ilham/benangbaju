'use client'

import React from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/shared'
import { SOCIAL_LINKS } from '@/lib/constants'
import toast from 'react-hot-toast'

export function Footer(): React.JSX.Element {
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
              <span className="font-heading text-base font-bold tracking-[0.2em] text-brand-black uppercase">
                BENANGBAJU
              </span>
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
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-neutral-200 text-[10px] font-heading uppercase tracking-wider text-neutral-500 hover:border-brand-gold hover:text-brand-gold transition-all duration-200"
                >
                  IG
                </a>
                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-neutral-200 text-[10px] font-heading uppercase tracking-wider text-neutral-500 hover:border-brand-gold hover:text-brand-gold transition-all duration-200"
                >
                  TT
                </a>
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-neutral-200 text-[10px] font-heading uppercase tracking-wider text-neutral-500 hover:border-brand-gold hover:text-brand-gold transition-all duration-200"
                >
                  WA
                </a>
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
