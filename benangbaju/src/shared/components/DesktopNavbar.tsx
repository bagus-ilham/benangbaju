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
      {/* Tier 1: Search / Hamburger (Left) · Sleek Logo (Center) · Utilities (Right) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-14 md:h-[58px] gap-2 sm:gap-4">
          {/* Left Column: Mobile Hamburger + Desktop Search Trigger */}
          <div className="flex items-center justify-start min-w-0">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 -ml-2 shrink-0 cursor-pointer text-brand-plum/85 hover:text-brand-plum transition-colors duration-200"
              aria-label={isMY ? 'Open menu' : 'Buka menu'}
            >
              <HandDrawnIcon name="menu" className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onToggleSearch}
              className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 -ml-2 rounded-full text-xs font-sans font-semibold text-brand-plum/80 hover:text-brand-plum hover:bg-brand-plum/5 transition-all duration-200 cursor-pointer group"
              aria-label={isMY ? 'Search products' : 'Cari produk'}
              aria-expanded={isSearchOpen}
            >
              <HandDrawnIcon
                name="search"
                className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
              />
              <span className="tracking-wide">{isMY ? 'Search...' : 'Cari...'}</span>
            </button>
          </div>

          {/* Center Column: Sleek Proportional Logo */}
          <div className="flex items-center justify-center shrink-0 px-2">
            <Link
              href="/"
              className="select-none transition-opacity duration-200 flex items-center justify-center whitespace-nowrap py-1 text-brand-plum hover:opacity-85"
            >
              <div className="relative h-7 sm:h-8 md:h-9 w-[96px] sm:w-[116px] md:w-[138px] min-w-[88px] max-w-[38vw]">
                <Image
                  src={getProxiedImageUrl(logoUrl || '/image/svg/logo/logo-benangbaju.svg')}
                  fallbackSrc="/image/svg/logo/logo-benangbaju.svg"
                  alt="Benangbaju Logotype"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 116px, 140px"
                  className="object-contain transition-all duration-300"
                />
              </div>
            </Link>
          </div>

          {/* Right Column: Market Switcher + Action Icons */}
          <div className="flex items-center justify-end space-x-1 sm:space-x-2 md:space-x-3">
            <MarketSwitcher variant="compact" isTransparentHome={false} />

            {/* Mobile/Tablet Search Icon */}
            <button
              type="button"
              onClick={onToggleSearch}
              className="lg:hidden p-2 relative group cursor-pointer text-brand-plum/85 hover:text-brand-plum transition-colors duration-200"
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

      {/* Tier 2: Desktop Centered Navigation Menu (inside full-gold header) */}
      <div className="hidden lg:block border-t border-brand-plum/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            className="flex items-center justify-center h-10 space-x-8 xl:space-x-10"
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
                    'text-[11px] font-heading font-semibold uppercase tracking-[0.16em] transition-colors duration-200 flex items-center nav-link-underline h-10 whitespace-nowrap',
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
        </div>
      </div>

      {/* Full-width scalloped bottom edge hanging seamlessly beneath navigation menu */}
      <ScallopEdge
        direction="down"
        fill="var(--color-brand-gold)"
        stroke="var(--color-brand-gold-stroke)"
        strokeOpacity={0.85}
        tileWidth={32}
        height={12}
        className={cn(
          'absolute left-0 right-0 top-full -mt-px z-20 pointer-events-none transition-[filter] duration-300',
          isScrolled && 'drop-shadow-[0_4px_6px_rgba(45,38,64,0.10)]'
        )}
      />
    </header>
  )
}
