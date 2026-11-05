import React from 'react'
import { Metadata } from 'next'
import { PageHero, PageContainer } from '@/shared/components'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Benangbaju',
  description:
    'Syarat dan ketentuan umum penggunaan situs, pendaftaran akun, pembelian produk, pembayaran QRIS Cross-Border, pengiriman internasional Malaysia, dan kebijakan retur di Benangbaju.',
}

export default function SyaratKetentuanPage(): React.JSX.Element {
  const sections = [
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
        eyebrow="Ketentuan Penggunaan"
        title="Syarat & Ketentuan"
        subtitle="Perjanjian ketentuan transaksi, pembayaran digital, dan pengiriman barang di Benangbaju."
      />

      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-xs leading-relaxed text-neutral-600 font-sans">
            <p className="text-neutral-400 text-[10px] uppercase tracking-widest mb-3">
              Terakhir diperbarui: 5 November 2026
            </p>
            <p>
              Harap baca syarat dan ketentuan ini dengan saksama sebelum mulai melakukan transaksi
              pembelian produk. Penggunaan situs dan seluruh transaksi pesanan domestik maupun
              internasional Anda diatur oleh dokumen perjanjian ini.
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
