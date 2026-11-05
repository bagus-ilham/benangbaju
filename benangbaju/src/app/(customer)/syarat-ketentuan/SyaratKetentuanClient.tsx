'use client'

import React from 'react'
import { PageHero, PageContainer } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'

export function SyaratKetentuanClient(): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  const sections = isMY
    ? [
        {
          title: '1. General Provisions',
          content:
            'Welcome to Benangbaju. By accessing, browsing, and purchasing through this website, you acknowledge that you have read, understood, and agreed to all applicable Terms & Conditions. These Terms & Conditions constitute a legally binding agreement between you and Benangbaju. We reserve the right to revise these provisions periodically, and we advise reviewing them on a regular basis.',
        },
        {
          title: '2. User Accounts & Security',
          content:
            'To track order statuses and manage delivery information effectively, customers are encouraged to maintain a registered account. You are solely responsible for maintaining password confidentiality and all activities under your account. Benangbaju reserves the right to suspend or terminate accounts demonstrating voucher manipulation, unauthorized abuse, or fraudulent activity.',
        },
        {
          title: '3. Ordering & Stock Availability',
          content:
            'All orders are subject to stock availability and payment verification. If inventory discrepancies occur, our support team will reach out promptly to offer alternative product selections or a prompt full refund. Minor color variations may occur between digital display screens and physical garments due to photographic studio lighting and display calibration.',
        },
        {
          title: '4. Pricing, Currency & Cross-Border QRIS Payments',
          content:
            'All transactions are officially priced and legally settled in Indonesian Rupiah (IDR). Displayed Ringgit Malaysia values (≈ RM) across product listings and shopping carts are approximate estimates based on store conversion rates. For orders shipping to Malaysia, payments are settled digitally through Cross-Border QRIS (DuitNow) powered by DOKU. The exact Ringgit Malaysia (MYR) debit amount is determined by your issuing bank/e-wallet exchange rate upon scanning the QR code, plus a 0.777% payment gateway MDR fee. In accordance with Bank Indonesia regulations, the maximum limit per QRIS transaction is IDR 10,000,000.',
        },
        {
          title: '5. Payment Expiry & Automatic Cancellation',
          content:
            'Once an order is created, buyers have a 90-minute window to complete payment. If payment is not verified by the payment gateway within this timeframe, the order is automatically marked cancelled and inventory items return to general availability. Benangbaju reserves the right to decline or cancel orders affected by anomalous technical pricing errors.',
        },
        {
          title: '6. International Shipping & Customs (Malaysia — DDU)',
          content:
            'International orders to Peninsular Malaysia (West Malaysia) are fulfilled from our Bandung atelier (postcode 40164) via authorized logistics partners (Ninja Van / Lion Parcel via KiriminAja). Export shipments operate under Delivered Duty Unpaid (DDU) terms. In accordance with Royal Malaysian Customs Department (JKDM) regulations, consignments with CIF value ≤ RM 500 qualify for duty exemption (De Minimis). Any duties, import sales taxes (SST/LVG), or clearance charges incurred above statutory thresholds are the sole responsibility of the consignee.',
        },
        {
          title: '7. Final Sale Policy on International Orders',
          content:
            'All orders shipped outside the Republic of Indonesia (including Malaysia) are strictly Final Sale. Self-service returns or size exchange requests are not available for international destinations due to cross-border return logistics complexity. However, if a defective or incorrect item is received, customers are protected with full store credit/replacement upon reporting via WhatsApp within 48 hours of delivery alongside an uninterrupted unboxing video.',
        },
        {
          title: '8. Intellectual Property',
          content:
            'All visual assets, trademarks, garment designs, product photography, editorial texts, and source code on Benangbaju are the proprietary property of Benangbaju and protected under international copyright treaties. Unauthorized reproduction or commercial re-use is strictly prohibited.',
        },
        {
          title: '9. Governing Law & Dispute Resolution',
          content:
            'These Terms & Conditions and all purchase contracts are governed by and construed under the laws of the Republic of Indonesia. Any disputes shall first be resolved through amicable consultation. If unresolved, disputes will be submitted to the jurisdiction of the District Court of Bandung, West Java, Indonesia.',
        },
      ]
    : [
        {
          title: '1. Ketentuan Umum',
          content:
            'Selamat datang di Benangbaju. Dengan mengakses, menjelajahi, dan bertransaksi di situs web ini, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan yang berlaku. Syarat & Ketentuan ini mengikat secara hukum antara Anda dan pihak Benangbaju. Ketentuan ini dapat diperbarui sewaktu-waktu tanpa pemberitahuan sebelumnya, dan kami menyarankan Anda untuk meninjaunya secara berkala.',
        },
        {
          title: '2. Akun Pengguna & Keamanan',
          content:
            'Untuk kenyamanan bertransaksi dan pelacakan pesanan, pengguna disarankan untuk membuat akun resmi. Anda bertanggung jawab penuh atas kerahasiaan kata sandi dan seluruh aktivitas yang dilakukan di akun Anda. Benangbaju berhak menonaktifkan atau menghapus akun secara sepihak apabila ditemukan indikasi penyalahgunaan, manipulasi voucher promosi, atau tindakan melanggar hukum lainnya.',
        },
        {
          title: '3. Pemesanan & Ketersediaan Stok Produk',
          content:
            'Semua pesanan tunduk pada konfirmasi pembayaran dan ketersediaan stok produk fisik di gudang kami. Apabila pesanan Anda mengalami ketidaksesuaian stok akibat gangguan inventaris sistem, kami akan segera menghubungi Anda untuk opsi penukaran produk atau pembatalan transaksi dengan pengembalian dana penuh. Warna dan tekstur produk pada layar Anda dapat memiliki sedikit deviasi dari produk aslinya akibat pencahayaan fotografi studio dan kalibrasi layar perangkat Anda.',
        },
        {
          title: '4. Harga, Mata Uang, & Pembayaran QRIS Cross-Border',
          content:
            'Semua transaksi di situs Benangbaju secara hukum diproses dalam mata uang Rupiah Indonesia (IDR). Tampilan perkiraan nilai Ringgit Malaysia (≈ RM) pada katalog dan keranjang belanja bersifat informasi estimasi berdasarkan kurs konversi toko. Untuk transaksi pesanan tujuan Malaysia, pembayaran dilakukan secara digital melalui QRIS Cross-Border (DuitNow) yang didukung oleh DOKU. Nilai akhir dalam Ringgit Malaysia (MYR) yang didebet dari rekening/e-wallet Anda ditentukan oleh kurs konversi resmi bank penerbit Anda saat pemindaian QRIS, ditambah biaya pemrosesan gerbang pembayaran (MDR) sebesar 0.777%. Sesuai regulasi Bank Indonesia, batas maksimal per transaksi QRIS adalah Rp 10.000.000 (sepuluh juta Rupiah).',
        },
        {
          title: '5. Batas Waktu Pembayaran & Pembatalan Otomatis',
          content:
            'Setelah pesanan dibuat, pembeli memiliki batas waktu 90 menit untuk menyelesaikan pembayaran. Apabila sesi pembayaran melewati batas waktu tersebut tanpa verifikasi berhasil dari payment gateway, sistem akan secara otomatis membatalkan pesanan (status: cancelled) dan mengembalikan stok varian ke etalase toko. Benangbaju juga berhak menolak atau membatalkan pesanan jika terdeteksi aktivitas penipuan atau anomali harga akibat kesalahan teknis sistem.',
        },
        {
          title: '6. Pengiriman Internasional & Ketentuan Bea Cukai (Malaysia — DDU)',
          content:
            'Pengiriman internasional ke Semenanjung Malaysia (West Malaysia) dilakukan dari warehouse kami di Bandung (40164) menggunakan mitra kurir resmi (Ninja Van / Lion Parcel via KiriminAja). Seluruh pengiriman ekspor dijalankan dengan skema DDU (Delivered Duty Unpaid). Sesuai ketentuan Kepabeanan Malaysia (Jabatan Kastam Diraja Malaysia), pesanan dengan nilai pabean (CIF) ≤ RM 500 dibebaskan dari bea masuk (De Minimis). Namun, apabila nilai barang melebihi ambang batas tersebut atau dikenakan pajak penjualan impor (SST/LVG) oleh pihak berwenang di Malaysia, biaya pajak dan administrasi kepabeanan sepenuhnya menjadi tanggung jawab penerima barang.',
        },
        {
          title: '7. Kebijakan Final Sale untuk Pesanan Internasional',
          content:
            'Seluruh pesanan dengan alamat tujuan di luar Republik Indonesia (termasuk Malaysia) bersifat Final Sale. Pembeli tidak dapat mengajukan pengembalian barang atau penukaran ukuran mandiri (self-service return). Jika pembeli menerima produk dalam kondisi rusak/cacat pabrik atau terdapat ketidaksesuaian item, pembeli dilindungi garansi penggantian/voucher belanja 100% dengan syarat melaporkan kendala ke Customer Care melalui WhatsApp maksimal 2x24 jam sejak paket diterima, disertai video unboxing utuh tanpa jeda.',
        },
        {
          title: '8. Hak Kekayaan Intelektual',
          content:
            'Seluruh materi yang terdapat pada situs web Benangbaju, termasuk merek dagang, logo, fotografi produk, tipografi, desain busana, teks panduan, dan kode sumber situs web adalah milik sah Benangbaju dan dilindungi oleh undang-undang hak cipta. Dilarang keras menggandakan, memodifikasi, atau menggunakan materi tersebut untuk kepentingan komersial tanpa izin tertulis dari manajemen Benangbaju.',
        },
        {
          title: '9. Hukum yang Mengatur (Governing Law) & Penyelesaian Sengketa',
          content:
            'Syarat & Ketentuan ini serta seluruh transaksi pembelian diatur dan ditafsirkan semata-mata berdasarkan hukum dan peraturan perundang-undangan Negara Kesatuan Republik Indonesia. Setiap perselisihan yang timbul sehubungan dengan transaksi ini akan diselesaikan terlebih dahulu melalui musyawarah untuk mencapai mufakat. Apabila kesepakatan tidak tercapai, sengketa akan diselesaikan melalui yurisdiksi Pengadilan Negeri Kota Bandung, Jawa Barat.',
        },
      ]

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow={isMY ? 'Terms of Use' : 'Ketentuan Penggunaan'}
        title={isMY ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
        subtitle={
          isMY
            ? 'Terms governing online purchases, digital payments, and delivery at Benangbaju.'
            : 'Perjanjian ketentuan transaksi, pembayaran digital, dan pengiriman barang di Benangbaju.'
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
                ? 'Please read these terms and conditions carefully before completing purchases. Your use of the website and all domestic and cross-border transactions are governed by this agreement.'
                : 'Harap baca syarat dan ketentuan ini dengan saksama sebelum mulai melakukan transaksi pembelian produk. Penggunaan situs dan seluruh transaksi pesanan domestik maupun internasional Anda diatur oleh dokumen perjanjian ini.'}
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
            Governing fair transactions across borders, ensuring premium experiences.
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
