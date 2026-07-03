import React from 'react'
import { Metadata } from 'next'
import { Truck, ShieldCheck, Scale, MapPin } from 'lucide-react'
import { PageHero, PageContainer } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Informasi Pengiriman — Benangbaju',
  description: 'Informasi lengkap tarif, jadwal, cakupan daerah, ekspedisi pengiriman, dan kebijakan berat paket Benangbaju.',
}

export default function PengirimanPage() : React.JSX.Element {
  const deliveryPartners = [
    { name: 'JNE (Reguler / Oke / Yes)', area: 'Seluruh Indonesia', timeline: '1 – 3 hari kerja (YES), 2 – 5 hari kerja (REG)' },
    { name: 'J&T Express', area: 'Seluruh Indonesia', timeline: '2 – 4 hari kerja' },
    { name: 'SiCepat (Reg / Best)', area: 'Seluruh Indonesia', timeline: '1 – 3 hari kerja (BEST), 2 – 4 hari kerja (REG)' },
    { name: 'POS Indonesia', area: 'Seluruh Indonesia & Daerah Pelosok', timeline: '3 – 7 hari kerja' },
  ]

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Logistik & Pengiriman"
        title="Informasi Pengiriman"
        subtitle="Kebijakan, jadwal, dan mitra ekspedisi pengiriman Benangbaju."
      />
      <PageContainer size="md" className="py-12 page-content">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Delivery Terms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="border border-neutral-200 p-6 space-y-3 card-hover-lift bg-brand-cream/30">
            <div className="p-2 bg-brand-gold-muted border border-brand-gold/20 w-max">
              <Scale className="h-4 w-4 text-brand-gold" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
              Perhitungan Berat
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              Berat produk dihitung dalam satuan gram. Setiap total berat pesanan akan dibulatkan ke atas per 1.000 gram (1 kg) sesuai regulasi ekspedisi rekanan.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 rounded-none space-y-3">
            <div className="p-2 bg-neutral-100/80 rounded-none w-max">
              <Truck className="h-4 w-4 text-neutral-800" />
            </div>
            <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
              Jadwal Kirim
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              Pesanan dengan pembayaran terverifikasi sebelum pukul 15:00 WIB akan dikirim pada hari yang sama. Setelah jam tersebut, paket dikirim hari kerja berikutnya.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 rounded-none space-y-3">
            <div className="p-2 bg-neutral-100/80 rounded-none w-max">
              <ShieldCheck className="h-4 w-4 text-neutral-800" />
            </div>
            <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
              Garansi Asuransi
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              Setiap pengiriman dilengkapi dengan asuransi kehilangan. Jika paket terbukti hilang selama pengiriman, kami akan mengirimkan produk pengganti secara gratis.
            </p>
          </div>
        </div>

        {/* Courier Table Section */}
        <div className="space-y-4 pt-4">
          <h3 className="font-serif text-sm font-bold text-neutral-950 uppercase tracking-wider">
            Mitra Ekspedisi & Estimasi Waktu (ETD)
          </h3>
          
          <div className="border border-neutral-200 overflow-hidden rounded-none">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-900 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Ekspedisi</th>
                  <th className="p-4">Cakupan Wilayah</th>
                  <th className="p-4">Estimasi Pengiriman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600">
                {deliveryPartners.map((partner, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-bold text-neutral-900">{partner.name}</td>
                    <td className="p-4">{partner.area}</td>
                    <td className="p-4">{partner.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipping details text */}
        <div className="space-y-4 text-xs text-neutral-600 leading-relaxed font-medium">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold text-neutral-900">Catatan Pelacakan:</span> Nomor Resi (AWB) akan diperbarui secara otomatis di halaman riwayat pesanan Anda selambat-lambatnya 1x24 jam setelah kurir melakukan pick-up paket dari gudang kami. Anda juga akan mendapatkan notifikasi status pengiriman.
            </p>
          </div>
        </div>

        {/* Philosophy Footer quote */}
        </div>
      </PageContainer>
    </div>
  )
}
