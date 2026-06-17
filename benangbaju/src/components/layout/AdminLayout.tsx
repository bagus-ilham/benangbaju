'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderTree,
  Image,
  Ticket,
  Percent,
  MessageSquare,
  Settings,
  LogOut,
  User,
  Users,
  Truck,
  ExternalLink,
  Menu,
  X,
  Globe
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { createBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()
  const { user, profile, clearAuth } = useAuthStore()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pesanan', href: '/admin/pesanan', icon: ShoppingBag },
    { name: 'Produk', href: '/admin/produk', icon: Package },
    { name: 'Kategori', href: '/admin/kategori', icon: FolderTree },
    { name: 'Koleksi', href: '/admin/koleksi', icon: FolderTree },
    { name: 'Voucher', href: '/admin/voucher', icon: Ticket },
    { name: 'Flash Sale', href: '/admin/flash-sale', icon: Percent },
    { name: 'Banner Promo', href: '/admin/banner', icon: Image },
    { name: 'Ulasan Produk', href: '/admin/review', icon: MessageSquare },
    { name: 'Pelanggan', href: '/admin/pelanggan', icon: Users },
    { name: 'Pengiriman', href: '/admin/pengiriman', icon: Truck },
    { name: 'Konten & SEO', href: '/admin/cms', icon: Globe },
    { name: 'Pengaturan Toko', href: '/admin/pengaturan', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-shrink-0 lg:flex-col w-64 border-r border-neutral-200 bg-white">
        <div className="flex h-16 items-center px-6 border-b border-neutral-200">
          <Link href="/admin" className="font-heading text-xs font-bold tracking-[0.15em] text-brand-black uppercase">
            BENANGBAJU <span className="text-neutral-400 font-normal">CMS</span>
          </Link>
        </div>
        
        {/* Navigation list */}
        <div className="flex flex-col flex-1 overflow-y-auto pt-5 pb-4">
          <nav className="flex-1 px-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-xs font-medium rounded-none transition-colors duration-150',
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-brand-black'
                  )}
                >
                  <Icon className={cn('mr-3 h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-neutral-400 group-hover:text-brand-black')} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex-shrink-0 p-4 border-t border-neutral-200 bg-neutral-50">
          <Link
            href="/"
            className="flex items-center w-full px-3 py-2 text-xs font-medium text-neutral-600 hover:text-brand-black transition-colors"
          >
            <ExternalLink className="mr-3 h-4 w-4 text-neutral-400" />
            Ke Halaman Toko
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 mt-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar / Drawer */}
      {isSidebarOpen && (
        <div className="relative z-50 lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs" onClick={() => setIsSidebarOpen(false)} />
          
          {/* Sliding sidebar container */}
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-6 border-b border-neutral-200">
              <span className="font-heading text-xs font-bold tracking-[0.15em] text-brand-black uppercase">
                BENANGBAJU CMS
              </span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-neutral-400 hover:text-brand-black p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pt-5 pb-4 px-4">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        'flex items-center px-3 py-2.5 text-xs font-medium rounded-none transition-colors',
                        isActive
                          ? 'bg-neutral-900 text-white font-semibold'
                          : 'text-neutral-600 hover:bg-neutral-50'
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            <div className="p-4 border-t border-neutral-200 bg-neutral-50">
              <Link
                href="/"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center px-3 py-2 text-xs font-medium text-neutral-600"
              >
                <ExternalLink className="mr-3 h-4 w-4" />
                Ke Halaman Toko
              </Link>
              <button
                onClick={() => {
                  setIsSidebarOpen(false)
                  handleLogout()
                }}
                className="flex items-center w-full px-3 py-2 mt-1 text-xs font-medium text-red-600"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 flex-shrink-0 border-b border-neutral-200 bg-white z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="px-4 border-r border-neutral-200 text-neutral-500 hover:text-brand-black lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex-1 flex justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <h1 className="text-sm font-heading font-semibold uppercase tracking-wider text-neutral-700">
                {menuItems.find((item) => pathname === item.href)?.name || 'CMS Admin'}
              </h1>
            </div>
            
            <div className="ml-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-none bg-neutral-900 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {profile?.name?.substring(0, 2) || user?.email?.substring(0, 2) || 'AD'}
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-semibold text-brand-black">{profile?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-neutral-400 font-heading uppercase tracking-wider">{profile?.role || 'admin'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl animate-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
