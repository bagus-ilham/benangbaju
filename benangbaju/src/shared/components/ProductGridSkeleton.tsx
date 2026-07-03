import React from 'react'
import { cn } from '@/lib/utils'

interface ProductGridSkeletonProps {
  count?: number
  className?: string
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: ProductGridSkeletonProps): React.JSX.Element {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4] skeleton-shimmer" />
          <div className="h-2 w-1/3 skeleton-shimmer" />
          <div className="h-3 w-2/3 skeleton-shimmer" />
          <div className="h-3 w-1/4 skeleton-shimmer" />
        </div>
      ))}
    </div>
  )
}
