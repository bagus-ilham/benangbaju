'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Search, Grid, Heart, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'
import { useAuthStore } from '@/modules/users/stores/authStore'

interface MobileBottomNavProps {
  onOpenSearch: () => void
}

export function MobileBottomNav({ onOpenSearch }: MobileBottomNavProps): React.JSX.Element {
  const pathname = usePathname()
  const wishlistCount = useWishlistStore((state) => state.productIds.length)
  const { isAuthenticated } = useAuthStore()

  const navItems = [
    {
      name: 'Beranda',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      name: 'Cari',
      onClick: onOpenSearch,
      icon: Search,
      isActive: false,
    },
    {
      name: 'Katalog',
      href: '/produk',
      icon: Grid,
      isActive: pathname.startsWith('/produk'),
    },
    {
      name: 'Wishlist',
      href: '/wishlist',
      icon: Heart,
      badge: wishlistCount > 0 ? wishlistCount : null,
      isActive: pathname === '/wishlist',
    },
    {
      name: isAuthenticated ? 'Akun' : 'Masuk',
      href: isAuthenticated ? '/akun' : '/masuk',
      icon: UserIcon,
      isActive: pathname === '/akun' || pathname === '/masuk',
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-neutral-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <nav className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const content = (
            <div className="relative flex flex-col items-center justify-center w-full py-1">
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    item.isActive ? 'text-brand-accent scale-110' : 'text-neutral-500'
                  )}
                  strokeWidth={item.isActive ? 2.2 : 1.75}
                />
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 bg-brand-accent text-white text-[8px] font-sans font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full leading-none shadow-sm"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </div>
              <span
                className={cn(
                  'text-[9px] font-heading font-medium uppercase tracking-wider mt-0.5 transition-colors',
                  item.isActive ? 'text-brand-accent font-bold' : 'text-neutral-500'
                )}
              >
                {item.name}
              </span>
              {item.isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -bottom-1 w-5 h-0.5 bg-brand-accent rounded-full"
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
