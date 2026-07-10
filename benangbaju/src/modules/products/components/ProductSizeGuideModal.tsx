'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { formatProductDescription } from '@/lib/utils'

interface ProductSizeGuideModalProps {
  isOpen: boolean
  onClose: () => void
  productSizeGuide: string | null
}

export function ProductSizeGuideModal({
  isOpen,
  onClose,
  productSizeGuide,
}: ProductSizeGuideModalProps): React.JSX.Element {
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
            className="relative w-full max-w-lg bg-white p-6 shadow-2xl z-10 border border-t-4 border-t-brand-gold border-neutral-100"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-brand-black transition-colors cursor-pointer"
              aria-label="Tutup panduan ukuran"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-brand-gold">
                  Panduan
                </span>
                <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-brand-black">
                  Panduan Ukuran Pakaian (Size Chart)
                </h3>
                <p className="text-[10px] text-neutral-400 font-sans">
                  Semua ukuran dalam centimeter (cm). Toleransi perbedaan ukuran 1-2 cm wajar
                  terjadi.
                </p>
              </div>

              {productSizeGuide ? (
                productSizeGuide.trim().startsWith('http') ? (
                  <div className="w-full overflow-hidden border border-neutral-100 bg-neutral-50 p-2 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productSizeGuide.trim()}
                      alt="Panduan Ukuran"
                      className="w-full max-w-full h-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="whitespace-pre-line text-xs text-neutral-600 font-sans leading-relaxed border border-neutral-100 p-4 bg-neutral-50/30">
                    {formatProductDescription(productSizeGuide)}
                  </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px] font-sans">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">
                          Ukuran
                        </th>
                        <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">
                          Lingkar Dada
                        </th>
                        <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">
                          Lebar Bahu
                        </th>
                        <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">
                          Panjang Lengan
                        </th>
                        <th className="py-2.5 px-3 font-heading font-bold uppercase tracking-wider text-brand-black">
                          Panjang Baju
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-600">
                      <tr className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-brand-black">S</td>
                        <td className="py-2.5 px-3">92 cm</td>
                        <td className="py-2.5 px-3">37 cm</td>
                        <td className="py-2.5 px-3">55 cm</td>
                        <td className="py-2.5 px-3">135 cm</td>
                      </tr>
                      <tr className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-brand-black">M</td>
                        <td className="py-2.5 px-3">96 cm</td>
                        <td className="py-2.5 px-3">38 cm</td>
                        <td className="py-2.5 px-3">56 cm</td>
                        <td className="py-2.5 px-3">137 cm</td>
                      </tr>
                      <tr className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-brand-black">L</td>
                        <td className="py-2.5 px-3">102 cm</td>
                        <td className="py-2.5 px-3">40 cm</td>
                        <td className="py-2.5 px-3">57 cm</td>
                        <td className="py-2.5 px-3">140 cm</td>
                      </tr>
                      <tr className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-brand-black">XL</td>
                        <td className="py-2.5 px-3">110 cm</td>
                        <td className="py-2.5 px-3">42 cm</td>
                        <td className="py-2.5 px-3">58 cm</td>
                        <td className="py-2.5 px-3">142 cm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-100">
                <h4 className="text-[9px] uppercase tracking-widest font-heading font-medium text-brand-black/70 mb-1">
                  Tips Menentukan Ukuran:
                </h4>
                <ul className="list-disc list-inside text-[9px] text-neutral-500 space-y-1 leading-relaxed">
                  <li>
                    <strong>Lingkar Dada</strong>: Ukur di sekeliling bagian dada terlebar Anda
                    dengan pas.
                  </li>
                  <li>
                    <strong>Lebar Bahu</strong>: Ukur dari ujung bahu kiri ke ujung bahu kanan.
                  </li>
                  <li>
                    <strong>Panjang Baju</strong>: Ukur secara vertikal dari pangkal leher/bahu
                    hingga batas bawah baju yang diinginkan.
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
