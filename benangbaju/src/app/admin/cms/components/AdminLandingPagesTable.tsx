'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2, FileCode } from 'lucide-react'
import { Button } from '@/shared/components'
import { formatDate } from '@/lib/utils/format'
import type { LandingPage } from '@/modules/cms/types'

interface AdminLandingPagesTableProps {
  landingPages: LandingPage[]
  isLoading: boolean
  onEdit: (page: LandingPage) => void
  onDelete: (id: string, title: string) => void
}

export function AdminLandingPagesTable({
  landingPages,
  isLoading,
  onEdit,
  onDelete,
}: AdminLandingPagesTableProps) {
  if (isLoading) {
    return <div className="h-40 bg-white border border-neutral-200 animate-pulse" />
  }

  if (landingPages.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-neutral-200 text-neutral-400 text-xs italic bg-white">
        Belum ada halaman dinamis yang terdaftar.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {landingPages.map((page, idx) => (
        <motion.div
          key={page.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: idx * 0.04 }}
          whileHover={{ y: -2, transition: { duration: 0.1 } }}
          className="border border-neutral-200 bg-white p-5 space-y-4 flex flex-col justify-between hover:shadow-xs transition duration-150"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif font-bold text-neutral-900 text-base">{page.title}</h3>
                <p className="text-[10px] font-mono text-neutral-400 mt-0.5">Slug: /{page.slug}</p>
              </div>
              <span
                className={`inline-block text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 ${
                  page.is_active
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {page.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            {page.meta_title && (
              <p className="text-xs text-neutral-500">
                <strong className="text-neutral-700">Meta Title:</strong> {page.meta_title}
              </p>
            )}
            {page.meta_description && (
              <p className="text-xs text-neutral-500 max-w-md line-clamp-2">
                <strong className="text-neutral-700">Meta Desc:</strong> {page.meta_description}
              </p>
            )}

            <div className="pt-2">
              <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider flex items-center">
                <FileCode size={11} className="mr-1" /> JSON Content Keys:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {typeof page.content === 'object' &&
                  page.content !== null &&
                  !Array.isArray(page.content) &&
                  Object.keys(page.content).map((key) => (
                    <span
                      key={key}
                      className="bg-neutral-50 border border-neutral-200 text-[9px] px-1.5 py-0.5 text-neutral-600 font-mono"
                    >
                      {key}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
            <span className="text-[9px] text-neutral-400 font-mono">
              Dibuat: {formatDate(page.created_at)}
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={() => onEdit(page)}
                variant="outline"
                className="text-[10px] py-1.5 px-3 font-bold uppercase border-neutral-200"
              >
                <Edit size={11} className="mr-1" /> Edit
              </Button>
              <Button
                onClick={() => onDelete(page.id, page.title)}
                variant="outline"
                className="text-[10px] py-1.5 px-3 font-bold uppercase border-red-200 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={11} className="mr-1" /> Hapus
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
