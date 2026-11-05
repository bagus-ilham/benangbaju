'use client'

import React from 'react'
import { SmartLink as Link, PageHero, PageContainer, HandDrawnIcon, type HandDrawnIconName } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'

export function CaraBelanjaClient(): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  const steps: Array<{
    handDrawnName: HandDrawnIconName
    title: string
    desc: string
  }> = isMY
    ? [
        {
          handDrawnName: 'shopping-bag',
          title: '1. Browse & Add to Bag',
          desc: 'Explore our apparel catalog, choose your color variant, size (check our Inch size guide), and quantity. Click "Add to Bag" to save.',
        },
        {
          handDrawnName: 'tag',
          title: '2. Review Bag & Apply Voucher',
          desc: 'Click the shopping bag icon on the top right to view your order summary. Enter promo voucher codes if available for special discounts.',
        },
        {
          handDrawnName: 'truck',
          title: '3. Enter Shipping Address & Select Courier',
          desc: 'Click "Checkout" and enter your West Malaysia address (Postcode 01000–86999). International shipping rates will be calculated by package weight.',
        },
        {
          handDrawnName: 'kancing',
          title: '4. Pay Instantly via DuitNow / TNG QR',
          desc: 'Review your total order cost, then proceed to payment. Pay effortlessly in Ringgit using QRIS Cross-Border via DuitNow, Touch \'n Go, or Maybank MAE.',
        },
        {
          handDrawnName: 'clipboard-list',
          title: '5. Track Live Delivery & Receive Package',
          desc: 'Once payment is confirmed, your order is dispatched from our Bandung atelier. Track your international airwaybill anytime in "My Account" → "My Orders".',
        },
      ]
    : [
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

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow={isMY ? 'Shopping Guide' : 'Panduan Belanja'}
        title={isMY ? 'How to Shop' : 'Cara Belanja'}
        subtitle={
          isMY
            ? 'Shopping with Benangbaju is seamless and secure. Follow these 5 simple steps.'
            : 'Belanja di Benangbaju sangatlah praktis dan aman. Ikuti 5 langkah mudah berikut.'
        }
      />

      <PageContainer size="md" className="py-12 md:py-16 page-content">
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-brand-cream border border-neutral-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start shadow-xs hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-gold/30 border border-amber-200/80 text-brand-plum flex items-center justify-center shrink-0">
                <HandDrawnIcon name={step.handDrawnName} className="h-6 w-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h2 className="font-heading font-bold text-base sm:text-lg text-brand-plum">
                  {step.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-12 text-center">
          <Link
            href="/produk"
            className="inline-flex items-center justify-center py-3.5 px-8 bg-brand-plum hover:bg-neutral-800 text-brand-gold rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-xs gap-2"
          >
            <span>{isMY ? 'Start Shopping Now' : 'Mulai Belanja Sekarang'}</span>
            <HandDrawnIcon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      </PageContainer>
    </div>
  )
}
