import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag, Tag, Truck, CreditCard, ClipboardList } from 'lucide-react'
import { PageHero, PageContainer } from '@/components/shared'

export const metadata: Metadata = {
  title: 'Cara Belanja — Benangbaju',
  description: 'Ikuti panduan mudah cara berbelanja pakaian muslim premium di toko online Benangbaju.',
}

const steps = [
  {
    icon: ShoppingBag,
    title: '1. Pilih Produk & Tambahkan ke Keranjang',
    desc: 'Telusuri katalog produk kami, pilih varian warna, ukuran, dan kuantitas yang diinginkan. Tekan tombol "Tambah ke Keranjang" untuk menyimpannya.',
  },
  {
    icon: Tag,
    title: '2. Periksa Keranjang & Gunakan Voucher',
    desc: 'Klik ikon keranjang di kanan atas untuk melihat ringkasan pesanan Anda. Masukkan kode voucher belanja di kolom yang tersedia untuk mendapatkan potongan harga eksklusif.',
  },
  {
    icon: Truck,
    title: '3. Isi Alamat & Pilih Kurir Pengiriman',
    desc: 'Klik "Checkout" untuk masuk ke halaman pengiriman. Tentukan alamat pengiriman lengkap Anda dan pilih jasa ekspedisi/kurir yang diinginkan beserta pilihan tarifnya.',
  },
  {
    icon: CreditCard,
    title: '4. Lakukan Pembayaran Instan (Midtrans Snap)',
    desc: 'Tinjau total biaya, lalu klik tombol pembayaran. Layanan Midtrans Snap pop-up akan muncul secara otomatis. Anda bisa membayar dengan Bank Transfer, e-Wallet, atau Kartu Kredit.',
  },
  {
    icon: ClipboardList,
    title: '5. Pantau Status & Lacak Nomor Resi',
    desc: 'Setelah pembayaran diverifikasi secara otomatis, pesanan Anda akan segera diproses. Pantau status pesanan dan nomor resi kurir di halaman "Akun Saya" → "Pesanan Saya".',
  },
]

export default function CaraBelanjaPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Panduan Belanja"
        title="Cara Belanja"
        subtitle="Belanja di Benangbaju sangatlah praktis dan aman. Ikuti 5 langkah mudah berikut."
      />

      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-6">
          {steps.map((step) => (
            <div
              key={step.title}
              className="border border-neutral-200 p-6 md:p-8 flex items-start gap-5 card-hover-lift gold-border-hover bg-white"
            >
              <div className="p-3 bg-brand-gold-muted border border-brand-gold/20 shrink-0">
                <step.icon className="h-5 w-5 text-brand-gold" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-sm font-semibold text-brand-black uppercase tracking-wide">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}

          <div className="border border-neutral-200 bg-brand-cream/50 p-6 md:p-8 text-xs text-neutral-500 leading-relaxed font-medium">
            <p className="font-heading font-semibold text-brand-black mb-2 uppercase tracking-wider text-[10px]">
              Butuh Bantuan Lebih Lanjut?
            </p>
            Jika Anda mengalami kendala saat checkout atau pembayaran, silakan hubungi Customer Service kami melalui halaman{' '}
            <Link href="/kontak" className="text-brand-black underline font-semibold hover:text-brand-gold transition-colors">
              Hubungi Kami
            </Link>{' '}
            untuk respon cepat via WhatsApp.
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
