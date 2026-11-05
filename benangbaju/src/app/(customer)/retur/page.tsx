import React from 'react'
import { Metadata } from 'next'
import { PageHero, PageContainer, HandDrawnIcon } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Kebijakan Pengembalian (Retur) — Benangbaju',
  description:
    'Syarat dan panduan pengajuan retur barang domestik, tukar ukuran, klaim produk cacat, serta kebijakan Final Sale untuk pesanan internasional Malaysia di Benangbaju.',
}

export default function ReturPage(): React.JSX.Element {
  const steps = [
    {
      title: '1. Ajukan Form Retur (Domestik)',
      desc: 'Masuk ke akun Anda, buka menu "Pesanan Saya", pilih nomor pesanan terkait, lalu klik "Ajukan Pengembalian (Retur)". Isi alasan retur secara jujur dan masukkan data rekening bank Anda untuk proses refund.',
    },
    {
      title: '2. Tunggu Persetujuan Admin',
      desc: 'Tim Customer Service kami akan meninjau pengajuan Anda dalam waktu maksimal 1x24 jam kerja. Setelah disetujui, Anda akan menerima alamat lengkap gudang pengembalian kami.',
    },
    {
      title: '3. Kirim Kembali Barang',
      desc: 'Kemas barang yang ingin diretur dengan rapi (pastikan hangtag masih terpasang). Kirim menggunakan kurir pilihan Anda ke alamat gudang yang diberikan, lalu input resi pengiriman retur di halaman pengajuan.',
    },
    {
      title: '4. Inspeksi QC & Refund Dana',
      desc: 'Setelah barang retur tiba di gudang kami, tim QC akan memeriksa kondisinya. Jika memenuhi kriteria, pengembalian dana (refund) akan ditransfer ke rekening bank Anda atau produk pengganti akan dikirim dalam 3-5 hari kerja.',
    },
  ]

  const whatsappInternationalUrl = `https://wa.me/6285179747449?text=${encodeURIComponent(
    'Halo Benangbaju, saya pelanggan dari Malaysia ingin menanyakan kendala pesanan saya.'
  )}`

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow="Garansi Kepuasan"
        title="Kebijakan Retur"
        subtitle="Syarat dan panduan pengajuan retur, tukar ukuran domestik, dan kebijakan pesanan internasional Malaysia."
      />
      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Highlight Values Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="border border-neutral-200/80 p-6 rounded-2xl space-y-3 bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-2">
                <HandDrawnIcon name="clock" className="h-4 w-4" />
                <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs">
                  Batas Waktu 7 Hari (Domestik)
                </h2>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Untuk pesanan wilayah Indonesia, pengajuan pengembalian barang wajib dilakukan
                selambat-lambatnya 7 hari kalender sejak status pesanan dinyatakan diterima oleh kurir.
              </p>
            </div>

            <div className="border border-neutral-200/80 p-6 rounded-2xl space-y-3 bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-2">
                <HandDrawnIcon name="alert-triangle" className="h-4 w-4" />
                <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs">
                  Syarat Fisik Barang
                </h2>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Produk harus dalam kondisi asli seperti saat diterima: belum pernah dicuci, tidak
                berbau parfum/keringat, tidak dimodifikasi/dijahit ulang, serta hangtag label produk
                masih utuh terpasang.
              </p>
            </div>
          </div>

          {/* International Orders Policy Card (Final Sale Malaysia) */}
          <div className="border border-amber-300 bg-amber-50/70 p-6 sm:p-8 rounded-2xl space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇲🇾</span>
                <h2 className="font-sans text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Kebijakan Pesanan Internasional: Malaysia (Final Sale)
                </h2>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Final Sale
              </span>
            </div>

            <div className="space-y-3 text-xs text-amber-900 leading-relaxed font-medium">
              <p>
                Seluruh pesanan dengan pengiriman ke Malaysia berstatus <strong>Final Sale</strong>.
                Fitur pengajuan retur mandiri di situs web hanya berlaku untuk pesanan domestik
                Indonesia karena kendala biaya logistik balik lintas negara, proses re-impor pabean,
                serta tarif kepabeanan internasional.
              </p>
              <p>
                Pelanggan di Malaysia sangat disarankan untuk memeriksa detail panduan ukuran pada
                tab <strong>INCH / CM</strong> dan deskripsi bahan di halaman produk sebelum
                menyelesaikan transaksi.
              </p>
            </div>

            {/* Defect Claim Protection for Malaysia */}
            <div className="p-4 bg-white/90 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <HandDrawnIcon name="check-circle" className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Jaminan Produk Rusak / Salah Kirim (Malaysia)</span>
              </div>
              <p className="text-[11px] text-neutral-700 leading-relaxed">
                Jika Anda menerima produk dalam kondisi rusak/cacat pabrik atau tidak sesuai dengan
                pesanan, Anda tetap mendapatkan perlindungan penuh. Harap hubungi Customer Service kami
                melalui WhatsApp maksimal <strong>2x24 jam</strong> setelah paket diterima dengan
                melampirkan <strong>video unboxing utuh tanpa jeda</strong> dan foto label paket. Tim
                kami akan memberikan kompensasi berupa voucher belanja 100% atau penggantian tanpa
                mewajibkan pengiriman balik barang yang rusak ke Indonesia.
              </p>
              <div className="pt-1">
                <a
                  href={whatsappInternationalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                >
                  <HandDrawnIcon name="whatsapp" className="h-3.5 w-3.5" />
                  <span>Klaim Kendala Pesanan Malaysia</span>
                </a>
              </div>
            </div>
          </div>

          {/* Acceptable Reasons Section (Domestic) */}
          <div className="border border-neutral-200/80 p-8 rounded-2xl space-y-6 bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
            <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs border-b border-neutral-200/60 pb-3">
              Kategori Retur Yang Diterima (Pesanan Domestik Indonesia)
            </h2>

            <ul className="space-y-4 text-xs font-medium text-neutral-600">
              <li className="flex items-start space-x-2.5">
                <HandDrawnIcon name="check-circle" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">Cacat Produk (Defect)</p>
                  <p>
                    Terdapat robekan kain, jahitan lepas ekstrem, noda kotoran permanen, kancing
                    rusak, atau ritsleting macet sebelum pemakaian pertama.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-2.5">
                <HandDrawnIcon name="check-circle" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">Kesalahan Pengiriman</p>
                  <p>
                    Produk yang dikirim tidak sesuai dengan invoice pesanan (salah warna, salah
                    model, atau salah ukuran).
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-2.5">
                <HandDrawnIcon name="check-circle" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">Tukar Ukuran (Tukar Size)</p>
                  <p>
                    Pembeli salah memilih ukuran (kekecilan/kebesaran), dengan catatan biaya
                    pengiriman retur dan pengiriman kembali sepenuhnya ditanggung oleh pembeli, dan
                    stok ukuran pengganti masih tersedia.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Step-by-step procedure (Domestic) */}
          <div className="space-y-4 pt-4">
            <h2 className="font-sans text-sm font-bold text-brand-plum uppercase tracking-wider">
              Alur Pengajuan Retur Mandiri (Domestik Indonesia)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="border border-neutral-200/80 p-6 rounded-xl space-y-2 bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300"
                >
                  <h3 className="font-sans text-xs font-bold text-brand-plum uppercase tracking-wide">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-neutral-600 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
