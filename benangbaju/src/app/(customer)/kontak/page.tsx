import React from 'react'
import { Metadata } from 'next'
import { MapPin, Clock, Mail, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Hubungi Kami — Benangbaju',
  description: 'Hubungi layanan pelanggan Benangbaju untuk pertanyaan produk, pengiriman, return, atau kritik dan saran.',
}

export default function KontakPage() {
  const whatsappNumber = '6281234567890'
  const whatsappMessage = encodeURIComponent('Halo Benangbaju, saya ingin bertanya tentang produk / pesanan saya.')
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-[60vh] py-16 px-4 sm:px-6 lg:px-8 bg-white text-neutral-800 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header Heading */}
        <div className="border-b border-neutral-100 pb-8 text-center sm:text-left">
          <h1 className="text-3xl font-serif text-neutral-900 tracking-tight mb-2">Hubungi Kami</h1>
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Hubungi Kami & Layanan Pelanggan</p>
        </div>

        {/* Intro */}
        <div className="text-sm leading-relaxed text-neutral-600 font-medium">
          <p>
            Tim customer service kami siap membantu Anda dengan informasi mengenai produk, panduan ukuran, status pengiriman, 
            atau panduan pengembalian barang. Hubungi kami melalui salah satu saluran di bawah ini.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Contact Details Card */}
          <div className="border border-neutral-200 p-8 rounded-none space-y-6">
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
                  <p className="text-neutral-400 mt-1">Minggu & Hari Libur Nasional: Tutup</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900 mb-0.5">Surel (Email)</p>
                  <a href="mailto:support@benangbaju.com" className="hover:text-neutral-900 underline transition-colors">
                    support@benangbaju.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900 mb-0.5">Butik & Kantor Pusat</p>
                  <p>Benangbaju Studio</p>
                  <p>Jl. Kemang Raya No. 45, Bangka, Mampang Prapatan</p>
                  <p>Jakarta Selatan, DKI Jakarta 12730</p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp CTA Card */}
          <div className="border border-neutral-200 p-8 rounded-none flex flex-col justify-between space-y-6 bg-neutral-50/50">
            <div className="space-y-4">
              <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs border-b border-neutral-200/60 pb-3">
                Respon Cepat via WhatsApp
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Dapatkan bantuan langsung dari tim customer support kami terkait kendala transaksi, konfirmasi pembayaran, 
                atau bantuan retur melalui WhatsApp chat. Kami akan membalas pesan Anda sesegera mungkin selama jam kerja.
              </p>
            </div>

            <div className="pt-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center space-x-2 bg-[#171717] text-white hover:bg-neutral-800 px-6 py-3.5 text-xs font-heading font-bold uppercase tracking-widest transition-all duration-200 rounded-none shadow-xs"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Philosophy Footer quote */}
        <div className="border-t border-neutral-100 pt-8 text-center text-xs text-neutral-400 uppercase tracking-widest font-bold font-sans">
          &ldquo;We value your experience. Let us know how we can assist you.&rdquo;
        </div>
      </div>
    </div>
  )
}
