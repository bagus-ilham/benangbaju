'use client'

import React from 'react'
import { PageContainer, PageHero, HandDrawnIcon } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'

export function KontakClient(): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  const whatsappNumber = '6285179747449'
  const whatsappMessage = encodeURIComponent(
    isMY
      ? 'Hello Benangbaju, I would like to inquire about your apparel / my order.'
      : 'Halo Benangbaju, saya ingin bertanya tentang produk / pesanan saya.'
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow={isMY ? 'Customer Care' : 'Layanan Pelanggan'}
        title={isMY ? 'Contact Us' : 'Hubungi Kami'}
        subtitle={
          isMY
            ? 'Our customer service team is ready to assist with sizing guides (CM/INCH), West Malaysia shipping, and order inquiries.'
            : 'Tim customer service kami siap membantu informasi produk, panduan ukuran (CM/INCH), pengiriman domestik & Malaysia, serta kendala pesanan.'
        }
      />
      <PageContainer size="md" className="py-12 space-y-12 page-content">
        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Contact Details Card */}
          <div className="border border-neutral-200/80 p-8 space-y-6 bg-brand-cream rounded-2xl shadow-xs animate-slide-up">
            <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs border-b border-neutral-100 pb-3">
              {isMY ? 'Customer Care & Operating Hours' : 'Layanan Pelanggan & Jam Operasional'}
            </h2>
            <div className="space-y-4 text-xs font-medium text-neutral-600">
              <div className="flex items-start space-x-3">
                <HandDrawnIcon name="clock" className="h-4 w-4 shrink-0 mt-0.5 text-brand-plum" />
                <div>
                  <p className="font-bold text-brand-plum mb-1">
                    {isMY ? 'Operating Hours (Dual Timezone)' : 'Jam Operasional (Dual Timezone)'}
                  </p>
                  <p className="font-medium text-neutral-700">
                    {isMY ? 'Monday – Friday: ' : 'Senin – Jumat: '}
                    <span className="font-bold text-neutral-900">08:00 – 15:00 WIB</span>{' '}
                    <span className="text-neutral-500 text-[11px]">/ 09:00 – 16:00 MYT (GMT+8)</span>
                  </p>
                  <p className="font-medium text-neutral-700 mt-0.5">
                    {isMY ? 'Saturday: ' : 'Sabtu: '}
                    <span className="font-bold text-neutral-900">09:00 – 14:00 WIB</span>{' '}
                    <span className="text-neutral-500 text-[11px]">/ 10:00 – 15:00 MYT (GMT+8)</span>
                  </p>
                  <p className="text-neutral-500 mt-1.5 text-[11px]">
                    {isMY ? 'Sunday & Public Holidays: Closed' : 'Minggu & Hari Libur Nasional: Libur'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <HandDrawnIcon name="mail" className="h-4 w-4 shrink-0 mt-0.5 text-brand-plum" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">Email</p>
                  <a
                    href="mailto:support@benangbaju.com"
                    className="hover:underline hover:text-brand-plum transition text-neutral-600"
                  >
                    support@benangbaju.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <HandDrawnIcon name="map-pin" className="h-4 w-4 shrink-0 mt-0.5 text-brand-plum" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">
                    {isMY ? 'Atelier & Warehouse Address' : 'Lokasi Gudang & Workshop'}
                  </p>
                  <p className="text-neutral-500 leading-relaxed font-sans text-[11px]">
                    Jl. Sukajadi No. 120, Kota Bandung, Jawa Barat 40164, Indonesia
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Help Card */}
          <div className="border border-neutral-200/80 p-8 space-y-6 bg-brand-cream rounded-2xl shadow-xs animate-slide-up flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs border-b border-neutral-100 pb-3">
                {isMY ? 'Instant WhatsApp Consultation' : 'Konsultasi Instan WhatsApp'}
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                {isMY
                  ? 'Need sizing advice in inches or have questions regarding cross-border shipping to Malaysia? Chat directly with our customer support.'
                  : 'Punya pertanyaan mengenai ukuran, bahan pakaian, atau kendala pemesanan? Hubungi admin customer care kami melalui WhatsApp untuk respon cepat.'}
              </p>
            </div>

            <div className="pt-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-xs gap-2"
              >
                <HandDrawnIcon name="whatsapp" className="h-4 w-4" />
                <span>{isMY ? 'Chat on WhatsApp' : 'Hubungi via WhatsApp'}</span>
              </a>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
