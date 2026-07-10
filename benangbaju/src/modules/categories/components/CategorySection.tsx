'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Category } from '@/modules/categories/types'
import { PageContainer, SectionHeader } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'

interface CategorySectionProps {
  categories: Category[]
}

export function CategorySection({ categories }: CategorySectionProps): React.JSX.Element | null {
  if (categories.length === 0) return null

  const mainCategories = categories.filter((c) => !c.parent_id).slice(0, 4)

  return (
    <section className="bg-white py-16 md:py-20 border-b border-neutral-100">
      <PageContainer>
        <SectionHeader eyebrow="Kategori Pilihan" title="Kategori Belanja" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
        >
          {mainCategories.map((cat, index) => (
            <motion.div key={cat.id} variants={fadeUpItem}>
              <Link
                href={`/kategori/${cat.slug}`}
                className="group relative aspect-square md:aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-neutral-100 block gold-border-hover card-hover-lift"
              >
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    sizes="(max-w-7xl) 25vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-xs text-neutral-400 font-sans uppercase">
                    {cat.name}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/50 via-neutral-900/10 to-transparent transition-opacity duration-500 group-hover:from-neutral-900/60" />

                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-xs font-heading font-semibold uppercase tracking-widest text-white">
                      {cat.name}
                    </span>
                    <span className="text-[9px] font-heading text-white/70 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="w-0 group-hover:w-full h-px bg-brand-gold-light transition-all duration-500 mt-2" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </PageContainer>
    </section>
  )
}
