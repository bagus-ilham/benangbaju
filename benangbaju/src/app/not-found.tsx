import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/shared/components'

export default function RootNotFound(): React.JSX.Element {
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center text-center p-6 bg-white font-sans">
      <div className="max-w-md space-y-6 flex flex-col items-center py-12">
        <div className="p-4 bg-neutral-50 border border-neutral-100 text-neutral-800 rounded-none mb-2">
          <HelpCircle className="h-10 w-10 text-neutral-450" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-heading font-light uppercase tracking-wider text-brand-black">
            404 — Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
            Maaf, halaman yang Anda tuju tidak dapat ditemukan atau telah dipindahkan.
          </p>
        </div>

        <div className="w-12 h-px bg-neutral-200" />

        <div className="flex justify-center space-x-3 w-full max-w-xs pt-2">
          <Link href="/" className="flex-1">
            <Button
              variant="primary"
              className="w-full text-[10px] py-3 uppercase tracking-wider font-bold rounded-none"
            >
              Beranda
            </Button>
          </Link>
          <Link href="/produk" className="flex-1">
            <Button
              variant="outline"
              className="w-full text-[10px] py-3 uppercase tracking-wider font-bold border-neutral-200 rounded-none"
            >
              Katalog
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
