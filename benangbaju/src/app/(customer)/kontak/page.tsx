import React from 'react'
import { Metadata } from 'next'
import { PageContainer, PageHero, HandDrawnIcon } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Hubungi Kami — Benangbaju',
  description:
    'Tim customer service Benangbaju siap membantu informasi produk, ukuran, pengiriman domestik & internasional Malaysia, dan layanan purnajual.',
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
        subtitle="Tim customer service kami siap membantu informasi produk, panduan ukuran (CM/INCH), pengiriman domestik & Malaysia, serta kendala pesanan."
      />
      <PageContainer size="md" className="py-12 space-y-12 page-content">
        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Contact Details Card */}
          <div className="border border-neutral-200/80 p-8 space-y-6 bg-brand-cream rounded-2xl shadow-xs animate-slide-up">
            <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs border-b border-neutral-100 pb-3">
              Layanan Pelanggan & Jam Operasional
            </h2>
            <div className="space-y-4 text-xs font-medium text-neutral-600">
              <div className="flex items-start space-x-3">
                <HandDrawnIcon name="clock" className="h-4 w-4 shrink-0 mt-0.5 text-brand-plum" />
                <div>
                  <p className="font-bold text-brand-plum mb-1">Jam Operasional (Dual Timezone)</p>
                  <p className="font-medium text-neutral-700">
                    Senin – Jumat: <span className="font-bold text-neutral-900">08:00 – 15:00 WIB</span>{' '}
                    <span className="text-neutral-500 text-[11px]">/ 09:00 – 16:00 MYT (GMT+8)</span>
                  </p>
                  <p className="font-medium text-neutral-700 mt-0.5">
                    Sabtu: <span className="font-bold text-neutral-900">09:00 – 14:00 WIB</span>{' '}
                    <span className="text-neutral-500 text-[11px]">/ 10:00 – 15:00 MYT (GMT+8)</span>
                  </p>
                  <p className="text-neutral-500 mt-1.5 text-[11px]">
                    Minggu &amp; Hari Libur Nasional: Libur
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <HandDrawnIcon name="mail" className="h-4 w-4 shrink-0 mt-0.5 text-brand-plum" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">Surel (Email)</p>
                  <a
                    href="mailto:cs@benangbaju.com"
                    className="hover:text-brand-plum underline transition-colors"
                  >
                    cs@benangbaju.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <HandDrawnIcon name="map-pin" className="h-4 w-4 shrink-0 mt-0.5 text-brand-plum" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">Gudang &amp; Distribusi Pusat</p>
                  <p>Benangbaju Central Warehouse</p>
                  <p>Jl. Sarimadu Barat No. 155B, Sukawarna, Kecamatan Sukajadi</p>
                  <p>Kota Bandung, Jawa Barat 40164, Indonesia</p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp CTA Card */}
          <div className="border border-neutral-200/80 p-8 flex flex-col justify-between space-y-6 bg-brand-cream rounded-2xl shadow-xs animate-slide-up">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs">
                  Respon Cepat via WhatsApp
                </h2>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  🇮🇩 ID &amp; 🇲🇾 MY
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Dapatkan bantuan langsung dari tim customer support kami terkait kendala transaksi,
                konfirmasi pembayaran QRIS Cross-Border (DuitNow), panduan ukuran internasional,
                atau klaim kendala paket melalui WhatsApp chat. Kami melayani pembeli dari Indonesia
                maupun Malaysia selama jam operasional kerja.
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
                <span>Hubungi via WhatsApp CS</span>
              </a>
            </div>
          </div>
        </div>

        {/* Philosophy Footer quote */}
        <div className="border-t border-neutral-100 pt-8 text-center text-xs text-neutral-600 uppercase tracking-widest font-bold font-sans animate-fade-in">
          &ldquo;We value your experience across borders. Let us know how we can assist you.&rdquo;
        </div>
      </PageContainer>
    </div>
  )
}
