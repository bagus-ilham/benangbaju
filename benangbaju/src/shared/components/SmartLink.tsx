'use client'

import React from 'react'
import NextLink, { LinkProps } from 'next/link'
import { useRouter } from 'next/navigation'

interface SmartLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>, LinkProps {
  children: React.ReactNode
}

/**
 * SmartLink is a wrapper around Next.js Link that aggressively prefetches
 * the destination URL as soon as the user hovers over it (on desktop) or
 * touches it (on mobile), resulting in near zero-latency transitions.
 */
export const SmartLink = React.forwardRef<HTMLAnchorElement, SmartLinkProps>(
  ({ children, onMouseEnter, onTouchStart, href, prefetch = true, ...props }, ref) => {
    const router = useRouter()

    const handlePrefetch = () => {
      try {
        if (typeof href === 'string') {
          router.prefetch(href)
        } else if (href && typeof href === 'object' && href.pathname) {
          router.prefetch(href.pathname)
        }
      } catch {
        // Ignore prefetch errors silently
      }
    }

    return (
      <NextLink
        ref={ref}
        href={href}
        prefetch={prefetch}
        onMouseEnter={(e) => {
          handlePrefetch()
          onMouseEnter?.(e)
        }}
        onTouchStart={(e) => {
          handlePrefetch()
          onTouchStart?.(e)
        }}
        {...props}
      >
        {children}
      </NextLink>
    )
  }
)

SmartLink.displayName = 'SmartLink'
