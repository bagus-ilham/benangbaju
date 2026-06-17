'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Heart, ShoppingBag, User, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { createBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'

interface CustomerLayoutProps {
  children: React.ReactNode
}

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()
  
  const { user, profile, isAuthenticated, clearAuth } = useAuthStore()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      clearAuth()
      toast.success('Berhasil keluar.')
      router.push('/masuk')
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Gagal keluar.'
      toast.error(errMsg)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setIsSearchOpen(false)
  }

  const navLinks = [
    { name: 'Katalog', href: '/produk' },
    { name: 'Kategori', href: '/kategori' },
    { name: 'Koleksi', href: '/koleksi' },
    { name: 'Flash Sale', href: '/flash-sale' },
    { name: 'Tentang Kami', href: '/tentang' },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header — Sticky THENBLANK style clean navigation with glassmorphism */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-100 bg-white/95 backdrop-blur-xs transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side: Mobile menu toggle & Desktop links */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
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
                      'text-[10px] font-heading font-medium uppercase tracking-widest transition-colors duration-200',
                      pathname === link.href
                        ? 'text-brand-black font-semibold'
                        : 'text-neutral-500 hover:text-brand-black'
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center: Brand Logo */}
            <div className="flex justify-center">
              <Link
                href="/"
                className="font-heading text-lg font-bold tracking-[0.2em] text-brand-black uppercase select-none"
              >
                BENANGBAJU
              </Link>
            </div>

            {/* Right side: Action icons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-neutral-500 hover:text-brand-black p-2"
                aria-label="Cari produk"
              >
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="text-neutral-500 hover:text-brand-black p-2 relative"
                aria-label="Wishlist"
              >
                <Heart className="h-4 w-4 md:h-5 md:w-5" />
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="text-neutral-500 hover:text-brand-black p-2 relative"
                aria-label="Keranjang"
              >
                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
              </Link>

              {/* User Account / Menu */}
              <div className="relative">
                {isAuthenticated ? (
                  <div>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="text-neutral-500 hover:text-brand-black p-2 flex items-center"
                      aria-label="Menu pengguna"
                    >
                      <User className="h-4 w-4 md:h-5 md:w-5" />
                    </button>

                    {isUserMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-none shadow-lg py-1 z-20 animate-fade-in">
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
                              handleLogout()
                            }}
                            className="w-full text-left block px-4 py-2 text-xs text-red-600 hover:bg-neutral-50 font-medium border-t border-neutral-100"
                          >
                            <div className="flex items-center space-x-1">
                              <LogOut className="h-3 w-3" />
                              <span>Keluar</span>
                            </div>
                          </button>
                        </div>
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

        {/* Search Panel Dropdown */}
        {isSearchOpen && (
          <div className="border-t border-neutral-100 bg-white py-4 shadow-inner animate-fade-in">
            <div className="mx-auto max-w-3xl px-4">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk di sini..."
                  className="w-full bg-neutral-50 text-xs px-4 py-3 pr-12 border border-neutral-200 rounded-none focus:border-brand-black focus:bg-white"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-3 p-2 text-neutral-400 hover:text-brand-black transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="relative flex w-full max-w-xs flex-col bg-white py-4 shadow-xl border-r border-neutral-100">
              <div className="flex items-center justify-between px-6 pb-4 border-b border-neutral-100">
                <span className="font-heading text-sm font-bold tracking-[0.2em] text-brand-black uppercase">
                  MENU
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-neutral-400 hover:text-brand-black p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                <nav className="flex flex-col space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-neutral-600 hover:text-brand-black',
                        pathname === link.href && 'text-brand-black font-semibold'
                      )}
                    >
                      <span>{link.name}</span>
                      <ChevronRight className="h-3 w-3 text-neutral-400" />
                    </Link>
                  ))}
                  
                  {!isAuthenticated && (
                    <Link
                      href="/masuk"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2 text-xs font-heading font-medium uppercase tracking-widest text-brand-black border-t border-neutral-100 pt-4"
                    >
                      <span>Masuk</span>
                      <ChevronRight className="h-3 w-3 text-brand-black" />
                    </Link>
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Page Area */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer — spacious off-white clean minimal footer */}
      <footer className="bg-brand-cream border-t border-neutral-200 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Col 1: Brand Info */}
            <div className="flex flex-col space-y-4">
              <span className="font-heading text-base font-bold tracking-[0.2em] text-brand-black uppercase">
                BENANGBAJU
              </span>
              <p className="text-[11px] text-neutral-500 leading-relaxed max-w-xs font-sans">
                Benangbaju menghadirkan fashion muslim premium modern untuk wanita Indonesia dengan desain minimalis, bahan berkualitas, dan kenyamanan terbaik.
              </p>
            </div>

            {/* Col 2: Pelayanan Pelanggan */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-black">
                Pelayanan
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/cara-belanja" className="text-[11px] text-neutral-500 hover:text-brand-black transition-colors font-sans">
                    Cara Belanja
                  </Link>
                </li>
                <li>
                  <Link href="/pengiriman" className="text-[11px] text-neutral-500 hover:text-brand-black transition-colors font-sans">
                    Informasi Pengiriman
                  </Link>
                </li>
                <li>
                  <Link href="/retur" className="text-[11px] text-neutral-500 hover:text-brand-black transition-colors font-sans">
                    Kebijakan Pengembalian (Retur)
                  </Link>
                </li>
                <li>
                  <Link href="/kontak" className="text-[11px] text-neutral-500 hover:text-brand-black transition-colors font-sans">
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Kebijakan & Hukum */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-black">
                Informasi
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/syarat-ketentuan" className="text-[11px] text-neutral-500 hover:text-brand-black transition-colors font-sans">
                    Syarat & Ketentuan
                  </Link>
                </li>
                <li>
                  <Link href="/kebijakan-privasi" className="text-[11px] text-neutral-500 hover:text-brand-black transition-colors font-sans">
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link href="/tentang" className="text-[11px] text-neutral-500 hover:text-brand-black transition-colors font-sans">
                    Tentang Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Newsletter / Social */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-black">
                Newsletter
              </h4>
              <p className="text-[11px] text-neutral-500 font-sans">
                Berlangganan untuk info koleksi terbaru dan promo eksklusif.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); toast.success('Berhasil mendaftar newsletter!'); }} className="flex">
                <input
                  type="email"
                  placeholder="Email Anda"
                  required
                  className="w-full bg-white text-[11px] px-3 py-2 border border-neutral-300 rounded-none focus:border-brand-black focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-brand-black text-white hover:bg-neutral-800 text-[10px] font-heading font-medium uppercase tracking-wider px-4 py-2 border border-brand-black"
                >
                  Daftar
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-neutral-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-[10px] text-neutral-400 font-sans">
              &copy; {new Date().getFullYear()} Benangbaju Store. All rights reserved.
            </p>
            <div className="flex space-x-6 text-[10px] text-neutral-400 font-heading uppercase tracking-wider">
              <span>Instagram</span>
              <span>TikTok</span>
              <span>WhatsApp</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
