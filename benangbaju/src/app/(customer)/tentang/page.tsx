import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tentang Kami — Benangbaju',
  description: 'Kenali kisah di balik Benangbaju, produsen fashion muslim premium modern dengan desain minimalis, bahan berkualitas tinggi, dan kenyamanan terbaik.',
}

export default function TentangPage() {
  return (
    <div className="min-h-[60vh] py-16 px-4 sm:px-6 lg:px-8 bg-white text-neutral-800 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header Heading */}
        <div className="border-b border-neutral-100 pb-8 text-center sm:text-left">
          <h1 className="text-3xl font-serif text-neutral-900 tracking-tight mb-2">Tentang Kami</h1>
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Kisah & Visi Benangbaju</p>
        </div>

        {/* Story Section */}
        <div className="space-y-6 text-sm leading-relaxed text-neutral-600 font-medium">
          <p>
            Didirikan dengan visi untuk menghadirkan alternatif pakaian muslim yang bersahaja namun tetap berkarakter, 
            <span className="font-semibold text-neutral-900"> Benangbaju </span> lahir dari perpaduan kecintaan terhadap tekstil berkualitas 
            dan kebutuhan akan fashion yang praktis serta elegan untuk wanita modern Indonesia.
          </p>
          <p>
            Kami percaya bahwa kesederhanaan adalah bentuk kemewahan yang abadi. Oleh karena itu, setiap koleksi kami dirancang 
            dengan pendekatan desain minimalis modern, garis potongan yang bersih, serta palet warna bumi (earthy colors) yang 
            netral dan menenangkan. Kami menghindari detail berlebihan untuk memastikan pakaian Anda tetap relevan melintasi berbagai tren.
          </p>
        </div>

        {/* Quality Values Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
          <div className="border border-neutral-200 p-6 rounded-none space-y-3">
            <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
              Bahan Premium Pilihan
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              Kami menyeleksi bahan katun, linen, dan serat alam terbaik secara ketat. Pakaian kami didesain agar tetap adem, menyerap keringat, 
              dan nyaman dipakai seharian di iklim tropis Indonesia.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 rounded-none space-y-3">
            <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
              Jahitan Standar Butik
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              Setiap pakaian dijahit secara presisi oleh pengrajin lokal berpengalaman. Kami memastikan keliman rapi, pola presisi, 
              serta ketahanan jahitan yang kuat untuk investasi jangka panjang lemari pakaian Anda.
            </p>
          </div>
        </div>

        {/* Philosophy Footer quote */}
        <div className="border-t border-neutral-100 pt-8 text-center text-xs text-neutral-400 uppercase tracking-widest font-bold font-sans">
          &ldquo;Simple cuts, breathable fabrics, effortless daily wear.&rdquo;
        </div>
      </div>
    </div>
  )
}
