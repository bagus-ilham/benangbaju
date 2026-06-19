import React from 'react'
import { Metadata } from 'next'
import { PageHero, PageContainer } from '@/components/shared'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Benangbaju',
  description: 'Informasi mengenai bagaimana Benangbaju mengumpulkan, menyimpan, menggunakan, dan melindungi data pribadi Anda selaku pelanggan.',
}

export default function KebijakanPrivasiPage() : React.JSX.Element {
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
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Perlindungan Data"
        title="Kebijakan Privasi"
        subtitle="Pernyataan perlindungan data pelanggan dan komitmen privasi Benangbaju."
      />

      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-xs leading-relaxed text-neutral-500 font-sans">
            <p className="text-neutral-400 text-[10px] uppercase tracking-widest mb-3">
              Terakhir diperbarui: 10 Juni 2026
            </p>
            <p>
              Benangbaju sangat menghargai privasi dan kepercayaan Anda. Kami berkomitmen untuk melindungi informasi pribadi Anda
              dan menggunakannya sesuai dengan kebijakan perlindungan data nasional dan internasional.
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
            Your data is safe with us. We respect your digital privacy.
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
