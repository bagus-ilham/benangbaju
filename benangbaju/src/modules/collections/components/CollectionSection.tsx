'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Collection } from '@/modules/collections/types'
import { PageContainer, SectionHeader } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'

interface CollectionSectionProps {
  collections: Collection[]
}

export function CollectionSection({
  collections,
}: CollectionSectionProps): React.JSX.Element | null {
  if (collections.length === 0) return null

  const topCollections = collections.slice(0, 2)

  return (
    <section className="bg-white py-16 border-b border-neutral-100">
      <PageContainer>
        <SectionHeader eyebrow="Editorial Curated" title="Koleksi Pilihan" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {topCollections.map((col) => (
            <motion.div key={col.id} variants={fadeUpItem}>
              <Link
                href={`/koleksi/${col.slug}`}
                className="group relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 border border-neutral-100 block"
              >
                {col.image_url ? (
                  <Image
                    src={col.image_url}
                    alt={col.name}
                    fill
                    sizes="(max-w-7xl) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-xs text-neutral-400 font-sans uppercase">
                    {col.name}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 via-neutral-900/10 to-transparent transition-opacity group-hover:from-neutral-900/50" />

                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                  <div className="space-y-2 max-w-xs md:max-w-sm">
                    <h3 className="text-lg md:text-xl font-heading font-semibold uppercase tracking-wider">
                      {col.name}
                    </h3>
                    {col.description && (
                      <p className="text-[10px] md:text-xs text-neutral-200 line-clamp-2 font-sans">
                        {col.description}
                      </p>
                    )}
                    <span className="inline-block pt-2 text-[10px] font-heading font-medium uppercase tracking-widest border-b border-white pb-0.5 hover:text-neutral-200 transition-colors">
                      Lihat Koleksi
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </PageContainer>
    </section>
  )
}
