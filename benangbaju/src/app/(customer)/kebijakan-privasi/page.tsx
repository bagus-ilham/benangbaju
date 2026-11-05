import React from 'react'
import { Metadata } from 'next'
import { PageHero, PageContainer } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Benangbaju',
  description:
    'Informasi mengenai bagaimana Benangbaju mengumpulkan, menyimpan, menggunakan, dan melindungi data pribadi pelanggan sesuai regulasi UU PDP Indonesia dan PDPA Malaysia 2010.',
}

export default function KebijakanPrivasiPage(): React.JSX.Element {
  const sections = [
    {
      title: '1. Pengumpulan Informasi Pribadi',
      content:
        'Kami mengumpulkan informasi pribadi yang Anda berikan secara sukarela saat melakukan pendaftaran akun, checkout produk, atau saat berkomunikasi dengan customer service kami. Informasi ini mencakup nama lengkap, alamat pengiriman fisik, nomor telepon (+62 / +60), alamat email, preferensi pasar (ID/MY), serta rincian pesanan yang Anda lakukan.',
    },
    {
      title: '2. Penggunaan Data Anda',
      content:
        'Data pribadi Anda digunakan semata-mata untuk memproses transaksi pesanan Anda, memfasilitasi pengiriman paket fisik melalui kurir mitra ekspedisi, melakukan verifikasi pembayaran otomatis (melalui gateway DOKU dan QRIS Cross-Border), mencetak dokumen pabean ekspor-impor resmi (Commercial Invoice), memberikan pembaruan status pesanan (in-app dan email transaksional), serta memberikan rekomendasi produk atau promosi apabila Anda menyetujui berlangganan newsletter.',
    },
    {
      title: '3. Keamanan & Penyimpanan Data',
      content:
        'Kami mengambil langkah-langkah keamanan teknis dan organisasional yang wajar untuk melindungi informasi Anda dari akses ilegal, pengungkapan tanpa izin, perubahan, atau kerusakan. Akun Anda dilindungi dengan enkripsi kata sandi yang kuat. Transaksi keuangan Anda diproses secara terenkripsi oleh payment gateway bersertifikasi PCI-DSS (DOKU) sehingga kami tidak menyimpan nomor kartu kredit atau kredensial perbankan rahasia Anda.',
    },
    {
      title: '4. Penggunaan Cookies & Preferensi Pasar',
      content:
        'Situs kami menggunakan cookie dan penyimpanan lokal (localStorage) untuk mengingat preferensi pasar belanja Anda (Indonesia IDR vs Malaysia MYR), melacak isi keranjang belanja Anda (cart), mengingat status login akun Anda, serta mengumpulkan data analitik kunjungan situs secara anonim guna meningkatkan performa navigasi situs web kami.',
    },
    {
      title: '5. Pengungkapan Kepada Pihak Ketiga & Mitra Logistik',
      content:
        'Kami tidak akan pernah menjual, menyewakan, atau memperjualbelikan data pribadi Anda kepada pihak ketiga untuk kepentingan pemasaran mereka. Informasi pengiriman Anda hanya dibagikan kepada mitra logistik/ekspedisi resmi (seperti JNE, SiCepat, J&T untuk domestik, serta agregator logistik KiriminAja dan kurir internasional Ninja Van / Lion Parcel untuk pengiriman ke Malaysia) semata-mata guna memfasilitasi pengantaran pesanan fisik Anda.',
    },
    {
      title: '6. Hak Akses & Perubahan Data',
      content:
        'Anda memiliki hak untuk melihat, memperbarui, atau memperbaiki informasi pribadi Anda kapan saja melalui halaman profil akun Anda di situs web Benangbaju. Jika Anda ingin menonaktifkan akun Anda secara permanen atau berhenti menerima email pemberitahuan, silakan ajukan permohonan ke tim customer service kami melalui cs@benangbaju.com.',
    },
    {
      title: '7. Dasar Hukum Pemrosesan Data (UU PDP & PDPA Malaysia 2010)',
      content:
        'Kami memproses data pribadi Anda dengan tunduk pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP Republik Indonesia). Untuk pelanggan yang bertransaksi atau berdomisili di Malaysia, kami juga menghormati dan menerapkan prinsip-prinsip perlindungan data yang selaras dengan Personal Data Protection Act 2010 (PDPA Malaysia — Act 709). Pemrosesan data dilakukan atas dasar persetujuan eksplisit Anda saat mendaftar/checkout dan demi pelaksanaan kontrak jual-beli barang.',
    },
    {
      title: '8. Transfer Data Lintas Batas (Cross-Border Data Transfer)',
      content:
        'Untuk memproses pesanan dengan tujuan pengiriman ke Malaysia, Anda memahami dan menyetujui bahwa data tertentu (nama penerima, nomor telepon kontak +60, alamat pengantaran Semenanjung Malaysia, serta rincian komoditas pakaian dan kode HS pada faktur komersial) akan dialihkan dan dibagikan secara aman kepada mitra logistik ekspor (KiriminAja), maskapai kargo, kurir lokal di Malaysia (Ninja Van), otoritas kepabeanan (Direktorat Jenderal Bea Cukai Indonesia & Jabatan Kastam Diraja Malaysia), serta penyedia gerbang pembayaran QRIS Cross-Border DOKU. Infrastruktur komputasi cloud dan basis data kami dikelola secara aman oleh Supabase (region Singapura) dengan standar enkripsi industri.',
    },
    {
      title: '9. Retensi & Penghapusan Data',
      content:
        'Data riwayat transaksi Anda disimpan selama diperlukan untuk memenuhi kewajiban hukum perpajakan dan pembukuan resmi (minimal 5 tahun sejak transaksi diselesaikan). Data akun pengguna yang tidak aktif selama lebih dari 2 tahun dapat dianonimkan atau dihapus dari sistem kami kecuali jika terdapat sengketa hukum yang belum terselesaikan.',
    },
    {
      title: '10. Hak Subjek Data & Kontak Petugas Privasi',
      content:
        'Sebagaimana diatur dalam UU PDP dan PDPA, Anda berhak: (a) mengakses dan meminta salinan data pribadi Anda; (b) melengkapi, memperbarui, atau memperbaiki kesalahan data; (c) mengakhiri pemrosesan atau meminta penghapusan data akun Anda; serta (d) menarik kembali persetujuan Anda kapan saja. Untuk menggunakan hak-hak tersebut atau menyampaikan pertanyaan terkait kebijakan privasi kami, silakan hubungi tim kami di cs@benangbaju.com atau WhatsApp +62 851-7974-7449.',
    },
  ]

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow="Perlindungan Data"
        title="Kebijakan Privasi"
        subtitle="Pernyataan komitmen perlindungan data pribadi pelanggan Benangbaju di Indonesia dan Malaysia."
      />

      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-xs leading-relaxed text-neutral-600 font-sans">
            <p className="text-neutral-400 text-[10px] uppercase tracking-widest mb-3">
              Terakhir diperbarui: 5 November 2026
            </p>
            <p>
              Benangbaju sangat menghargai privasi dan kepercayaan Anda. Kami berkomitmen untuk
              melindungi informasi pribadi Anda dan mengelolanya sesuai dengan regulasi perlindungan
              data nasional (UU PDP No. 27/2022) serta prinsip perlindungan data pelanggan regional
              (PDPA Malaysia 2010).
            </p>
          </div>

          <div className="space-y-5">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="border border-neutral-200/80 p-6 md:p-8 bg-brand-cream space-y-3 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300"
              >
                <h2 className="font-sans text-sm font-bold text-brand-plum uppercase tracking-wide">
                  {section.title}
                </h2>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 pt-8 text-center text-[10px] text-neutral-400 uppercase tracking-[0.2em] font-heading">
            Your data is safe with us. We respect your digital privacy across borders.
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
