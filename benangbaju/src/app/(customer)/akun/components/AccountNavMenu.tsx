'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { SmartLink as Link, HandDrawnIcon, type HandDrawnIconName } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'
import { cn } from '@/lib/utils'

interface AccountNavMenuProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemVariants?: any
  handleSignOut: () => void
  userName?: string | null
  userEmail?: string | null
}

export function AccountNavMenu({
  itemVariants,
  handleSignOut,
  userName,
  userEmail,
}: AccountNavMenuProps): React.JSX.Element {
  const pathname = usePathname()
  const market = useMarket()
  const isMY = market === 'MY'

  const displayName = userName?.trim() || userEmail || (isMY ? 'Member' : 'Pelanggan')
  const initial = displayName.charAt(0).toUpperCase()

  const navItems: Array<{ href: string; label: string; icon: HandDrawnIconName; isActive: boolean }> = [
    {
      href: '/akun',
      label: isMY ? 'My Profile' : 'Profil Saya',
      icon: 'user',
      isActive: pathname === '/akun',
    },
    {
      href: '/pesanan',
      label: isMY ? 'My Orders' : 'Pesanan Saya',
      icon: 'clipboard-list',
      isActive: pathname.startsWith('/pesanan'),
    },
    {
      href: '/akun/alamat',
      label: isMY ? 'Saved Addresses' : 'Daftar Alamat',
      icon: 'map-pin',
      isActive: pathname.startsWith('/akun/alamat'),
    },
    {
      href: '/wishlist',
      label: isMY ? 'My Wishlist' : 'Wishlist Saya',
      icon: 'heart',
      isActive: pathname === '/wishlist',
    },
    {
      href: '/akun/notifikasi',
      label: isMY ? 'My Notifications' : 'Notifikasi Saya',
      icon: 'bell',
      isActive: pathname.startsWith('/akun/notifikasi'),
    },
  ]

  return (
    <motion.div variants={itemVariants} className="space-y-4 md:col-span-1">
      {/* Boutique Member Greeting Card */}
      {(userName || userEmail) && (
        <div className="p-5 bg-brand-gold-soft/50 border border-brand-gold-stroke/45 rounded-3xl shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-gold border border-brand-gold-stroke/50 flex items-center justify-center font-serif text-lg font-medium text-brand-plum shrink-0 shadow-2xs">
            {initial}
          </div>
          <div className="min-w-0">
            <span className="inline-block text-sm font-accent font-bold text-brand-blue leading-none">
              {isMY ? 'Hello,' : 'Halo,'}
            </span>
            <p className="text-base font-serif font-medium text-brand-plum truncate leading-snug">
              {displayName}
            </p>
            {userEmail && userName && (
              <p className="text-[11px] text-brand-plum/65 font-sans truncate">{userEmail}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum/65 px-1 pb-1">
          {isMY ? 'Account Navigation' : 'Navigasi Akun'}
        </h2>

        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center justify-between px-4 py-3 border font-sans font-bold tracking-wide uppercase transition-all duration-200 rounded-2xl text-xs cursor-pointer shadow-2xs',
                item.isActive
                  ? 'bg-brand-blush/85 border-brand-blush-stroke text-brand-plum shadow-xs'
                  : 'bg-brand-cream border-brand-plum/10 text-brand-plum/85 hover:bg-brand-blue-soft/55 hover:border-brand-blue-stroke hover:text-brand-plum'
              )}
            >
              <span className="flex items-center space-x-3">
                <HandDrawnIcon name={item.icon} className="w-4 h-4" />
                <span>{item.label}</span>
              </span>
              {item.isActive && (
                <span className="w-2 h-2 rounded-full bg-brand-plum shrink-0" aria-hidden="true" />
              )}
            </motion.div>
          </Link>
        ))}

        <div className="pt-2">
          <motion.button
            type="button"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 border border-red-200/80 text-red-600 hover:bg-red-50/70 hover:border-red-300 hover:text-red-700 font-sans font-bold tracking-wide uppercase transition-all duration-200 rounded-2xl text-xs text-left bg-brand-cream cursor-pointer shadow-2xs"
          >
            <HandDrawnIcon name="logout" className="w-4 h-4" />
            <span>{isMY ? 'Sign Out' : 'Keluar dari Akun'}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
