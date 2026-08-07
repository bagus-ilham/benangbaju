import React from 'react'
import { Metadata } from 'next'
import { PageContainer, PageHero, HandDrawnIcon } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Hubungi Kami — Benangbaju',
  description: 'Tim customer service Benangbaju siap membantu informasi produk, ukuran, pengiriman, dan retur.',
}

export default function KontakPage(): React.JSX.Element {
  const whatsappNumber = '6285179747449'
  const whatsappMessage = encodeURIComponent(
    'Halo Benangbaju, saya ingin bertanya tentang produk / pesanan saya.'
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow="Layanan Pelanggan"
        title="Hubungi Kami"
        subtitle="Tim customer service kami siap membantu informasi produk, ukuran, pengiriman, dan retur."
      />
      <PageContainer size="md" className="py-12 space-y-12 page-content">
        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Contact Details Card */}
          <div className="border border-neutral-200/80 p-8 space-y-6 bg-brand-cream rounded-2xl shadow-xs animate-slide-up">
            <h3 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs border-b border-neutral-100 pb-3">
              Layanan Pelanggan
            </h3>

            <div className="space-y-4 text-xs font-medium text-neutral-600">
              <div className="flex items-start space-x-3">
                <HandDrawnIcon name="clock" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">Jam Operasional</p>
                  <p>Senin – Jumat: 08:00 – 15:00 WIB</p>
                  <p>Sabtu: 09:00 – 14:00 WIB</p>
                  <p className="text-neutral-400 mt-1">Minggu &amp; Hari Libur Nasional: Libur</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <HandDrawnIcon name="mail" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">Surel (Email)</p>
                  <a
                    href="mailto:support@benangbaju.com"
                    className="hover:text-brand-plum underline transition-colors"
                  >
                    support@benangbaju.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <HandDrawnIcon name="map-pin" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">Warehouse</p>
                  <p>Benangbaju Warehouse</p>
                  <p>Jl. Sarimadu Barat No. 155B, Sukawarna, Kecamatan Sukajadi</p>
                  <p>Kota Bandung, Jawa Barat 40164</p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp CTA Card */}
          <div className="border border-neutral-200/80 p-8 flex flex-col justify-between space-y-6 bg-brand-cream rounded-2xl shadow-xs animate-slide-up">
            <div className="space-y-4">
              <h3 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs border-b border-neutral-200/60 pb-3">
                Respon Cepat via WhatsApp
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Dapatkan bantuan langsung dari tim customer support kami terkait kendala transaksi,
                konfirmasi pembayaran, atau bantuan retur melalui WhatsApp chat. Kami akan membalas
                pesan Anda sesegera mungkin selama jam kerja.
              </p>
            </div>

            <div className="pt-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center space-x-2 bg-brand-blue text-brand-plum hover:bg-[#83a3aa] px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-widest transition-all duration-300 rounded-xl shadow-xs hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
              >
                <HandDrawnIcon name="whatsapp" className="h-4 w-4" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Philosophy Footer quote */}
        <div className="border-t border-neutral-100 pt-8 text-center text-xs text-neutral-400 uppercase tracking-widest font-bold font-sans animate-fade-in">
          &ldquo;We value your experience. Let us know how we can assist you.&rdquo;
        </div>
      </PageContainer>
    </div>
  )
}
