import React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { getActiveFlashSale } from '@/services/flashSales'
import { FlashSaleSection } from '@/components/home/FlashSaleSection'

export const revalidate = 10 // revalidate frequently to keep timer accurate

export default async function FlashSalePage() {
  const supabase = await createServerClient()
  const flashSale = await getActiveFlashSale(supabase)

  return (
    <div className="bg-white min-h-screen">
      {flashSale ? (
        <div className="py-10">
          <FlashSaleSection flashSale={flashSale} />
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
            Penawaran Spesial
          </span>
          <h1 className="text-xl md:text-3xl font-heading font-light uppercase tracking-wider text-brand-black">
            Tidak Ada Flash Sale Aktif
          </h1>
          <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto">
            Saat ini sedang tidak ada promo flash sale yang berlangsung. Nantikan promo menarik berikutnya dari kami!
          </p>
          <div className="w-12 h-[1px] bg-brand-black mx-auto mt-6" />
        </div>
      )}
    </div>
  )
}
