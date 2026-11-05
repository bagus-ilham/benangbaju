'use client'

import React from 'react'
import { PageHero, PageContainer, HandDrawnIcon } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'

export function ReturClient(): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  const steps = isMY
    ? [
        {
          title: '1. Submit Return Form (Domestic)',
          desc: 'Sign in to your account, navigate to "My Orders", select the order, and click "Request Return". Provide honest reasons and bank details for refund processing.',
        },
        {
          title: '2. Customer Support Review',
          desc: 'Our Customer Care team will review your submission within 1 business day. Once approved, return warehouse address instructions will be provided.',
        },
        {
          title: '3. Ship Item Back',
          desc: 'Pack items securely with original tags intact. Ship via your preferred courier to our warehouse and enter tracking details on the return page.',
        },
        {
          title: '4. QC Inspection & Refund',
          desc: 'Upon arrival, our QC team inspects the items. If criteria are met, bank refund or replacement dispatch will be executed within 3-5 business days.',
        },
      ]
    : [
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
    isMY
      ? 'Hello Benangbaju, I am a customer from Malaysia and would like assistance with my order.'
      : 'Halo Benangbaju, saya pelanggan dari Malaysia ingin menanyakan kendala pesanan saya.'
  )}`

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow={isMY ? 'Satisfaction Guarantee' : 'Garansi Kepuasan'}
        title={isMY ? 'Return & Refund Policy' : 'Kebijakan Retur'}
        subtitle={
          isMY
            ? 'Terms and guidelines for domestic returns, size exchanges, and international Malaysia orders policy.'
            : 'Syarat dan panduan pengajuan retur, tukar ukuran domestik, dan kebijakan pesanan internasional Malaysia.'
        }
      />
      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Highlight Values Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="border border-neutral-200/80 p-6 rounded-2xl space-y-3 bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-2">
                <HandDrawnIcon name="clock" className="h-4 w-4" />
                <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs">
                  {isMY ? '7-Day Return Window (Domestic)' : 'Batas Waktu 7 Hari (Domestik)'}
                </h2>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                {isMY
                  ? 'For orders within Indonesia, return requests must be submitted within 7 calendar days after delivery.'
                  : 'Untuk pesanan wilayah Indonesia, pengajuan pengembalian barang wajib dilakukan selambat-lambatnya 7 hari kalender sejak status pesanan dinyatakan diterima oleh kurir.'}
              </p>
            </div>

            <div className="border border-neutral-200/80 p-6 rounded-2xl space-y-3 bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-2">
                <HandDrawnIcon name="alert-triangle" className="h-4 w-4" />
                <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs">
                  {isMY ? 'Product Physical Condition' : 'Syarat Fisik Barang'}
                </h2>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                {isMY
                  ? 'Products must be in their original condition: unworn, unwashed, scent-free, unaltered, and with original hangtags intact.'
                  : 'Produk harus dalam kondisi asli seperti saat diterima: belum pernah dicuci, tidak berbau parfum/keringat, tidak dimodifikasi/dijahit ulang, serta hangtag label produk masih utuh terpasang.'}
              </p>
            </div>
          </div>

          {/* International Orders Policy Card (Final Sale Malaysia) */}
          <div className="border border-amber-300 bg-amber-50/70 p-6 sm:p-8 rounded-2xl space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇲🇾</span>
                <h2 className="font-sans text-xs font-bold text-amber-950 uppercase tracking-wider">
                  {isMY
                    ? 'International Orders Policy: Malaysia (Final Sale)'
                    : 'Kebijakan Pesanan Internasional: Malaysia (Final Sale)'}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Final Sale
              </span>
            </div>

            <div className="space-y-3 text-xs text-amber-900 leading-relaxed font-medium">
              <p>
                {isMY
                  ? 'All orders shipped to Malaysia are strictly Final Sale. Self-service returns on the website are available exclusively for domestic Indonesian orders due to cross-border logistics costs, customs re-import procedures, and international tariffs.'
                  : 'Seluruh pesanan dengan pengiriman ke Malaysia berstatus Final Sale. Fitur pengajuan retur mandiri di situs web hanya berlaku untuk pesanan domestik Indonesia karena kendala biaya logistik balik lintas negara, proses re-impor pabean, serta tarif kepabeanan internasional.'}
              </p>
              <p>
                {isMY
                  ? 'Malaysian customers are advised to carefully check the size chart on the INCH / CM tab and material descriptions on each product page prior to completing their purchase.'
                  : 'Pelanggan di Malaysia sangat disarankan untuk memeriksa detail panduan ukuran pada tab INCH / CM dan deskripsi bahan di halaman produk sebelum menyelesaikan transaksi.'}
              </p>
            </div>

            {/* Defect Claim Protection for Malaysia */}
            <div className="p-4 bg-white/90 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <HandDrawnIcon name="check-circle" className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  {isMY
                    ? 'Defective or Incorrect Product Protection (Malaysia)'
                    : 'Jaminan Produk Rusak / Salah Kirim (Malaysia)'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-700 leading-relaxed">
                {isMY
                  ? 'If you receive an item with manufacturing defects or incorrect dispatch, you are fully protected. Please contact our Customer Care via WhatsApp within 48 hours of delivery, attaching an unedited unboxing video and photo of the parcel shipping label. We will provide 100% store voucher or replacement without requiring return shipment to Indonesia.'
                  : 'Jika Anda menerima produk dalam kondisi rusak/cacat pabrik atau tidak sesuai dengan pesanan, Anda tetap mendapatkan perlindungan penuh. Harap hubungi Customer Service kami melalui WhatsApp maksimal 2x24 jam setelah paket diterima dengan melampirkan video unboxing utuh tanpa jeda dan foto label paket. Tim kami akan memberikan kompensasi berupa voucher belanja 100% atau penggantian tanpa mewajibkan pengiriman balik barang yang rusak ke Indonesia.'}
              </p>
              <div className="pt-1">
                <a
                  href={whatsappInternationalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                >
                  <HandDrawnIcon name="whatsapp" className="h-3.5 w-3.5" />
                  <span>{isMY ? 'WhatsApp Order Support' : 'Klaim Kendala Pesanan Malaysia'}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Acceptable Reasons Section (Domestic) */}
          <div className="border border-neutral-200/80 p-8 rounded-2xl space-y-6 bg-brand-cream shadow-xs hover:shadow-md transition-all duration-300">
            <h2 className="font-sans text-brand-plum font-bold uppercase tracking-wider text-xs border-b border-neutral-200/60 pb-3">
              {isMY
                ? 'Eligible Return Categories (Indonesia Domestic Orders)'
                : 'Kategori Retur Yang Diterima (Pesanan Domestik Indonesia)'}
            </h2>

            <ul className="space-y-4 text-xs font-medium text-neutral-600">
              <li className="flex items-start space-x-2.5">
                <HandDrawnIcon name="check-circle" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">
                    {isMY ? 'Manufacturing Defects' : 'Cacat Produk (Defect)'}
                  </p>
                  <p>
                    {isMY
                      ? 'Fabric tears, open seams, permanent stains, broken buttons, or defective zippers prior to first wear.'
                      : 'Terdapat robekan kain, jahitan lepas ekstrem, noda kotoran permanen, kancing rusak, atau ritsleting macet sebelum pemakaian pertama.'}
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-2.5">
                <HandDrawnIcon name="check-circle" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">
                    {isMY ? 'Incorrect Dispatch' : 'Kesalahan Pengiriman'}
                  </p>
                  <p>
                    {isMY
                      ? 'Delivered product does not match order invoice (wrong colour, wrong style, or wrong size).'
                      : 'Produk yang dikirim tidak sesuai dengan invoice pesanan (salah warna, salah model, atau salah ukuran).'}
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-2.5">
                <HandDrawnIcon name="check-circle" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brand-plum mb-0.5">
                    {isMY ? 'Size Exchange (Domestic Only)' : 'Tukar Ukuran (Tukar Size)'}
                  </p>
                  <p>
                    {isMY
                      ? 'Customer ordered the wrong size (too small/large), subject to stock availability and customer bearing return & reshipment delivery costs.'
                      : 'Pembeli salah memilih ukuran (kekecilan/kebesaran), dengan catatan biaya pengiriman retur dan pengiriman kembali sepenuhnya ditanggung oleh pembeli, dan stok ukuran pengganti masih tersedia.'}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Step-by-step procedure (Domestic) */}
          <div className="space-y-4 pt-4">
            <h2 className="font-sans text-sm font-bold text-brand-plum uppercase tracking-wider">
              {isMY
                ? 'Self-Service Return Workflow (Domestic Indonesia)'
                : 'Alur Pengajuan Retur Mandiri (Domestik Indonesia)'}
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

