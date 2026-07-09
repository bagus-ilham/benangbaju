'use client'

import React, { useState } from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Menu, Search, Heart, ShoppingBag, User as UserIcon, LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

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

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-md transition-all duration-300',
        isScrolled
          ? 'border-neutral-200 shadow-[0_2px_20px_rgba(0,0,0,0.06)]'
          : 'border-neutral-100'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center flex-1">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="text-neutral-500 hover:text-brand-black md:hidden p-2 -ml-2"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'text-[10px] font-heading font-medium uppercase tracking-widest transition-colors duration-200 nav-link-underline',
                    pathname === link.href
                      ? 'text-brand-gold font-semibold font-bold'
                      : 'text-neutral-500 hover:text-brand-gold'
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex justify-center flex-shrink-0 px-4">
            <Link
              href="/"
              className="font-heading text-base md:text-lg font-bold tracking-[0.2em] text-brand-black uppercase select-none hover:text-brand-gold transition-colors duration-300 flex items-center justify-center"
            >
              {logoUrl ? (
                <div className="relative h-10 md:h-14 w-[110px] sm:w-[130px] md:w-[200px]">
                  <Image
                    src={logoUrl}
                    alt="Benangbaju Logo"
                    fill
                    priority
                    sizes="(max-width: 768px) 150px, 200px"
                    className="object-contain"
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
              className="text-neutral-500 hover:text-brand-black p-2"
              aria-label="Cari produk"
              aria-expanded={isSearchOpen}
            >
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <Link
              href="/wishlist"
              className="text-neutral-500 hover:text-brand-black p-2 relative group"
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:scale-110" />
              {isMounted && wishlistCount > 0 && (
                <motion.span
                  key={`wishlist-badge-${wishlistCount}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 bg-brand-gold text-white text-[8px] font-sans font-bold h-4 w-4 flex items-center justify-center rounded-full leading-none shadow-sm shadow-[0_0_10px_rgba(154,123,79,0.3)]"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </Link>

            <button
              onClick={onOpenCart}
              className="text-neutral-500 hover:text-brand-black p-2 relative group cursor-pointer"
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
                  className="absolute -top-0.5 -right-0.5 bg-brand-gold text-white text-[8px] font-sans font-bold h-4 w-4 flex items-center justify-center rounded-full leading-none shadow-sm shadow-[0_0_10px_rgba(154,123,79,0.3)]"
                >
                  {totalQuantity}
                </motion.span>
              )}
            </button>

            <div className="relative">
              {isMounted && isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="text-neutral-500 hover:text-brand-black p-2 flex items-center"
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
                        className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 border-t-2 border-t-brand-gold rounded-none shadow-lg py-1 z-20"
                      >
                        <div className="px-4 py-2 border-b border-neutral-100">
                          <p className="text-[10px] text-neutral-400 font-heading uppercase tracking-wider">
                            Halo,
                          </p>
                          <p className="text-xs font-semibold text-brand-black truncate">
                            {profile?.name || user?.email}
                          </p>
                        </div>

                        <Link
                          href="/akun"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-brand-black font-medium"
                        >
                          Akun Saya
                        </Link>

                        {profile?.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-brand-black font-semibold border-t border-neutral-50"
                          >
                            Admin Panel
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            onLogout()
                          }}
                          className="w-full text-left block px-4 py-2 text-xs text-red-600 hover:bg-neutral-50 font-medium border-t border-neutral-100"
                        >
                          <div className="flex items-center space-x-1">
                            <LogOut className="h-3 w-3" />
                            <span>Keluar</span>
                          </div>
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/masuk"
                  className="text-[10px] font-heading font-medium uppercase tracking-widest text-neutral-500 hover:text-brand-black py-2 hidden sm:block"
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
