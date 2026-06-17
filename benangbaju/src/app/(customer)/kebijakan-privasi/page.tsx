import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Benangbaju',
  description: 'Informasi mengenai bagaimana Benangbaju mengumpulkan, menyimpan, menggunakan, dan melindungi data pribadi Anda selaku pelanggan.',
}

export default function KebijakanPrivasiPage() {
  const sections = [
    {
      title: '1. Pengumpulan Informasi Pribadi',
      content: 'Kami mengumpulkan informasi pribadi yang Anda berikan secara sukarela saat melakukan pendaftaran akun, checkout produk, atau saat berkomunikasi dengan customer service kami. Informasi ini mencakup nama lengkap, alamat pengiriman, nomor telepon, alamat email, dan koordinat wilayah pengiriman.',
    },
    {
      title: '2. Penggunaan Data Anda',
      content: 'Data pribadi Anda digunakan semata-mata untuk memproses transaksi pesanan Anda, mengirimkan paket melalui kurir mitra ekspedisi, melakukan verifikasi pembayaran otomatis (Midtrans), memberikan pembaruan status pesanan, serta memberikan rekomendasi produk atau promosi yang dipersonalisasi apabila Anda menyetujui berlangganan newsletter.',
    },
    {
      title: '3. Keamanan & Penyimpanan Data',
      content: 'Kami mengambil langkah-langkah keamanan teknis yang wajar untuk melindungi informasi Anda dari akses ilegal, pengungkapan tanpa izin, perubahan, atau kerusakan. Akun Anda dilindungi dengan enkripsi kata sandi. Transaksi keuangan Anda diproses secara terenkripsi oleh payment gateway bersertifikasi PCI-DSS (Midtrans) sehingga kami tidak menyimpan detail kartu kredit atau virtual account Anda.',
    },
    {
      title: '4. Penggunaan Cookies',
      content: 'Situs kami menggunakan cookie untuk melacak isi keranjang belanja Anda (cart), mengingat preferensi login Anda, serta mengumpulkan data analitik kunjungan situs (seperti halaman yang paling sering dikunjungi) secara anonim guna membantu meningkatkan kenyamanan navigasi web kami.',
    },
    {
      title: '5. Pengungkapan Kepada Pihak Ketiga',
      content: 'Kami tidak akan pernah menjual, menyewakan, atau menyebarluaskan data pribadi Anda kepada pihak ketiga manapun untuk kepentingan pemasaran mereka. Informasi Anda hanya dibagikan kepada mitra logistik/ekspedisi (seperti JNE, J&T, SiCepat) untuk memfasilitasi pengantaran pesanan fisik Anda.',
    },
    {
      title: '6. Hak Akses & Perubahan Data',
      content: 'Anda memiliki hak untuk melihat, mengedit, atau menghapus informasi pribadi Anda kapan saja melalui halaman profil akun Anda di situs web Benangbaju. Jika Anda ingin menonaktifkan akun Anda secara permanen atau berhenti berlangganan newsletter promo, silakan kirim permohonan ke tim customer service kami.',
    },
  ]

  return (
    <div className="min-h-[60vh] py-16 px-4 sm:px-6 lg:px-8 bg-white text-neutral-800 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header Heading */}
        <div className="border-b border-neutral-100 pb-8 text-center sm:text-left">
          <h1 className="text-3xl font-serif text-neutral-900 tracking-tight mb-2">Kebijakan Privasi</h1>
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Pernyataan Perlindungan Data Pelanggan</p>
        </div>

        {/* Intro */}
        <div className="text-sm leading-relaxed text-neutral-600 font-medium">
          <p className="text-neutral-400 text-xs italic mb-4">Terakhir diperbarui: 10 Juni 2026</p>
          <p>
            Benangbaju sangat menghargai privasi dan kepercayaan Anda. Kami berkomitmen untuk melindungi informasi pribadi Anda 
            dan menggunakannya sesuai dengan kebijakan perlindungan data nasional dan internasional.
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
          &ldquo;Your data is safe with us. We respect your digital privacy.&rdquo;
        </div>
      </div>
    </div>
  )
}
