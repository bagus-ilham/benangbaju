'use client'

import React, { useState, useEffect } from 'react'
import { SmartLink as Link } from '@/shared/components'
import { usePathname, useRouter } from 'next/navigation'
import { DesktopNavbar } from './DesktopNavbar'
import { MobileMenuDrawer } from './MobileMenuDrawer'
import { SearchOverlay } from './SearchOverlay'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { createBrowserClient } from '@/lib/supabase/client'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'
import toast from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { MiniCartDrawer } from './MiniCartDrawer'
import { Footer } from './Footer'
import { ScrollProgressBar } from './ScrollProgressBar'
import { ScrollToTopButton } from './ScrollToTopButton'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { useSiteSettings } from '@/shared/hooks/useSiteSettings'
import { FloatingWhatsApp } from './FloatingWhatsApp'
import { cn } from '@/lib/utils'

interface CustomerLayoutProps {
  children: React.ReactNode
}

const navLinks = [
  { name: 'Katalog', href: '/produk' },
  { name: 'Kategori', href: '/kategori' },
  { name: 'Koleksi', href: '/koleksi' },
  { name: 'Flash Sale', href: '/flash-sale' },
  { name: 'Tentang Kami', href: '/tentang' },
]

export function CustomerLayout({ children }: CustomerLayoutProps): React.JSX.Element {
  const pathname = usePathname()
  const router = useRouter()
  const [supabase] = useState(() => createBrowserClient())
  const { logoUrl, whatsappUrl } = useSiteSettings()

  const { user, profile, isAuthenticated, clearAuth } = useAuthStore()
  const totalQuantity = useCartStore((state) =>
    state.items.reduce((qty, item) => qty + item.quantity, 0)
  )
  const setCartDrawerOpen = useCartStore((state) => state.setCartDrawerOpen)
  const wishlistCount = useWishlistStore((state) => state.productIds.length)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [animateCart, setAnimateCart] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const pastThreshold = window.scrollY > 10
          setIsScrolled((prev) => {
            if (prev !== pastThreshold) return pastThreshold
            return prev
          })

          const pastScrollTopThreshold = window.scrollY > 400
          setShowScrollTop((prev) => {
            if (prev !== pastScrollTopThreshold) return pastScrollTopThreshold
            return prev
          })

          ticking = false
        })
        ticking = true
      }
    }

    const initTimer = setTimeout(() => {
      setIsMounted(true)
      handleScroll()
    }, 0)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      clearTimeout(initTimer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (totalQuantity > 0) {
      const initTimer = setTimeout(() => setAnimateCart(true), 0)
      const timer = setTimeout(() => setAnimateCart(false), 500)
      return () => {
        clearTimeout(initTimer)
        clearTimeout(timer)
      }
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
          <Link
            href="/produk"
            className="underline underline-offset-2 hover:text-brand-gold-light transition-colors"
          >
            Belanja Sekarang
          </Link>
        </p>
      </div>

      <ScrollProgressBar />

      <DesktopNavbar
        isScrolled={isScrolled}
        navLinks={navLinks}
        pathname={pathname}
        logoUrl={logoUrl}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        isSearchOpen={isSearchOpen}
        wishlistCount={wishlistCount}
        totalQuantity={totalQuantity}
        animateCart={animateCart}
        onOpenCart={() => setCartDrawerOpen(true)}
        isMounted={isMounted}
        isAuthenticated={isAuthenticated}
        profile={profile}
        user={user}
        onLogout={handleLogout}
      />

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navLinks={navLinks}
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        isMounted={isMounted}
      />

      {/* Main Page Area */}
      <main
        id="main-content"
        className={cn('flex-1 flex flex-col relative', pathname === '/' ? '-mt-16 z-0' : '')}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      <Footer />
      <ScrollToTopButton />
      <MiniCartDrawer />

      {/* Floating WhatsApp Bubble */}
      <AnimatePresence>
        {isMounted && (
          <FloatingWhatsApp
            whatsappUrl={whatsappUrl}
            showScrollTop={showScrollTop}
            pathname={pathname}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
