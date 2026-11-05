import React from 'react'
import { Metadata } from 'next'
import { PageHero, PageContainer, HandDrawnIcon } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Informasi Pengiriman — Benangbaju',
  description:
    'Informasi lengkap tarif, jadwal, cakupan daerah domestik Indonesia & internasional Semenanjung Malaysia, ekspedisi pengiriman, dan kebijakan berat paket Benangbaju.',
}

export default function PengirimanPage(): React.JSX.Element {
  const domesticPartners = [
    {
      name: 'JNE (Reguler / Oke / Yes)',
      area: 'Seluruh Indonesia',
      timeline: '1 – 3 hari kerja (YES), 2 – 5 hari kerja (REG)',
    },
    { name: 'J&T Express', area: 'Seluruh Indonesia', timeline: '2 – 4 hari kerja' },
    {
      name: 'SiCepat (Reg / Best)',
      area: 'Seluruh Indonesia',
      timeline: '1 – 3 hari kerja (BEST), 2 – 4 hari kerja (REG)',
    },
    {
      name: 'POS Indonesia',
      area: 'Seluruh Indonesia & Daerah Pelosok',
      timeline: '3 – 7 hari kerja',
    },
  ]

  const internationalPartners = [
    {
      name: 'Ninja Van International',
      area: 'Semenanjung Malaysia (Poskod 01000–86999)',
      timeline: '3 – 7 hari kerja (Cross-border Air Freight)',
    },
    {
      name: 'Lion Parcel INTERPACK',
      area: 'Semenanjung Malaysia (Poskod 01000–86999)',
      timeline: '3 – 7 hari kerja (Hub Bandung via CGK)',
    },
  ]

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow="Logistik & Pengiriman"
        title="Informasi Pengiriman"
        subtitle="Kebijakan, jadwal, dan mitra ekspedisi pengiriman domestik Indonesia & internasional Malaysia."
      />
      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Delivery Terms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="border border-neutral-200/80 p-6 space-y-3 bg-brand-cream rounded-2xl shadow-xs hover:shadow-md transition-all duration-300">
              <div className="p-2 bg-brand-blue/20 border border-brand-blue/30 w-max rounded-xl">
                <HandDrawnIcon name="package" className="h-4 w-4" />
              </div>
              <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs">
                Perhitungan Berat
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Berat produk dihitung dalam satuan gram. Total berat pesanan akan dibulatkan ke atas
                per 1.000 gram (1 kg) sesuai regulasi ekspedisi rekanan domestik maupun ekspor.
              </p>
            </div>

            <div className="border border-neutral-200/80 p-6 rounded-2xl space-y-3 bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
              <div className="p-2 bg-brand-blue/20 border border-brand-blue/30 rounded-xl w-max">
                <HandDrawnIcon name="hanger" className="h-4 w-4" />
              </div>
              <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs">
                Jadwal Kirim
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Pesanan dengan pembayaran terverifikasi sebelum pukul 15:00 WIB (16:00 MYT) diproses
                pada hari kerja yang sama. Setelah jam tersebut, paket diserahkan ke kurir pada hari
                kerja berikutnya.
              </p>
            </div>

            <div className="border border-neutral-200/80 p-6 rounded-2xl space-y-3 bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
              <div className="p-2 bg-brand-blue/20 border border-brand-blue/30 rounded-xl w-max">
                <HandDrawnIcon name="clothes" className="h-4 w-4" />
              </div>
              <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs">
                Garansi Asuransi
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Setiap pengiriman paket dilindungi jaminan ekspedisi. Apabila paket terbukti hilang
                dalam perjalanan, kami akan mengirimkan paket pengganti atau memberikan solusi terbaik.
              </p>
            </div>
          </div>

          {/* Domestic Courier Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-sm font-bold text-brand-plum uppercase tracking-wider flex items-center gap-2">
                <span>🇮🇩</span>
                <span>Mitra Ekspedisi Domestik (Indonesia)</span>
              </h2>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Gudang Bandung (40164)
              </span>
            </div>

            <div className="border border-neutral-200/80 overflow-hidden rounded-2xl bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-neutral-200/40 border-b border-neutral-200 text-brand-plum font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Ekspedisi</th>
                    <th className="p-4">Cakupan Wilayah</th>
                    <th className="p-4">Estimasi Pengiriman (ETD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600">
                  {domesticPartners.map((partner, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4 font-bold text-brand-plum">{partner.name}</td>
                      <td className="p-4">{partner.area}</td>
                      <td className="p-4">{partner.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* International Courier Section */}
          <div className="space-y-4 pt-4 border-t border-neutral-200/60">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <span>🇲🇾</span>
                <span>Pengiriman Internasional: Semenanjung Malaysia (West Malaysia)</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Ekspor Resmi
              </span>
            </div>

            <div className="border border-emerald-200 overflow-hidden rounded-2xl bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-emerald-50 border-b border-emerald-200 text-emerald-950 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Layanan Ekspedisi</th>
                    <th className="p-4">Cakupan Poskod</th>
                    <th className="p-4">Estimasi Waktu Tiba (ETD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100 font-medium text-neutral-600">
                  {internationalPartners.map((partner, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-4 font-bold text-emerald-950">{partner.name}</td>
                      <td className="p-4">{partner.area}</td>
                      <td className="p-4">{partner.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* International Shipping Details Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 bg-white/70 border border-neutral-200/80 rounded-2xl space-y-2">
                <h3 className="font-bold text-xs text-brand-plum uppercase tracking-wider flex items-center gap-1.5">
                  <HandDrawnIcon name="map-pin" className="h-3.5 w-3.5 text-brand-plum" />
                  <span>Cakupan 13 Wilayah Semenanjung</span>
                </h3>
                <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                  Melayani Kuala Lumpur, Selangor, Johor, Penang, Perak, Kedah, Melaka, Negeri
                  Sembilan, Pahang, Terengganu, Kelantan, Perlis, dan Putrajaya (Poskod Semenanjung
                  <span className="font-mono font-semibold text-neutral-800"> 01000–86999</span>).
                  Pengiriman ke Malaysia Timur (Sabah, Sarawak, Labuan) dan alamat P.O. Box belum
                  didukung saat ini.
                </p>
              </div>

              <div className="p-5 bg-white/70 border border-neutral-200/80 rounded-2xl space-y-2">
                <h3 className="font-bold text-xs text-brand-plum uppercase tracking-wider flex items-center gap-1.5">
                  <HandDrawnIcon name="package" className="h-3.5 w-3.5 text-brand-plum" />
                  <span>Ongkos Kirim & Batas Berat</span>
                </h3>
                <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                  Ongkos kirim internasional dihitung otomatis berdasarkan kelipatan berat per 1 kg
                  (1.000 gram). Batas bobot maksimal untuk pesanan kargo ekspor adalah
                  <span className="font-bold text-neutral-800"> 30.000 gram (30 kg)</span> per transaksi,
                  dengan dukungan multi-resi (multi-AWB) otomatis apabila paket besar dibagi menjadi
                  beberapa koli.
                </p>
              </div>

              <div className="p-5 bg-white/70 border border-neutral-200/80 rounded-2xl space-y-2">
                <h3 className="font-bold text-xs text-brand-plum uppercase tracking-wider flex items-center gap-1.5">
                  <HandDrawnIcon name="clipboard-list" className="h-3.5 w-3.5 text-brand-plum" />
                  <span>Bea Masuk & Pajak (DDU / De Minimis)</span>
                </h3>
                <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                  Pengiriman menggunakan skema <em>Delivered Duty Unpaid (DDU)</em>. Sesuai regulasi
                  Kastam Diraja Malaysia (JKDM), paket barang impor bernilai <strong>CIF ≤ RM 500</strong>
                  bebas bea masuk (<em>De Minimis</em>). Jika pesanan melebihi RM 500, pajak impor
                  (SST/LVG) atau biaya administrasi pabean menjadi tanggung jawab penerima.
                </p>
              </div>

              <div className="p-5 bg-white/70 border border-neutral-200/80 rounded-2xl space-y-2">
                <h3 className="font-bold text-xs text-brand-plum uppercase tracking-wider flex items-center gap-1.5">
                  <HandDrawnIcon name="sparkles" className="h-3.5 w-3.5 text-brand-plum" />
                  <span>Pelacakan Multi-AWB & Dokumen Ekspor</span>
                </h3>
                <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                  Setiap paket dilengkapi Commercial Invoice dan Packing List resmi dengan kode HS
                  tekstil. Nomor resi pelacakan internasional dapat dilacak langsung melalui portal
                  Ninja Van / Lion Parcel pada halaman detail pesanan Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Tracking Note */}
          <div className="space-y-4 text-xs text-neutral-600 leading-relaxed font-medium pt-2">
            <div className="flex items-start space-x-2">
              <HandDrawnIcon name="map-pin" className="h-4 w-4 shrink-0 mt-0.5 text-brand-plum" />
              <p>
                <span className="font-semibold text-neutral-900">Catatan Pelacakan:</span> Nomor
                Resi (AWB) akan diperbarui secara otomatis di halaman riwayat pesanan Anda
                selambat-lambatnya 1x24 jam setelah kurir melakukan pick-up paket dari gudang kami.
                Anda juga akan mendapatkan notifikasi status pengiriman langsung di web dan email Anda.
              </p>
            </div>
          </div>

          {/* Philosophy Footer quote */}
          <div className="border-t border-neutral-100 pt-8 text-center text-xs text-neutral-600 uppercase tracking-widest font-bold font-sans">
            &ldquo;From Bandung to Peninsular Malaysia — crafted with care, delivered with love.&rdquo;
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
