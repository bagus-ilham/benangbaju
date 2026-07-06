import React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/shared/components/Skeleton'

interface ProductCardSkeletonProps {
  className?: string
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col w-full text-left bg-white rounded-xl overflow-hidden border border-neutral-100',
        className
      )}
    >
      {/* Product Image Area */}
      <Skeleton className="aspect-[3/4] w-full rounded-none" />

      {/* Product Details Area */}
      <div className="p-4 flex flex-col flex-1 space-y-3">
        {/* Title & Brand */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-1/4 rounded-none" />
          <Skeleton className="h-4 w-3/4 rounded-none" />
        </div>

        {/* Price */}
        <div className="space-y-1 mt-auto pt-2">
          <Skeleton className="h-4 w-1/2 rounded-none" />
        </div>
      </div>
    </div>
  )
}
