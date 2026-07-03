import React from 'react'
import { Skeleton } from '@/shared/components/Skeleton'

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps): React.JSX.Element {
  return (
    <div className="w-full">
      {/* Header Row */}
      <div className="flex w-full border-b border-neutral-100 py-3 mb-2">
        {[...Array(columns)].map((_, i) => (
          <div key={`header-${i}`} className="flex-1 px-4">
            <Skeleton className="h-4 w-3/4 rounded-none" />
          </div>
        ))}
      </div>

      {/* Body Rows */}
      {[...Array(rows)].map((_, r) => (
        <div key={`row-${r}`} className="flex w-full border-b border-neutral-50 py-4 items-center">
          {[...Array(columns)].map((_, c) => (
            <div key={`cell-${r}-${c}`} className="flex-1 px-4">
              {c === 0 ? (
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 flex-shrink-0 rounded-none" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-3/4 rounded-none" />
                    <Skeleton className="h-3 w-1/2 rounded-none" />
                  </div>
                </div>
              ) : c === columns - 1 ? (
                <div className="flex justify-end space-x-2">
                  <Skeleton className="h-8 w-16 rounded-none" />
                </div>
              ) : (
                <Skeleton className="h-3 w-full max-w-[80%] rounded-none" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
