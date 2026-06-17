import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Benangbaju',
  description: 'Syarat dan ketentuan umum penggunaan situs, pendaftaran akun, pembelian produk, keamanan transaksi, dan kebijakan pembatalan di Benangbaju.',
}

export default function SyaratKetentuanPage() {
  const sections = [
    {
      title: '1. Ketentuan Umum',
      content: 'Selamat datang di Benangbaju. Dengan mengakses dan menggunakan situs ini, Anda dianggap telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan yang berlaku. Syarat & Ketentuan ini dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu. Harap tinjau halaman ini secara berkala.',
    },
    {
      title: '2. Akun Pengguna',
      content: 'Untuk kemudahan bertransaksi, Anda disarankan mendaftarkan akun di situs kami. Anda bertanggung jawab penuh atas kerahasiaan password dan aktivitas yang terjadi di bawah akun Anda. Pihak Benangbaju berhak menangguhkan atau menghapus akun Anda secara sepihak apabila ditemukan penyalahgunaan, manipulasi voucher, atau tindakan mencurigakan yang melanggar hukum.',
    },
    {
      title: '3. Pemesanan & Ketersediaan Produk',
      content: 'Semua pesanan tunduk pada ketersediaan produk. Jika produk yang Anda pesan tidak tersedia karena kesalahan penghitungan stok gudang, kami akan segera menghubungi Anda untuk penukaran produk sejenis atau pembatalan pesanan beserta pengembalian dana penuh. Warna produk pada layar Anda mungkin sedikit berbeda dari warna produk asli akibat pencahayaan foto dan kalibrasi monitor Anda.',
    },
    {
      title: '4. Harga & Pembayaran',
      content: 'Harga yang tertera di situs kami dinyatakan dalam Rupiah (IDR) dan belum termasuk ongkos kirim. Ongkos kirim dihitung otomatis saat checkout berdasarkan alamat tujuan dan ekspedisi pilihan. Pembayaran dilakukan secara instan melalui payment gateway Midtrans. Batas waktu transfer mengikuti instruksi masing-masing metode bayar, dan kegagalan membayar dalam tenggat waktu tersebut akan menyebabkan pesanan batal otomatis.',
    },
    {
      title: '5. Hak Pembatalan Pesanan',
      content: 'Benangbaju berhak menolak atau membatalkan pesanan Anda apabila terdapat indikasi penipuan transaksi, kesalahan pencantuman harga produk yang tidak wajar akibat gangguan sistem, atau kegagalan otorisasi pembayaran dari bank/penyedia kartu kredit.',
    },
    {
      title: '6. Hak Kekayaan Intelektual',
      content: 'Seluruh konten yang terdapat di situs ini, termasuk namun tidak terbatas pada logo, teks, foto produk, grafik, ilustrasi, source code, dan desain koleksi baju adalah hak kekayaan intelektual milik Benangbaju. Dilarang keras menggandakan, mendistribusikan, atau menyalahgunakan konten tersebut untuk kepentingan komersial pribadi tanpa izin tertulis dari kami.',
    },
  ]

  return (
    <div className="min-h-[60vh] py-16 px-4 sm:px-6 lg:px-8 bg-white text-neutral-800 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header Heading */}
        <div className="border-b border-neutral-100 pb-8 text-center sm:text-left">
          <h1 className="text-3xl font-serif text-neutral-900 tracking-tight mb-2">Syarat & Ketentuan</h1>
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Ketentuan Penggunaan & Perjanjian Lisensi</p>
        </div>

        {/* Intro */}
        <div className="text-sm leading-relaxed text-neutral-600 font-medium">
          <p className="text-neutral-400 text-xs italic mb-4">Terakhir diperbarui: 10 Juni 2026</p>
          <p>
            Harap baca syarat dan ketentuan ini dengan saksama sebelum mulai menggunakan situs kami atau melakukan transaksi pembelian produk. 
            Penggunaan situs dan transaksi Anda diatur oleh dokumen perjanjian ini.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8 pt-4">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="font-serif text-sm font-bold text-neutral-950 uppercase tracking-wide">
                {section.title}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Philosophy Footer quote */}
        <div className="border-t border-neutral-100 pt-8 text-center text-xs text-neutral-400 uppercase tracking-widest font-bold font-sans">
          &ldquo;Governing fair transactions, ensuring premium experiences.&rdquo;
        </div>
      </div>
    </div>
  )
}
