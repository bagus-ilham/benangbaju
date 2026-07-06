'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2 } from 'lucide-react'
import type { RedirectRule } from '@/modules/cms/types'

interface AdminRedirectsTableProps {
  redirects: RedirectRule[]
  isLoading: boolean
  onEdit: (rule: RedirectRule) => void
  onDelete: (id: string, path: string) => void
}

export function AdminRedirectsTable({
  redirects,
  isLoading,
  onEdit,
  onDelete,
}: AdminRedirectsTableProps) {
  if (isLoading) {
    return <div className="h-40 bg-white border border-neutral-200 animate-pulse" />
  }

  if (redirects.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-neutral-200 text-neutral-400 text-xs italic bg-white">
        Belum ada aturan pengalihan URL yang terdaftar.
      </div>
    )
  }

  return (
    <div className="border border-neutral-200 bg-white rounded-none overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-400 uppercase tracking-wider font-semibold">
            <th className="py-4 px-6">Jalur Asal (From)</th>
            <th className="py-4 px-6">Jalur Tujuan (To)</th>
            <th className="py-4 px-6 text-center">Status Code</th>
            <th className="py-4 px-6 text-center">Status</th>
            <th className="py-4 px-6 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
          {redirects.map((rule, idx) => (
            <motion.tr
              key={rule.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="hover:bg-neutral-50/30"
            >
              <td className="py-4 px-6 font-mono text-neutral-900">{rule.from_path}</td>
              <td className="py-4 px-6 font-mono text-neutral-600">{rule.to_path}</td>
              <td className="py-4 px-6 text-center">
                <span className="bg-neutral-100 text-neutral-800 text-[10px] px-2 py-0.5 border border-neutral-200 font-bold">
                  {rule.status_code}
                </span>
              </td>
              <td className="py-4 px-6 text-center">
                <span
                  className={`inline-block text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 ${
                    rule.is_active
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {rule.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="py-4 px-6 text-right space-x-1.5">
                <button
                  onClick={() => onEdit(rule)}
                  className="text-neutral-500 hover:text-neutral-800 p-1.5 inline-block border border-neutral-200"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={() => onDelete(rule.id, rule.from_path)}
                  className="text-red-500 hover:text-red-700 p-1.5 inline-block border border-red-100 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
