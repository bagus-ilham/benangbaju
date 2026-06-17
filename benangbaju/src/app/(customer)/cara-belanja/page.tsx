import React from 'react'
import { Metadata } from 'next'
import { ShoppingBag, Tag, Truck, CreditCard, ClipboardList } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cara Belanja — Benangbaju',
  description: 'Ikuti panduan mudah cara berbelanja pakaian muslim premium di toko online Benangbaju.',
}

export default function CaraBelanjaPage() {
  const steps = [
    {
      icon: <ShoppingBag className="h-5 w-5 text-neutral-800" />,
      title: '1. Pilih Produk & Tambahkan ke Keranjang',
      desc: 'Telusuri katalog produk kami, pilih varian warna, ukuran, dan kuantitas yang diinginkan. Tekan tombol "Tambah ke Keranjang" untuk menyimpannya.',
    },
    {
      icon: <Tag className="h-5 w-5 text-neutral-800" />,
      title: '2. Periksa Keranjang & Gunakan Voucher',
      desc: 'Klik ikon keranjang di kanan atas untuk melihat ringkasan pesanan Anda. Masukkan kode voucher belanja di kolom yang tersedia untuk mendapatkan potongan harga eksklusif.',
    },
    {
      icon: <Truck className="h-5 w-5 text-neutral-800" />,
      title: '3. Isi Alamat & Pilih Kurir Pengiriman',
      desc: 'Klik "Checkout" untuk masuk ke halaman pengiriman. Tentukan alamat pengiriman lengkap Anda (pilih kecamatan dengan fitur pencarian otomatis) dan pilih jasa ekspedisi/kurir yang diinginkan beserta pilihan tarifnya.',
    },
    {
      icon: <CreditCard className="h-5 w-5 text-neutral-800" />,
      title: '4. Lakukan Pembayaran Instan (Midtrans Snap)',
      desc: 'Tinjau total biaya, lalu klik tombol pembayaran. Layanan Midtrans Snap pop-up akan muncul secara otomatis. Anda bisa membayar dengan mudah menggunakan Bank Transfer/Virtual Account, e-Wallet (Gopay/ShopeePay/QRIS), atau Kartu Kredit.',
    },
    {
      icon: <ClipboardList className="h-5 w-5 text-neutral-800" />,
      title: '5. Pantau Status & Lacak Nomor Resi',
      desc: 'Setelah pembayaran diverifikasi secara otomatis, pesanan Anda akan segera diproses oleh tim kami. Anda dapat memantau status pesanan, melihat estimasi pengiriman, dan menyalin nomor resi kurir langsung di halaman "Akun Saya" -> "Pesanan Saya".',
    },
  ]

  return (
    <div className="min-h-[60vh] py-16 px-4 sm:px-6 lg:px-8 bg-white text-neutral-800 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header Heading */}
        <div className="border-b border-neutral-100 pb-8 text-center sm:text-left">
          <h1 className="text-3xl font-serif text-neutral-900 tracking-tight mb-2">Cara Belanja</h1>
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Panduan Mudah Berbelanja di Benangbaju</p>
        </div>

        {/* Intro */}
        <div className="text-sm leading-relaxed text-neutral-600 font-medium">
          <p>
            Belanja di Benangbaju sangatlah praktis dan aman. Kami menggunakan sistem checkout terintegrasi dan pembayaran instan otomatis. 
            Ikuti 5 langkah mudah berikut untuk menyelesaikan pesanan Anda.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="space-y-6 pt-4">
          {steps.map((step, idx) => (
            <div key={idx} className="border border-neutral-200 p-6 rounded-none flex items-start space-x-4">
              <div className="p-3 bg-neutral-100/80 rounded-none shrink-0">
                {step.icon}
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-neutral-950 uppercase tracking-wide">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ note card */}
        <div className="border border-neutral-200 bg-neutral-50 p-6 rounded-none text-xs text-neutral-500 leading-relaxed font-medium">
          <p className="font-bold text-neutral-950 mb-2">Butuh Bantuan Lebih Lanjut?</p>
          Jika Anda mengalami kendala saat melakukan checkout, kegagalan pembayaran Snap, atau voucher tidak bisa diaplikasikan, 
          silakan hubungi Customer Service kami melalui halaman <a href="/kontak" className="text-neutral-950 underline font-semibold">Hubungi Kami</a> untuk respon cepat via WhatsApp.
        </div>

        {/* Philosophy Footer quote */}
        <div className="border-t border-neutral-100 pt-8 text-center text-xs text-neutral-400 uppercase tracking-widest font-bold font-sans">
          &ldquo;Effortless shopping for your modern modest wear.&rdquo;
        </div>
      </div>
    </div>
  )
}
