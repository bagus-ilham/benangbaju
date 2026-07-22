'use client'

import React, { useRef } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Category } from '@/modules/categories/types'
import { PageContainer, SectionHeader } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

interface CategorySectionProps {
  categories: Category[]
}

export function CategorySection({ categories }: CategorySectionProps): React.JSX.Element | null {
  const scrollRef = useRef<HTMLDivElement>(null)
  if (categories.length === 0) return null

  const mainCategories = categories.filter((c) => !c.parent_id)

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <section className="bg-white py-16 md:py-20 border-b border-neutral-100">
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <SectionHeader eyebrow="Kategori Pilihan" title="Kategori Belanja" />
          {mainCategories.length > 4 && (
            <div className="flex items-center space-x-2 pb-6">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div
            ref={scrollRef}
            className="flex space-x-4 md:space-x-6 overflow-x-auto scrollbar-none py-2 scroll-smooth snap-x"
          >
            {mainCategories.map((cat, index) => (
              <motion.div
                key={cat.id}
                variants={fadeUpItem}
                className="flex-none w-[200px] sm:w-[240px] md:w-[280px] snap-start"
              >
                <Link
                  href={`/kategori/${cat.slug}`}
                  className="group relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-neutral-100 block rounded-2xl hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] transition-all duration-500"
                >
                  {cat.image_url ? (
                    <Image
                      src={getProxiedImageUrl(cat.image_url)}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 240px, 300px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-xs text-neutral-400 font-sans uppercase">
                      {cat.name}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-neutral-900/10 to-transparent transition-opacity duration-500 group-hover:from-neutral-900/70" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm font-heading font-semibold uppercase tracking-widest text-white drop-shadow-sm">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-heading text-white/70 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {index < 9 ? `0${index + 1}` : index + 1}
                      </span>
                    </div>
                    <div className="w-0 group-hover:w-full h-px bg-brand-accent-light transition-all duration-500 mt-2" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </PageContainer>
    </section>
  )
}
