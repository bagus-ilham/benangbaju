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
        <div
          key={i}
          className="rounded-2xl overflow-hidden border border-brand-plum/10 bg-brand-cream flex flex-col"
        >
          <div className="aspect-[3/4] bg-brand-surface/55 skeleton-shimmer" />
          <div className="p-3.5 space-y-2.5">
            <div className="h-2 w-1/3 rounded-full bg-brand-gold/70 skeleton-shimmer" />
            <div className="h-3.5 w-4/5 rounded-full skeleton-shimmer" />
            <div className="h-3 w-2/5 rounded-full skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}
