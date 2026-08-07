'use client'

import React from 'react'
import { SmartLink as Link, HandDrawnIcon, type HandDrawnIconName } from '@/shared/components'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'
import { useAuthStore } from '@/modules/users/stores/authStore'

interface MobileBottomNavProps {
  onOpenSearch?: () => void
}

export function MobileBottomNav({ onOpenSearch }: MobileBottomNavProps): React.JSX.Element {
  const pathname = usePathname()
  const wishlistCount = useWishlistStore((state) => state.productIds.length)
  const { isAuthenticated } = useAuthStore()

  const navItems: Array<{
    name: string
    href?: string
    onClick?: () => void
    lucideIcon?: React.ElementType
    handDrawnName?: HandDrawnIconName
    badge?: number | null
    isActive: boolean
  }> = [
    {
      name: 'Beranda',
      href: '/',
      handDrawnName: 'home',
      isActive: pathname === '/',
    },
    {
      name: 'Custom Size',
      href: '/produk/customize-size',
      handDrawnName: 'measuring-tape',
      isActive: pathname === '/produk/customize-size',
    },
    {
      name: 'Katalog',
      href: '/produk',
      handDrawnName: 'grid',
      isActive: pathname.startsWith('/produk'),
    },
    {
      name: 'Wishlist',
      href: '/wishlist',
      handDrawnName: wishlistCount > 0 || pathname === '/wishlist' ? 'heart-filled' : 'heart',
      badge: wishlistCount > 0 ? wishlistCount : null,
      isActive: pathname === '/wishlist',
    },
    {
      name: isAuthenticated ? 'Akun' : 'Masuk',
      href: isAuthenticated ? '/akun' : '/masuk',
      handDrawnName: 'user',
      isActive: pathname === '/akun' || pathname === '/masuk',
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-cream/95 backdrop-blur-lg border-t border-neutral-200/80 shadow-xs pb-safe font-sans">
      <nav className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const LucideIconComp = item.lucideIcon
          const content = (
            <div className="relative flex flex-col items-center justify-center w-full py-1">
              <div className="relative">
                {item.handDrawnName ? (
                  <HandDrawnIcon
                    name={item.handDrawnName}
                    className={cn(
                      'h-5 w-5 transition-transform duration-200',
                      item.isActive ? 'scale-110' : ''
                    )}
                  />
                ) : LucideIconComp ? (
                  <LucideIconComp
                    className={cn(
                      'h-5 w-5 transition-transform duration-200',
                      item.isActive ? 'text-brand-plum scale-110' : 'text-neutral-500'
                    )}
                    strokeWidth={item.isActive ? 2.5 : 1.75}
                  />
                ) : null}
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 bg-brand-gold text-brand-plum text-[8px] font-sans font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full leading-none shadow-xs"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </div>
              <span
                className={cn(
                  'text-[9px] font-sans font-bold uppercase tracking-wider mt-0.5 transition-colors',
                  item.isActive ? 'text-brand-plum' : 'text-neutral-500'
                )}
              >
                {item.name}
              </span>
              {item.isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -bottom-1 w-5 h-0.5 bg-brand-gold rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </div>
          )

          if (item.onClick) {
            return (
              <button
                key={item.name}
                type="button"
                onClick={item.onClick}
                className="flex-1 flex justify-center focus:outline-none cursor-pointer"
                aria-label={item.name}
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href!}
              className="flex-1 flex justify-center focus:outline-none"
            >
              {content}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
