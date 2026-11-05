'use client'

import React from 'react'
import { PageHero, PageContainer } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'

export function KebijakanPrivasiClient(): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  const sections = isMY
    ? [
        {
          title: '1. Collection of Personal Information',
          content:
            'We collect personal information that you provide voluntarily when registering an account, placing an order, or communicating with our customer service team. This information includes your full name, physical delivery address, telephone number (+62 / +60), email address, shopping market preference (ID/MY), and order history details.',
        },
        {
          title: '2. Use of Your Data',
          content:
            'Your personal information is used exclusively to fulfill your orders, facilitate physical package dispatch via partner logistics couriers, execute automated payment verifications (via DOKU gateway and Cross-Border QRIS), print official export customs documents (Commercial Invoices), provide transactional status notifications (in-app and via email), and provide personalized product recommendations if you have opted in.',
        },
        {
          title: '3. Data Security & Storage',
          content:
            'We implement standard technical and organisational security measures to safeguard your personal data from unauthorised access, unlawful disclosure, alteration, or loss. User credentials are protected by cryptographic hashing. Financial transactions are processed via PCI-DSS certified payment gateways (DOKU); we never store your payment card numbers or sensitive banking credentials.',
        },
        {
          title: '4. Cookies & Market Preferences',
          content:
            'Our website uses cookies and local storage (localStorage) to store your preferred shopping market (Indonesia IDR vs Malaysia MYR), preserve cart contents, maintain authenticated session states, and gather anonymized website usage metrics to optimize platform navigation and performance.',
        },
        {
          title: '5. Third-Party Disclosures & Courier Partners',
          content:
            'We will never sell, rent, or trade your personal data to third parties for independent marketing purposes. Delivery details are shared strictly with certified logistics providers (including domestic carriers and international aggregators KiriminAja along with cross-border carriers Ninja Van / Lion Parcel) solely to complete physical parcel handover to your shipping destination.',
        },
        {
          title: '6. Data Access & Updating Rights',
          content:
            'You retain the right to review, update, or correct your personal information at any time via your account profile on the Benangbaju platform. To request account deactivation or unsubscribe from transactional notices, you may submit a request to our support team at cs@benangbaju.com.',
        },
        {
          title: '7. Legal Processing Basis (UU PDP & Malaysia PDPA 2010)',
          content:
            'We process personal data in compliance with the Personal Data Protection Act (UU No. 27/2022 of the Republic of Indonesia). For customers residing or ordering within Malaysia, we also adhere to principles compliant with the Personal Data Protection Act 2010 (Malaysia PDPA — Act 709). Data processing is grounded in your explicit consent at registration/checkout and necessary for order contract execution.',
        },
        {
          title: '8. Cross-Border Data Transfer',
          content:
            'To process international shipments bound for Peninsular Malaysia, you understand and acknowledge that relevant details (recipient name, +60 phone contact, West Malaysia delivery address, and garment item specifications on the commercial invoice) will be securely transmitted to export partners (KiriminAja), freight carriers, Malaysian local courier networks (Ninja Van), and customs authorities (Indonesian Customs & Royal Malaysian Customs Department JKDM). Cloud databases are securely hosted in Singapore by Supabase with modern encryption standards.',
        },
        {
          title: '9. Data Retention & Deletion',
          content:
            'Transaction history records are retained as required by statutory taxation and audit regulations (minimum 5 years from order completion). Inactive user records without purchase records over a 24-month span may be securely archived or anonymized upon system review.',
        },
        {
          title: '10. Data Subject Rights & Privacy Contact',
          content:
            'Under applicable data protection laws, you have the right to request access, correction, erasure, or withdrawal of consent. To exercise these rights or raise inquiries regarding our privacy standards, contact us at cs@benangbaju.com or WhatsApp +62 851-7974-7449.',
        },
      ]
    : [
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
        eyebrow={isMY ? 'Data Protection' : 'Perlindungan Data'}
        title={isMY ? 'Privacy Policy' : 'Kebijakan Privasi'}
        subtitle={
          isMY
            ? 'Commitment to safeguarding customer personal data across Indonesia and Malaysia.'
            : 'Pernyataan komitmen perlindungan data pribadi pelanggan Benangbaju di Indonesia dan Malaysia.'
        }
      />

      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-xs leading-relaxed text-neutral-600 font-sans">
            <p className="text-neutral-400 text-[10px] uppercase tracking-widest mb-3">
              {isMY ? 'Last updated: 5 November 2026' : 'Terakhir diperbarui: 5 November 2026'}
            </p>
            <p>
              {isMY
                ? 'Benangbaju highly values your trust and privacy. We are committed to protecting your personal information and managing it in accordance with applicable data protection regulations (Indonesia UU PDP No. 27/2022) and regional customer data protection principles (Malaysia PDPA 2010).'
                : 'Benangbaju sangat menghargai privasi dan kepercayaan Anda. Kami berkomitmen untuk melindungi informasi pribadi Anda dan mengelolanya sesuai dengan regulasi perlindungan data nasional (UU PDP No. 27/2022) serta prinsip perlindungan data pelanggan regional (PDPA Malaysia 2010).'}
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
        </div>
      </PageContainer>
    </div>
  )
}

