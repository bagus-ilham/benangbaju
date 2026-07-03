'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Mail, MessageSquare } from 'lucide-react'
import { PageContainer, PageHero } from '@/shared/components'

export default function KontakPage(): React.JSX.Element {
  const whatsappNumber = '6281234567890'
  const whatsappMessage = encodeURIComponent(
    'Halo Benangbaju, saya ingin bertanya tentang produk / pesanan saya.'
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Layanan Pelanggan"
        title="Hubungi Kami"
        subtitle="Tim customer service kami siap membantu informasi produk, ukuran, pengiriman, dan retur."
      />
      <PageContainer size="md" className="py-12 space-y-12 page-content">
        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Contact Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="border border-neutral-200 p-8 space-y-6 card-hover-lift gold-border-hover transition-all duration-300"
          >
            <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs border-b border-neutral-100 pb-3">
              Layanan Pelanggan
            </h3>

            <div className="space-y-4 text-xs font-medium text-neutral-600">
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900 mb-0.5">Jam Operasional</p>
                  <p>Senin – Jumat: 09:00 – 17:00 WIB</p>
                  <p>Sabtu: 09:00 – 14:00 WIB</p>
                  <p className="text-neutral-400 mt-1">Minggu &amp; Hari Libur Nasional: Tutup</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900 mb-0.5">Surel (Email)</p>
                  <a
                    href="mailto:support@benangbaju.com"
                    className="hover:text-neutral-900 underline transition-colors"
                  >
                    support@benangbaju.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900 mb-0.5">Butik &amp; Kantor Pusat</p>
                  <p>Benangbaju Studio</p>
                  <p>Jl. Kemang Raya No. 45, Bangka, Mampang Prapatan</p>
                  <p>Jakarta Selatan, DKI Jakarta 12730</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* WhatsApp CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="border border-neutral-200 p-8 rounded-none flex flex-col justify-between space-y-6 bg-neutral-50/50 hover:border-neutral-400 hover:shadow-sm transition-all duration-300"
          >
            <div className="space-y-4">
              <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs border-b border-neutral-200/60 pb-3">
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
                className="w-full inline-flex items-center justify-center space-x-2 bg-[#171717] text-white hover:bg-neutral-800 px-6 py-3.5 text-xs font-heading font-bold uppercase tracking-widest transition-all duration-300 rounded-none shadow-xs hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 btn-shine"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Philosophy Footer quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="border-t border-neutral-100 pt-8 text-center text-xs text-neutral-400 uppercase tracking-widest font-bold font-sans"
        >
          &ldquo;We value your experience. Let us know how we can assist you.&rdquo;
        </motion.div>
      </PageContainer>
    </div>
  )
}
