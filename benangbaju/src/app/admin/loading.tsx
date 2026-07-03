import React from 'react'

import { Skeleton } from '@/shared/components/Skeleton'

export default function AdminLoading(): React.JSX.Element {
  return (
    <div className="p-8 space-y-8 bg-neutral-50/50 min-h-full">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-1/3">
          <Skeleton className="h-6 w-3/4 rounded-none" />
          <Skeleton className="h-4 w-1/2 rounded-none" />
        </div>
        <Skeleton className="h-9 w-32 rounded-none" />
      </div>

      {/* Stats/Metrics Skeleton Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-none" />
        ))}
      </div>

      {/* Main Table/Content Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="h-[400px] w-full rounded-none" />
      </div>
    </div>
  )
}
