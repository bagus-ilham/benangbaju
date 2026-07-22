'use client'

import React, { useState } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Menu, Search, Heart, ShoppingBag, User as UserIcon, LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const isTransparentHome = pathname === '/' && !isScrolled

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300 border-b',
        isScrolled
          ? 'bg-white/80 backdrop-blur-md border-neutral-200 shadow-[0_2px_20px_rgba(0,0,0,0.06)]'
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center flex-1">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className={cn(
                'md:hidden p-2 -ml-2',
                isTransparentHome
                  ? 'text-white/90 hover:text-white'
                  : 'text-neutral-500 hover:text-brand-black'
              )}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => {
                const isMegaMenu =
                  link.name.toUpperCase() === 'KATEGORI' || link.name.toUpperCase() === 'KOLEKSI'

                if (isMegaMenu) {
                  return (
                    <MegaMenuNavItem
                      key={link.name}
                      label={link.name}
                      href={link.href}
                      isActive={pathname === link.href}
                      isTransparentHome={isTransparentHome}
                    />
                  )
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      'text-[10px] font-heading font-medium uppercase tracking-widest transition-colors duration-200 flex items-center nav-link-underline h-16',
                      pathname === link.href
                        ? 'text-brand-accent font-semibold font-bold'
                        : isTransparentHome
                          ? 'text-white/90 hover:text-white'
                          : 'text-neutral-500 hover:text-brand-accent'
                    )}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex justify-center flex-shrink-0 px-4">
            <Link
              href="/"
              className={cn(
                'font-heading text-base md:text-lg font-bold tracking-[0.2em] uppercase select-none transition-colors duration-300 flex items-center justify-center',
                isTransparentHome
                  ? 'text-white hover:text-neutral-200'
                  : 'text-brand-black hover:text-brand-accent'
              )}
            >
              {logoUrl ? (
                <div className="relative h-10 md:h-14 w-[110px] sm:w-[130px] md:w-[200px]">
                  <Image
                    src={getProxiedImageUrl(logoUrl)}
                    alt="Benangbaju Logo"
                    fill
                    priority
                    sizes="(max-width: 768px) 150px, 200px"
                    className={cn(
                      'object-contain text-transparent transition-all duration-300',
                      isTransparentHome && 'brightness-0 invert'
                    )}
                  />
                </div>
              ) : (
                'BENANGBAJU'
              )}
            </Link>
          </div>

          <div className="flex items-center justify-end space-x-1 sm:space-x-2 md:space-x-4 flex-1">
            <button
              onClick={onToggleSearch}
              className={cn(
                'p-2',
                isTransparentHome
                  ? 'text-white/90 hover:text-white'
                  : 'text-neutral-500 hover:text-brand-black'
              )}
              aria-label="Cari produk"
              aria-expanded={isSearchOpen}
            >
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <Link
              href="/wishlist"
              className={cn(
                'p-2 relative group',
                isTransparentHome
                  ? 'text-white/90 hover:text-white'
                  : 'text-neutral-500 hover:text-brand-black'
              )}
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:scale-110" />
              {isMounted && wishlistCount > 0 && (
                <motion.span
                  key={`wishlist-badge-${wishlistCount}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 bg-brand-accent text-white text-[8px] font-sans font-bold h-4 w-4 flex items-center justify-center rounded-full leading-none shadow-sm shadow-[0_0_10px_rgba(163,144,128,0.3)]"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </Link>

            <button
              onClick={onOpenCart}
              className={cn(
                'p-2 relative group cursor-pointer',
                isTransparentHome
                  ? 'text-white/90 hover:text-white'
                  : 'text-neutral-500 hover:text-brand-black'
              )}
              aria-label="Keranjang"
            >
              <motion.div
                animate={animateCart ? { scale: [1, 1.25, 0.95, 1], rotate: [0, -8, 8, 0] } : {}}
                transition={{ duration: 0.45 }}
                className="relative"
              >
                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:scale-110" />
              </motion.div>
              {isMounted && totalQuantity > 0 && (
                <motion.span
                  key={`cart-badge-${totalQuantity}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 bg-brand-accent text-white text-[8px] font-sans font-bold h-4 w-4 flex items-center justify-center rounded-full leading-none shadow-sm shadow-[0_0_10px_rgba(163,144,128,0.3)]"
                >
                  {totalQuantity}
                </motion.span>
              )}
            </button>

            <div className="relative">
              {isMounted && isAuthenticated ? (
                <div className="hidden sm:block">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={cn(
                      'p-2 flex items-center',
                      isTransparentHome
                        ? 'text-white/90 hover:text-white'
                        : 'text-neutral-500 hover:text-brand-black'
                    )}
                    aria-label="Menu pengguna"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                  >
                    <UserIcon className="h-4 w-4 md:h-5 md:w-5" />
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
                        className="absolute right-0 mt-3 w-56 bg-white border border-neutral-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-1 z-20 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                          <p className="text-[10px] text-neutral-400 font-heading uppercase tracking-wider mb-0.5">
                            Halo,
                          </p>
                          <p className="text-sm font-semibold text-brand-black truncate">
                            {profile?.name || user?.email}
                          </p>
                        </div>

                        <div className="p-1.5">
                          <Link
                            href="/akun"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-600 hover:bg-brand-cream/50 hover:text-brand-black font-medium rounded-md transition-colors"
                          >
                            <UserIcon className="h-4 w-4" />
                            <span>Akun Saya</span>
                          </Link>

                          {profile?.role === 'admin' && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-600 hover:bg-brand-cream/50 hover:text-brand-black font-semibold rounded-md transition-colors mt-0.5"
                            >
                              <div className="h-4 w-4 flex items-center justify-center bg-brand-accent text-white rounded-[4px] text-[8px]">
                                A
                              </div>
                              <span>Admin Panel</span>
                            </Link>
                          )}
                        </div>

                        <div className="p-1.5 border-t border-neutral-100">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              onLogout()
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-medium rounded-md transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Keluar</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/masuk"
                  className={cn(
                    'text-[10px] font-heading font-medium uppercase tracking-widest py-2 hidden sm:block',
                    isTransparentHome
                      ? 'text-white/90 hover:text-white'
                      : 'text-neutral-500 hover:text-brand-black'
                  )}
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
