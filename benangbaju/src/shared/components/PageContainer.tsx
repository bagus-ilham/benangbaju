import React from 'react'
import { cn } from '@/lib/utils'

type PageContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: PageContainerSize
}

const sizeClasses: Record<PageContainerSize, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  full: 'max-w-7xl',
}

export function PageContainer({
  className,
  size = 'full',
  children,
  ...props
}: PageContainerProps): React.JSX.Element {
  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)} {...props}>
      {children}
    </div>
  )
}
