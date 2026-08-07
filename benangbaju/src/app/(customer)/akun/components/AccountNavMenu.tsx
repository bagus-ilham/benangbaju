import React from 'react'
import { motion } from 'framer-motion'
import { SmartLink as Link, HandDrawnIcon } from '@/shared/components'

interface AccountNavMenuProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemVariants: any
  handleSignOut: () => void
}

export function AccountNavMenu({
  itemVariants,
  handleSignOut,
}: AccountNavMenuProps): React.JSX.Element {
  return (
    <motion.div variants={itemVariants} className="space-y-2 md:col-span-1">
      <h2 className="text-[10px] uppercase tracking-widest font-sans font-bold text-neutral-400 mb-4">
        Navigasi Akun
      </h2>

      <Link href="/pesanan">
        <motion.div
          whileHover={{ x: 4, borderColor: '#94b2b9' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 px-4 py-3 border border-neutral-200/80 text-brand-plum hover:text-brand-plum font-sans font-bold tracking-wide uppercase transition-colors duration-200 rounded-xl text-xs bg-brand-cream cursor-pointer shadow-xs"
        >
          <HandDrawnIcon name="clipboard-list" className="w-3.5 h-3.5" />
          <span>Pesanan Saya</span>
        </motion.div>
      </Link>

      <Link href="/akun/alamat">
        <motion.div
          whileHover={{ x: 4, borderColor: '#94b2b9' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 px-4 py-3 border border-neutral-200/80 text-brand-plum hover:text-brand-plum font-sans font-bold tracking-wide uppercase transition-colors duration-200 rounded-xl text-xs bg-brand-cream cursor-pointer shadow-xs"
        >
          <HandDrawnIcon name="map-pin" className="w-3.5 h-3.5" />
          <span>Daftar Alamat</span>
        </motion.div>
      </Link>

      <Link href="/wishlist">
        <motion.div
          whileHover={{ x: 4, borderColor: '#94b2b9' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 px-4 py-3 border border-neutral-200/80 text-brand-plum hover:text-brand-plum font-sans font-bold tracking-wide uppercase transition-colors duration-200 rounded-xl text-xs bg-brand-cream cursor-pointer shadow-xs"
        >
          <HandDrawnIcon name="heart" className="w-3.5 h-3.5" />
          <span>Wishlist Saya</span>
        </motion.div>
      </Link>

      <Link href="/akun/notifikasi">
        <motion.div
          whileHover={{ x: 4, borderColor: '#94b2b9' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 px-4 py-3 border border-neutral-200/80 text-brand-plum hover:text-brand-plum font-sans font-bold tracking-wide uppercase transition-colors duration-200 rounded-xl text-xs bg-brand-cream cursor-pointer shadow-xs"
        >
          <HandDrawnIcon name="bell" className="w-3.5 h-3.5" />
          <span>Notifikasi Saya</span>
        </motion.div>
      </Link>

      <motion.button
        whileHover={{
          x: 4,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(254,226,226,0.2)',
        }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSignOut}
        className="w-full flex items-center space-x-3 px-4 py-3 border border-red-200 text-red-600 hover:text-red-700 font-sans font-bold tracking-wide uppercase transition-all duration-200 rounded-xl text-xs text-left bg-brand-cream cursor-pointer shadow-xs"
      >
        <HandDrawnIcon name="logout" className="w-3.5 h-3.5" />
        <span>Keluar dari Akun</span>
      </motion.button>
    </motion.div>
  )
}
