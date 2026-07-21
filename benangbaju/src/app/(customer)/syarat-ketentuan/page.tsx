import React from 'react'
import { Metadata } from 'next'
import { PageHero, PageContainer } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Benangbaju',
  description:
    'Syarat dan ketentuan umum penggunaan situs, pendaftaran akun, pembelian produk, keamanan transaksi, dan kebijakan pembatalan di Benangbaju.',
}

export default function SyaratKetentuanPage(): React.JSX.Element {
  const sections = [
    {
      title: '1. Ketentuan Umum',
      content:
        'Selamat datang di Benangbaju. Dengan mengakses dan menggunakan situs ini, Anda dianggap telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan yang berlaku. Syarat & Ketentuan ini dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu. Harap tinjau halaman ini secara berkala.',
    },
    {
      title: '2. Akun Pengguna',
      content:
        'Untuk kemudahan bertransaksi, Anda disarankan mendaftarkan akun di situs kami. Anda bertanggung jawab penuh atas kerahasiaan password dan aktivitas yang terjadi di bawah akun Anda. Pihak Benangbaju berhak menangguhkan atau menghapus akun Anda secara sepihak apabila ditemukan penyalahgunaan, manipulasi voucher, atau tindakan mencurigakan yang melanggar hukum.',
    },
    {
      title: '3. Pemesanan & Ketersediaan Produk',
      content:
        'Semua pesanan tunduk pada ketersediaan produk. Jika produk yang Anda pesan tidak tersedia karena kesalahan penghitungan stok gudang, kami akan segera menghubungi Anda untuk penukaran produk sejenis atau pembatalan pesanan beserta pengembalian dana penuh. Warna produk pada layar Anda mungkin sedikit berbeda dari warna produk asli akibat pencahayaan foto dan kalibrasi monitor Anda.',
    },
    {
      title: '4. Harga & Pembayaran',
      content:
        'Harga yang tertera di situs kami dinyatakan dalam Rupiah (IDR) dan belum termasuk ongkos kirim. Ongkos kirim dihitung otomatis saat checkout berdasarkan alamat tujuan dan ekspedisi pilihan. Pembayaran dilakukan secara instan melalui payment gateway DOKU. Batas waktu transfer mengikuti instruksi masing-masing metode bayar, dan kegagalan membayar dalam tenggat waktu tersebut akan menyebabkan pesanan batal otomatis.',
    },
    {
      title: '5. Hak Pembatalan Pesanan',
      content:
        'Benangbaju berhak menolak atau membatalkan pesanan Anda apabila terdapat indikasi penipuan transaksi, kesalahan pencantuman harga produk yang tidak wajar akibat gangguan sistem, atau kegagalan otorisasi pembayaran dari bank/penyedia kartu kredit.',
    },
    {
      title: '6. Hak Kekayaan Intelektual',
      content:
        'Seluruh konten yang terdapat di situs ini, termasuk namun tidak terbatas pada logo, teks, foto produk, grafik, ilustrasi, source code, dan desain koleksi baju adalah hak kekayaan intelektual milik Benangbaju. Dilarang keras menggandakan, mendistribusikan, atau menyalahgunakan konten tersebut untuk kepentingan komersial pribadi tanpa izin tertulis dari kami.',
    },
  ]

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Ketentuan Penggunaan"
        title="Syarat & Ketentuan"
        subtitle="Perjanjian lisensi dan ketentuan penggunaan situs Benangbaju."
      />

      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-xs leading-relaxed text-neutral-500 font-sans">
            <p className="text-neutral-400 text-[10px] uppercase tracking-widest mb-3">
              Terakhir diperbarui: 10 Juni 2026
            </p>
            <p>
              Harap baca syarat dan ketentuan ini dengan saksama sebelum mulai menggunakan situs
              kami atau melakukan transaksi pembelian produk. Penggunaan situs dan transaksi Anda
              diatur oleh dokumen perjanjian ini.
            </p>
          </div>

          <div className="space-y-5">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="border border-neutral-200 p-6 md:p-8 card-hover-lift gold-border-hover bg-white space-y-3"
              >
                <h3 className="font-heading text-sm font-semibold text-brand-black uppercase tracking-wide">
                  {section.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 pt-8 text-center text-[10px] text-neutral-400 uppercase tracking-[0.2em] font-heading">
            Governing fair transactions, ensuring premium experiences.
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
