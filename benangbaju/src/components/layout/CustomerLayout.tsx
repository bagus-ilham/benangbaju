'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Heart, ShoppingBag, User, LogOut, Menu, X, ChevronRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { createBrowserClient } from '@/lib/supabase/client'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { cn, formatIDR } from '@/lib/utils'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Input } from '@/components/shared'
import { MiniCartDrawer } from './MiniCartDrawer'
import { Footer } from './Footer'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { getProducts, type ProductListItem } from '@/services/products'
import { useQuery } from '@tanstack/react-query'
import { getSiteSettings } from '@/services/settings'
import { SOCIAL_LINKS } from '@/lib/constants'


interface CustomerLayoutProps {
  children: React.ReactNode
}

export function CustomerLayout({ children }: CustomerLayoutProps) : React.JSX.Element {
  const [pathname, setPathname] = useState('')
  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])
  const router = useRouter()
  const [supabase] = useState(() => createBrowserClient())

  const { data: settings = [] } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => getSiteSettings(supabase),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  const logoSetting = settings.find((s) => s.key === 'store_logo_url')
  const logoUrl = logoSetting?.value && logoSetting.value.trim() !== '' ? logoSetting.value : null

  const whatsappSetting = settings.find((s) => s.key === 'store_whatsapp' || s.key === 'whatsapp_number')
  const whatsappUrl = whatsappSetting?.value
    ? (whatsappSetting.value.startsWith('http') ? whatsappSetting.value : `https://wa.me/${whatsappSetting.value}`)
    : SOCIAL_LINKS.whatsapp
  
  const { user, profile, isAuthenticated, clearAuth } = useAuthStore()
  const { totalQuantity, setCartDrawerOpen } = useCart()
  const { productIds } = useWishlist()
  const wishlistCount = productIds.length
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [instantResults, setInstantResults] = useState<ProductListItem[]>([])
  const [isSearchingInstant, setIsSearchingInstant] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [animateCart, setAnimateCart] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isSearchOpen || searchQuery.trim().length < 2) {
      setInstantResults([])
      setIsSearchingInstant(false)
      return
    }

    setIsSearchingInstant(true)
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { products } = await getProducts(supabase, { searchQuery: searchQuery.trim(), limit: 3 })
        setInstantResults(products)
      } catch (err) {
        console.error('Instant search error:', err)
      } finally {
        setIsSearchingInstant(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, isSearchOpen, supabase])

  useEffect(() => {
    setIsMounted(true)
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10)
          
          const totalScroll = document.documentElement.scrollHeight - window.innerHeight
          if (totalScroll > 0) {
            const currentProgress = (window.scrollY / totalScroll) * 100
            setScrollProgress(currentProgress)
          }
          setShowScrollTop(window.scrollY > 400)
          ticking = false
        })
        ticking = true
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (totalQuantity > 0) {
      setAnimateCart(true)
      const timer = setTimeout(() => setAnimateCart(false), 500)
      return () => clearTimeout(timer)
    }
  }, [totalQuantity])


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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-brand-black focus:text-white focus:px-4 focus:py-2 focus:text-xs focus:font-heading focus:uppercase"
      >
        Lewati ke konten
      </a>
      {/* Announcement bar */}
      <div className="bg-brand-black text-white text-center py-2 px-4">
        <p className="text-[10px] font-heading font-medium uppercase tracking-[0.15em]">
          Gratis ongkir untuk pembelian di atas Rp 500.000 &mdash;{' '}
          <Link href="/produk" className="underline underline-offset-2 hover:text-brand-gold-light transition-colors">
            Belanja Sekarang
          </Link>
        </p>
      </div>

      {/* Header — Sticky clean navigation with glassmorphism */}
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

            <div className="flex justify-center absolute left-1/2 -translate-x-1/2">
              <Link
                href="/"
                className="font-heading text-base md:text-lg font-bold tracking-[0.2em] text-brand-black uppercase select-none hover:text-brand-gold transition-colors duration-300 flex items-center justify-center"
              >
                {logoUrl ? (
                  <div className="relative h-10 md:h-14 w-[150px] md:w-[200px]">
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

            {/* Right side: Action icons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-neutral-500 hover:text-brand-black p-2"
                aria-label="Cari produk"
                aria-expanded={isSearchOpen}
              >
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              {/* Wishlist */}
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

              {/* Cart */}
              <button
                onClick={() => setCartDrawerOpen(true)}
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


              {/* User Account / Menu */}
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
                      <User className="h-4 w-4 md:h-5 md:w-5" />
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
                          className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 border-t-2 border-t-brand-gold rounded-none shadow-lg py-1 z-20">
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

      {/* Glassmorphic Search Overlay Drawer */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-md flex flex-col items-center justify-start pt-20 px-4"
          >
            {/* Backdrop close area */}
            <div className="absolute inset-0 -z-10" onClick={() => setIsSearchOpen(false)} />

            <motion.div
              initial={{ y: -50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -30, scale: 0.95 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
              className="w-full max-w-2xl bg-white p-6 md:p-8 shadow-2xl relative border border-t-2 border-t-brand-gold border-neutral-100"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-brand-black transition-colors"
                aria-label="Tutup pencarian"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400">
                    Cari Koleksi
                  </span>
                  <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-brand-black">
                    Pencarian Produk
                  </h3>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative">
                  <Input
                    label="Kata kunci"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Masukkan kata kunci produk (cth: linen, kemeja, hijab)..."
                    rightIcon={
                      <button type="submit" aria-label="Cari produk">
                        <Search className="h-4 w-4" />
                      </button>
                    }
                    autoFocus
                  />
                </form>

                {/* Instant Autocomplete Results */}
                {searchQuery.trim().length >= 2 && (
                  <div className="border border-neutral-100 bg-neutral-50/50 p-4 -mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-neutral-400">
                        Hasil Pencarian Instan
                      </span>
                      {isSearchingInstant && (
                        // 🎨 PALETTE ENHANCEMENT
                        // Problem: Search input tidak memiliki debounce indicator berupa spinner loader yang jelas.
                        // Fix: Menambahkan ikon Loader2 berputar bersama teks "Mencari...".
                        // Impact: Indikator loading pencarian yang lebih jelas bagi user.
                        <div className="flex items-center space-x-1.5 text-brand-gold">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-[8px] font-heading font-semibold uppercase tracking-wider">
                            Mencari...
                          </span>
                        </div>
                      )}
                    </div>

                    {instantResults.length > 0 ? (
                      <div className="space-y-3">
                        {instantResults.map((product) => {
                          const primaryImg = product.product_images?.find((img) => img.is_primary)?.url 
                            || product.product_images?.[0]?.url 
                            || null;

                          const prices = product.product_variants?.map((v) => Number(v.price)) || [];
                          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                          return (
                            <Link
                              key={product.id}
                              href={`/produk/${product.slug}`}
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center space-x-3 p-2 bg-white border border-neutral-100 hover:border-brand-gold/50 transition-all duration-200 group"
                            >
                              <div className="relative aspect-[3/4] w-10 bg-neutral-50 border border-neutral-100 overflow-hidden flex-shrink-0">
                                {primaryImg ? (
                                  <Image
                                    src={primaryImg}
                                    alt={product.name}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[7px] text-neutral-400 uppercase font-sans">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] font-heading font-medium uppercase tracking-wider text-brand-black group-hover:text-brand-gold transition-colors truncate">
                                  {product.name}
                                </h4>
                                <p className="text-[10px] font-sans font-semibold text-neutral-500 mt-0.5">
                                  Mulai {formatIDR(minPrice)}
                                </p>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-neutral-300 group-hover:text-brand-gold group-hover:translate-x-0.5 transition-all" />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      !isSearchingInstant && (
                        <p className="text-[10px] text-neutral-400 font-sans py-1">
                          Tidak ada produk yang cocok dengan pencarian Anda.
                        </p>
                      )
                    )}
                  </div>
                )}

                {/* Popular Tags */}
                <div className="space-y-2.5">
                  <h4 className="text-[9px] uppercase tracking-widest font-heading font-medium text-neutral-400">
                    Pencarian Populer
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['Linen', 'Kemeja', 'Outer', 'Hijab', 'Tunika', 'Satin'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearchQuery(tag)
                          router.push(`/search?q=${encodeURIComponent(tag)}`)
                          setIsSearchOpen(false)
                        }}
                        className="px-3 py-1.5 border border-neutral-200 hover:border-brand-gold text-[10px] font-heading font-medium uppercase tracking-wider transition-all duration-200 text-neutral-600 hover:text-brand-gold hover:bg-brand-gold-muted/30 bg-white cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative flex w-full max-w-xs flex-col bg-white py-4 shadow-xl border-r border-neutral-100"
            >
              <div className="flex items-center justify-between px-6 pb-4 border-b border-neutral-100">
                <span className="font-heading text-sm font-bold tracking-[0.2em] text-brand-black uppercase">
                  MENU
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-neutral-400 hover:text-brand-black p-1"
                  aria-label="Tutup menu"
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
                  
                  {isMounted && !isAuthenticated && (
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Page Area */}
      <main id="main-content" className="flex-1 flex flex-col">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      <Footer />
      <MiniCartDrawer />

      {/* Floating WhatsApp Bubble */}
      <AnimatePresence>
        {isMounted && (
          <motion.a
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "fixed bottom-6 z-45 w-11 h-11 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:bg-[#20ba5a] hover:scale-110 active:scale-95 transition-all duration-350 cursor-pointer"
            )}
            style={{
              right: showScrollTop ? '80px' : '24px',
            }}
            aria-label="Chat WhatsApp"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.489 0 9.953-4.461 9.956-9.952.002-2.661-1.033-5.162-2.914-7.045C16.429 1.726 13.93 .689 11.27.689c-5.494 0-9.961 4.467-9.964 9.96-.001 1.93.501 3.81 1.456 5.429L1.737 22.09l6.096-1.6c1.559.851 3.018 1.251 4.6 1.251h-.002zm11.366-7.294c-.312-.156-1.848-.912-2.134-1.017-.286-.105-.495-.156-.703.156-.208.312-.807.105-.989.312-.182.208-.364.234-.676.078-.312-.156-1.318-.486-2.51-1.549-.928-.827-1.554-1.849-1.736-2.16-.182-.312-.02-.481.136-.636.14-.139.312-.364.468-.546.156-.182.208-.312.312-.52.104-.208.052-.39-.026-.546-.078-.156-.703-1.693-.963-2.319-.253-.611-.513-.53-.703-.53-.182-.01-.39-.01-.598-.01-.208 0-.546.078-.832.39-.286.312-1.092 1.066-1.092 2.6 0 1.534 1.118 3.016 1.274 3.224.156.208 2.199 3.359 5.328 4.709.745.321 1.326.513 1.778.656.75.238 1.433.205 1.973.125.602-.09 1.848-.755 2.11-1.484.26-.73.26-1.353.182-1.484-.078-.13-.286-.208-.598-.364z" />
            </svg>
          </motion.a>
        )}
      </AnimatePresence>

      {/* Scroll-to-Top Floating Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={handleScrollToTop}
            className="fixed bottom-6 right-6 z-40 p-3 bg-white text-brand-black shadow-lg border border-neutral-100 flex items-center justify-center cursor-pointer hover:border-brand-gold transition-colors group rounded-none"
            aria-label="Kembali ke atas"
          >
            {/* Circular Progress Path */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" viewBox="0 0 36 36">
              <path
                className="text-neutral-100"
                strokeWidth="1.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-brand-gold transition-all duration-100"
                strokeDasharray={`${scrollProgress}, 100`}
                strokeWidth="1.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <ChevronRight className="h-4 w-4 -rotate-90 group-hover:-translate-y-0.5 transition-transform text-brand-black relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
