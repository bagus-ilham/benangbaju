import React from 'react'
import { Metadata } from 'next'
import { SmartLink as Link, PageHero, PageContainer, HandDrawnIcon, type HandDrawnIconName } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Cara Belanja — Benangbaju',
  description: 'Ikuti panduan mudah cara berbelanja produk dari Benangbaju secara online.',
}

const steps: Array<{
  handDrawnName: HandDrawnIconName
  title: string
  desc: string
}> = [
  {
    handDrawnName: 'shopping-bag',
    title: '1. Pilih Produk & Tambahkan ke Keranjang',
    desc: 'Telusuri katalog produk kami, pilih varian warna, ukuran, dan kuantitas yang diinginkan. Tekan tombol "Tambah ke Keranjang" untuk menyimpannya.',
  },
  {
    handDrawnName: 'tag',
    title: '2. Periksa Keranjang & Gunakan Voucher',
    desc: 'Klik ikon keranjang di kanan atas untuk melihat ringkasan pesanan Anda. Masukkan kode voucher belanja di kolom yang tersedia untuk mendapatkan potongan harga eksklusif.',
  },
  {
    handDrawnName: 'truck',
    title: '3. Isi Alamat & Pilih Kurir Pengiriman',
    desc: 'Klik "Checkout" untuk masuk ke halaman pengiriman. Tentukan alamat pengiriman lengkap Anda dan pilih jasa ekspedisi/kurir yang diinginkan beserta pilihan tarifnya.',
  },
  {
    handDrawnName: 'kancing',
    title: '4. Lakukan Pembayaran Instan (DOKU Checkout)',
    desc: 'Tinjau total biaya, lalu klik tombol pembayaran. Layanan DOKU Checkout akan muncul secara otomatis. Anda bisa membayar dengan Virtual Account Bank, QRIS (termasuk DuitNow / Touch \'n Go Cross-Border untuk Malaysia), e-Wallet, atau Minimarket.',
  },
  {
    handDrawnName: 'clipboard-list',
    title: '5. Pantau Status & Lacak Nomor Resi',
    desc: 'Setelah pembayaran diverifikasi secara otomatis, pesanan Anda akan segera diproses. Pantau status pesanan dan nomor resi kurir di halaman "Akun Saya" → "Pesanan Saya".',
  },
]

export default function CaraBelanjaPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-brand-cream font-sans">
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
              className="border border-neutral-200/80 p-6 md:p-8 flex items-start gap-5 bg-brand-cream rounded-2xl shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="p-3 bg-brand-blue/20 border border-brand-blue/30 rounded-2xl shrink-0 mt-0.5">
                <HandDrawnIcon name={step.handDrawnName} className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="font-sans text-sm font-bold text-brand-plum uppercase tracking-wide">
                  {step.title}
                </h2>
                <p className="text-xs text-neutral-600 leading-relaxed font-medium">{step.desc}</p>
              </div>
            </div>
          ))}

          {/* Malaysia QRIS / DuitNow Payment Guide */}
          <div className="border border-emerald-300 bg-emerald-50/70 p-6 md:p-8 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇲🇾</span>
                <h2 className="font-sans text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Panduan Pembayaran Pelanggan Malaysia (DuitNow QR / Scan from Gallery)
                </h2>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Cross-Border
              </span>
            </div>

            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              Pelanggan dari Semenanjung Malaysia dapat melakukan pembayaran instan tanpa kartu kredit
              menggunakan seluruh aplikasi perbankan dan e-wallet resmi Malaysia:
            </p>

            <ol className="list-decimal list-inside text-xs text-emerald-950/90 space-y-2 font-sans font-medium leading-relaxed">
              <li>
                <strong>Unduh / Screenshot QR:</strong> Pada layar pembayaran pesanan, klik tombol{' '}
                <strong>Unduh QR</strong> atau simpan tangkapan layar (screenshot) kode QRIS yang
                tampil.
              </li>
              <li>
                <strong>Buka Bank / E-Wallet Malaysia:</strong> Buka aplikasi perbankan atau dompet
                digital Anda (Touch &apos;n Go eWallet, Maybank MAE, CIMB Octo, Bank Islam, dll).
              </li>
              <li>
                <strong>Pilih Scan from Gallery:</strong> Masuk ke menu <strong>DuitNow QR / Scan</strong>,
                lalu pilih opsi <strong>Upload QR / Scan from Gallery</strong> dan pilih gambar kode QR
                yang telah disimpan.
              </li>
              <li>
                <strong>Konfirmasi Nilai MYR:</strong> Nilai Ringgit Malaysia (MYR) dikonversi secara
                otomatis oleh bank Anda sesuai kurs devisa resmi saat pemindaian. Masukkan PIN untuk
                menyelesaikan transaksi. Status pesanan akan terverifikasi otomatis.
              </li>
            </ol>
          </div>

          <div className="border border-neutral-200 bg-brand-cream/50 p-6 md:p-8 text-xs text-neutral-600 leading-relaxed font-medium rounded-2xl shadow-sm">
            <p className="font-heading font-semibold text-brand-plum mb-2 uppercase tracking-wider text-[10px]">
              Butuh Bantuan Lebih Lanjut?
            </p>
            Jika Anda mengalami kendala saat checkout atau pembayaran, silakan hubungi Customer
            Service kami melalui halaman{' '}
            <Link
              href="/kontak"
              className="text-brand-plum underline font-semibold hover:text-brand-blue transition-colors"
            >
              Hubungi Kami
            </Link>{' '}
            untuk respon cepat via WhatsApp.
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
