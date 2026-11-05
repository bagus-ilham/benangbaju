'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HandDrawnIcon } from '@/shared/components'
import { formatProductDescription, cn } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'

interface ProductSizeGuideModalProps {
  isOpen: boolean
  onClose: () => void
  productSizeGuide: string | null
  productSizeGuideInch?: string | null
}

export function ProductSizeGuideModal({
  isOpen,
  onClose,
  productSizeGuide,
  productSizeGuideInch,
}: ProductSizeGuideModalProps): React.JSX.Element {
  const market = useMarket()
  const [selectedUnit, setSelectedUnit] = useState<'CM' | 'INCH' | null>(null)
  const unit = selectedUnit ?? (market === 'MY' ? 'INCH' : 'CM')

  const hasInchGuide = Boolean(productSizeGuideInch && productSizeGuideInch.trim())
  const hasCmGuide = Boolean(productSizeGuide && productSizeGuide.trim())

  const activeGuide = unit === 'INCH' && hasInchGuide ? productSizeGuideInch : productSizeGuide

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-brand-cream p-6 shadow-2xl z-10 border border-neutral-200/80 rounded-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-brand-plum transition-colors cursor-pointer"
              aria-label="Tutup panduan ukuran"
            >
              <HandDrawnIcon name="close" className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-sans font-bold text-brand-blue">
                    {unit === 'INCH' ? 'Size Guide' : 'Panduan Ukuran'}
                  </span>
                  <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-brand-plum">
                    {unit === 'INCH'
                      ? 'Size Chart (Inches)'
                      : 'Panduan Ukuran Pakaian (CM)'}
                  </h2>
                </div>

                {/* Unit Switcher: CM / INCH */}
                <div className="flex items-center bg-neutral-200/80 p-0.5 rounded-full border border-neutral-300 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedUnit('CM')}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer',
                      unit === 'CM'
                        ? 'bg-brand-plum text-white shadow-xs'
                        : 'text-neutral-600 hover:text-brand-plum'
                    )}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUnit('INCH')}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer',
                      unit === 'INCH'
                        ? 'bg-brand-plum text-white shadow-xs'
                        : 'text-neutral-600 hover:text-brand-plum'
                    )}
                  >
                    INCH (&quot;)
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-neutral-400 font-sans">
                {unit === 'INCH'
                  ? 'Ukuran dalam satuan Inci ("). Toleransi ukuran ±0.5 - 1 inch.'
                  : 'Semua ukuran dalam centimeter (cm). Toleransi perbedaan ukuran 1-2 cm wajar terjadi.'}
              </p>

              {/* Informational Banner if viewing INCH but product only has CM image */}
              {unit === 'INCH' && !hasInchGuide && hasCmGuide && (
                <div className="p-2.5 bg-amber-50 border border-amber-200/90 text-amber-900 rounded-xl text-[10px] leading-relaxed font-sans flex items-start gap-2">
                  <HandDrawnIcon name="sparkles" className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Konversi Inci:</strong> Panduan ukuran produk ini ditampilkan dalam centimeter (CM). Untuk konversi: <strong>1 inch = 2.54 cm</strong> (bagi nilai CM dengan 2.54).
                  </div>
                </div>
              )}

              {activeGuide ? (
                activeGuide.trim().startsWith('http') ? (
                  <div className="w-full overflow-hidden border border-neutral-100 bg-neutral-50 p-2 flex justify-center rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeGuide.trim()}
                      alt={`Panduan Ukuran (${unit})`}
                      className="w-full max-w-full h-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="whitespace-pre-line text-xs text-neutral-600 font-sans leading-relaxed border border-neutral-100 p-4 bg-neutral-50/30 rounded-xl">
                    {formatProductDescription(activeGuide)}
                  </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px] font-sans">
                    <thead>
                      <tr className="border-b border-neutral-200/80 bg-brand-blue/15">
                        <th className="py-2.5 px-3 font-sans font-bold uppercase tracking-wider text-brand-plum">
                          {unit === 'INCH' ? 'Size' : 'Ukuran'}
                        </th>
                        <th className="py-2.5 px-3 font-sans font-bold uppercase tracking-wider text-brand-plum">
                          {unit === 'INCH' ? 'Bust (Chest)' : 'Lingkar Dada'}
                        </th>
                        <th className="py-2.5 px-3 font-sans font-bold uppercase tracking-wider text-brand-plum">
                          {unit === 'INCH' ? 'Shoulder' : 'Lebar Bahu'}
                        </th>
                        <th className="py-2.5 px-3 font-sans font-bold uppercase tracking-wider text-brand-plum">
                          {unit === 'INCH' ? 'Sleeve' : 'Panjang Lengan'}
                        </th>
                        <th className="py-2.5 px-3 font-sans font-bold uppercase tracking-wider text-brand-plum">
                          {unit === 'INCH' ? 'Length' : 'Panjang Baju'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/60 text-neutral-600">
                      <tr className="hover:bg-brand-blue/5 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-brand-plum">S</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '36.2"' : '92 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '14.6"' : '37 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '21.7"' : '55 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '53.1"' : '135 cm'}</td>
                      </tr>
                      <tr className="hover:bg-brand-blue/5 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-brand-plum">M</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '37.8"' : '96 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '15.0"' : '38 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '22.0"' : '56 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '53.9"' : '137 cm'}</td>
                      </tr>
                      <tr className="hover:bg-brand-blue/5 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-brand-plum">L</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '40.2"' : '102 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '15.7"' : '40 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '22.4"' : '57 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '55.1"' : '140 cm'}</td>
                      </tr>
                      <tr className="hover:bg-brand-blue/5 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-brand-plum">XL</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '43.3"' : '110 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '16.5"' : '42 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '22.8"' : '58 cm'}</td>
                        <td className="py-2.5 px-3">{unit === 'INCH' ? '55.9"' : '142 cm'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-200/60">
                <h3 className="text-[9px] uppercase tracking-widest font-sans font-bold text-brand-plum mb-1">
                  {unit === 'INCH' ? 'How to Measure:' : 'Tips Menentukan Ukuran:'}
                </h3>
                <ul className="list-disc list-inside text-[9px] text-neutral-600 space-y-1 leading-relaxed">
                  <li>
                    <strong>{unit === 'INCH' ? 'Bust (Chest)' : 'Lingkar Dada'}</strong>: {unit === 'INCH' ? 'Measure around the fullest part of your chest with a tape measure.' : 'Ukur di sekeliling bagian dada terlebar Anda dengan pas.'}
                  </li>
                  <li>
                    <strong>{unit === 'INCH' ? 'Shoulder Width' : 'Lebar Bahu'}</strong>: {unit === 'INCH' ? 'Measure from the tip of one shoulder across the back to the other.' : 'Ukur dari ujung bahu kiri ke ujung bahu kanan.'}
                  </li>
                  <li>
                    <strong>{unit === 'INCH' ? 'Dress/Top Length' : 'Panjang Baju'}</strong>: {unit === 'INCH' ? 'Measure vertically from highest point of shoulder to desired hemline.' : 'Ukur secara vertikal dari pangkal leher/bahu hingga batas bawah baju yang diinginkan.'}
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
