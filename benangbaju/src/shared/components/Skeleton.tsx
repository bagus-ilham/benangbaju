import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle'
}

export function Skeleton({
  className,
  variant = 'rect',
  ...props
}: SkeletonProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'skeleton-shimmer',
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
