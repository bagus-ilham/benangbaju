import React from 'react'
import { Metadata } from 'next'
import { AlertCircle, Calendar, CheckCircle2 } from 'lucide-react'
import { PageHero, PageContainer } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Kebijakan Pengembalian (Retur) — Benangbaju',
  description: 'Syarat dan panduan pengajuan retur barang, tukar ukuran, klaim produk cacat, dan proses pengembalian dana (refund) di Benangbaju.',
}

export default function ReturPage() : React.JSX.Element {
  const steps = [
    {
      title: '1. Ajukan Form Retur',
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

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Garansi Kepuasan"
        title="Kebijakan Retur"
        subtitle="Syarat dan panduan pengajuan retur, tukar ukuran, dan pengembalian dana."
      />
      <PageContainer size="md" className="py-12 page-content">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Highlight Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          <div className="border border-neutral-200 p-6 rounded-none space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-neutral-800" />
              <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
                Batas Waktu 7 Hari
              </h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              Pengajuan pengembalian barang wajib dilakukan selambat-lambatnya 7 hari kalender sejak status pesanan dinyatakan diterima oleh sistem kurir ekspedisi.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 rounded-none space-y-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-neutral-800" />
              <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
                Syarat Fisik Barang
              </h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              Produk harus dalam kondisi asli seperti saat diterima: belum pernah dicuci, tidak berbau parfum/keringat, tidak dimodifikasi/dijahit ulang, serta hangtag label produk masih utuh terpasang.
            </p>
          </div>
        </div>

        {/* Acceptable Reasons Section */}
        <div className="border border-neutral-200 p-8 rounded-none space-y-6">
          <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs border-b border-neutral-100 pb-3">
            Kategori Retur Yang Diterima
          </h3>
          
          <ul className="space-y-4 text-xs font-medium text-neutral-600">
            <li className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-900 mb-0.5">Cacat Produk (Defect)</p>
                <p>Terdapat robekan kain, jahitan lepas ekstrem, noda kotoran permanen, kancing rusak, atau ritsleting macet sebelum pemakaian pertama.</p>
              </div>
            </li>
            <li className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-900 mb-0.5">Kesalahan Pengiriman</p>
                <p>Produk yang dikirim tidak sesuai dengan invoice pesanan (salah warna, salah model, atau salah ukuran).</p>
              </div>
            </li>
            <li className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-900 mb-0.5">Tukar Ukuran (Tukar Size)</p>
                <p>Pembeli salah memilih ukuran (kekecilan/kebesaran), dengan catatan biaya pengiriman retur dan pengiriman kembali sepenuhnya ditanggung oleh pembeli, dan stok ukuran pengganti masih tersedia.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Step-by-step procedure */}
        <div className="space-y-4 pt-4">
          <h3 className="font-serif text-sm font-bold text-neutral-950 uppercase tracking-wider">
            Alur Pengajuan Retur
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className="border border-neutral-200 p-6 rounded-none space-y-2 bg-neutral-50/30">
                <h4 className="font-serif text-xs font-bold text-neutral-950 uppercase tracking-wide">
                  {step.title}
                </h4>
                <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
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
