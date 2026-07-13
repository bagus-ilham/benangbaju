'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, PackageSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: keyof T | string
  header: React.ReactNode
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  loadingRows?: number
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  emptyTitle?: string
  emptyDescription?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emptyIcon?: React.ElementType | any
  onRowClick?: (item: T) => void
  className?: string
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading,
  loadingRows = 5,
  onSort,
  sortBy,
  sortDirection,
  emptyTitle = 'Tidak ada data',
  emptyDescription,
  emptyIcon = PackageSearch,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return
    if (sortBy === key) {
      onSort(key, sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(key, 'asc')
    }
  }

  return (
    <div className={cn('w-full overflow-hidden bg-white border border-neutral-200', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/80 border-b border-neutral-200">
              {columns.map((col, idx) => (
                <th
                  key={String(col.key) || idx}
                  className={cn(
                    'px-6 py-4 text-[10px] font-heading font-bold uppercase tracking-wider text-neutral-500',
                    col.sortable && 'cursor-pointer hover:bg-neutral-100 transition-colors',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <div className="flex flex-col space-y-[1px]">
                        <ChevronUp
                          className={cn('w-2 h-2 text-neutral-300', {
                            'text-brand-black': sortBy === col.key && sortDirection === 'asc',
                          })}
                          strokeWidth={4}
                        />
                        <ChevronDown
                          className={cn('w-2 h-2 text-neutral-300', {
                            'text-brand-black': sortBy === col.key && sortDirection === 'desc',
                          })}
                          strokeWidth={4}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              Array.from({ length: loadingRows }).map((_, rIdx) => (
                <tr key={rIdx} className="bg-white">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={cn('px-6 py-4', col.className)}>
                      <Skeleton className="h-4 w-3/4 rounded-sm" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12">
                  <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <motion.tr
                  key={row.id || rIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: rIdx * 0.03 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'bg-white transition-colors duration-200 group hover:bg-neutral-50/80',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={String(col.key) || cIdx}
                      className={cn('px-6 py-4 text-xs font-sans text-neutral-700', col.className)}
                    >
                      {col.render
                        ? col.render(row)
                        : (row as unknown as Record<string, React.ReactNode>)[String(col.key)]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
