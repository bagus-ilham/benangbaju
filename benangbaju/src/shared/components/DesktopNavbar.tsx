'use client'

import React, { useState } from 'react'
import {
  SmartLink as Link,
  SmartImage as Image,
  HandDrawnIcon,
  MarketSwitcher,
  ScallopEdge,
} from '@/shared/components'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import { MegaMenuNavItem } from './MegaMenuNavItem'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

interface DesktopNavbarProps {
  isScrolled: boolean
  navLinks: { name: string; href: string }[]
  pathname: string
  logoUrl: string | null
  onOpenMobileMenu: () => void
  onToggleSearch: () => void
  isSearchOpen: boolean
  wishlistCount: number
  totalQuantity: number
  animateCart: boolean
  onOpenCart: () => void
  isMounted: boolean
  isAuthenticated: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: Record<string, any> | null
  user: User | null
  onLogout: () => void
}

export function DesktopNavbar({
  isScrolled,
  navLinks,
  pathname,
  logoUrl,
  onOpenMobileMenu,
  onToggleSearch,
  isSearchOpen,
  wishlistCount,
  totalQuantity,
  animateCart,
  onOpenCart,
  isMounted,
  isAuthenticated,
  profile,
  user,
  onLogout,
}: DesktopNavbarProps) {
  const market = useMarket()
  const isMY = market === 'MY'
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-brand-gold transition-shadow duration-300',
        isScrolled && 'shadow-[0_6px_24px_-12px_rgba(45,38,64,0.18)]'
      )}
    >
      {/* Single-Row Header: Logo + Market Switcher (Left) · Nav Links (Center) · Utility Icons (Right) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex lg:grid lg:grid-cols-[1fr_auto_1fr] items-center justify-between h-14 md:h-[64px] gap-2 sm:gap-4">
          {/* Left Column: Mobile Hamburger + Logo + Market Switcher */}
          <div className="flex items-center justify-start gap-2 sm:gap-3 lg:gap-4 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 -ml-2 shrink-0 cursor-pointer text-brand-plum/85 hover:text-brand-plum transition-colors duration-200"
              aria-label={isMY ? 'Open menu' : 'Buka menu'}
            >
              <HandDrawnIcon name="menu" className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className="select-none transition-opacity duration-200 flex items-center justify-start whitespace-nowrap py-1 text-brand-plum hover:opacity-85 shrink-0"
            >
              <div className="relative h-7 sm:h-8 md:h-9 w-[96px] sm:w-[116px] md:w-[128px] min-w-[88px]">
                <Image
                  src={getProxiedImageUrl(logoUrl || '/image/svg/logo/logo-benangbaju.svg')}
                  fallbackSrc="/image/svg/logo/logo-benangbaju.svg"
                  alt="Benangbaju Logotype"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 116px, 130px"
                  className="object-contain object-left transition-all duration-300"
                />
              </div>
            </Link>

            <MarketSwitcher variant="compact" isTransparentHome={false} className="shrink-0" />
          </div>

          {/* Center Column: Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center justify-center space-x-5 xl:space-x-8"
            aria-label={isMY ? 'Main navigation' : 'Navigasi utama'}
          >
            {navLinks.map((link) => {
              const isMegaMenu =
                link.href === '/kategori' ||
                link.href === '/koleksi' ||
                link.name.toUpperCase() === 'KATEGORI' ||
                link.name.toUpperCase() === 'KOLEKSI'

              if (isMegaMenu) {
                return (
                  <MegaMenuNavItem
                    key={link.name}
                    label={link.name}
                    href={link.href}
                    isActive={pathname === link.href}
                    isTransparentHome={false}
                  />
                )
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'text-[11px] font-heading font-semibold uppercase tracking-[0.14em] transition-colors duration-200 flex items-center nav-link-underline h-14 md:h-[64px] whitespace-nowrap',
                    pathname === link.href
                      ? 'text-brand-plum font-bold'
                      : 'text-brand-plum/75 hover:text-brand-plum'
                  )}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Right Column: Search, Wishlist, Shopping Bag, Account */}
          <div className="flex items-center justify-end space-x-0.5 sm:space-x-1.5 md:space-x-3 shrink-0">
            <button
              type="button"
              onClick={onToggleSearch}
              className="p-2 relative group cursor-pointer text-brand-plum/85 hover:text-brand-plum transition-colors duration-200"
              aria-label={isMY ? 'Search products' : 'Cari produk'}
              aria-expanded={isSearchOpen}
            >
              <HandDrawnIcon
                name="search"
                className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:scale-110"
              />
            </button>

            <Link
              href="/wishlist"
              className="p-2 relative group hidden sm:inline-flex cursor-pointer text-brand-plum/85 hover:text-brand-plum transition-colors duration-200"
              aria-label="Wishlist"
            >
              <HandDrawnIcon
                name={wishlistCount > 0 ? 'heart-filled' : 'heart'}
                className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:scale-110"
              />
              {isMounted && wishlistCount > 0 && (
                <motion.span
                  key={`wishlist-badge-${wishlistCount}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 bg-brand-plum text-brand-gold text-[9px] font-sans font-bold h-4 w-4 flex items-center justify-center rounded-full leading-none shadow-xs"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </Link>

            <button
              type="button"
              onClick={onOpenCart}
              className="p-2 relative group cursor-pointer text-brand-plum/85 hover:text-brand-plum transition-colors duration-200"
              aria-label={isMY ? 'Shopping Bag' : 'Keranjang'}
            >
              <motion.div
                animate={animateCart ? { scale: [1, 1.25, 0.95, 1], rotate: [0, -8, 8, 0] } : {}}
                transition={{ duration: 0.45 }}
                className="relative"
              >
                <HandDrawnIcon
                  name="shopping-bag"
                  className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:scale-110"
                />
              </motion.div>
              {isMounted && totalQuantity > 0 && (
                <motion.span
                  key={`cart-badge-${totalQuantity}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 bg-brand-plum text-brand-gold text-[9px] font-sans font-bold h-4 w-4 flex items-center justify-center rounded-full leading-none shadow-xs"
                >
                  {totalQuantity}
                </motion.span>
              )}
            </button>

            <div className="relative z-30">
              {isMounted && isAuthenticated ? (
                <div className="hidden sm:block">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="p-2 relative group flex items-center cursor-pointer text-brand-plum/85 hover:text-brand-plum transition-colors duration-200"
                    aria-label={isMY ? 'User menu' : 'Menu pengguna'}
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                  >
                    <HandDrawnIcon
                      name="user"
                      className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:scale-110"
                    />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-3 w-56 bg-brand-cream border border-neutral-200/80 rounded-xl shadow-[0_10px_40px_-10px_rgba(45,38,64,0.14)] py-1 z-50 overflow-hidden font-sans"
                      >
                        <div className="px-4 py-3 border-b border-neutral-200/60 bg-brand-cream">
                          <p className="text-[10px] text-neutral-400 font-sans font-bold uppercase tracking-wider mb-0.5">
                            {isMY ? 'Hello,' : 'Halo,'}
                          </p>
                          <p className="text-sm font-bold text-brand-plum truncate">
                            {profile?.name || user?.email}
                          </p>
                        </div>

                        <div className="p-1.5">
                          <Link
                            href="/akun"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-600 hover:bg-brand-blue/15 hover:text-brand-plum font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            <HandDrawnIcon name="user" className="h-4 w-4" />
                            <span>{isMY ? 'My Account' : 'Akun Saya'}</span>
                          </Link>

                          {(profile?.role?.toLowerCase() === 'admin' ||
                            profile?.role?.toLowerCase() === 'staff') && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-600 hover:bg-brand-blue/15 hover:text-brand-plum font-bold rounded-lg transition-colors mt-0.5 cursor-pointer"
                            >
                              <div className="h-4 w-4 flex items-center justify-center bg-brand-blue text-brand-plum rounded-[4px] text-[8px] font-bold">
                                A
                              </div>
                              <span>Admin Panel</span>
                            </Link>
                          )}
                        </div>

                        <div className="p-1.5 border-t border-neutral-200/60">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              onLogout()
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-medium rounded-md transition-colors cursor-pointer"
                          >
                            <HandDrawnIcon name="logout" className="h-4 w-4" />
                            <span>{isMY ? 'Sign Out' : 'Keluar'}</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/masuk"
                  className="text-[11px] font-heading font-semibold uppercase tracking-widest py-2 px-1 hidden sm:block cursor-pointer text-brand-plum/85 hover:text-brand-plum transition-colors duration-200 nav-link-underline"
                >
                  {isMY ? 'Sign In' : 'Masuk'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-width bold scalloped bottom edge hanging seamlessly beneath header */}
      <ScallopEdge
        direction="down"
        fill="var(--color-brand-gold)"
        stroke="var(--color-brand-gold-stroke)"
        strokeOpacity={0.85}
        className={cn(
          'absolute left-0 right-0 top-full -mt-px z-20 pointer-events-none transition-[filter] duration-300',
          isScrolled && 'drop-shadow-[0_4px_6px_rgba(45,38,64,0.10)]'
        )}
      />
    </header>
  )
}
