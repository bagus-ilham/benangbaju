import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle'
}

export function Skeleton({ className, variant = 'rect', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200',
        {
          'rounded-none': variant === 'rect',
          'rounded-full': variant === 'circle',
        },
        className
      )}
      {...props}
    />
  )
}
