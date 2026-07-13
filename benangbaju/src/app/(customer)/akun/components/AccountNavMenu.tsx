import React from 'react'
import { motion } from 'framer-motion'
import { SmartLink as Link } from '@/shared/components'
import { ClipboardList, MapPin, Heart, Bell, LogOut } from 'lucide-react'

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
      <h2 className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-400 mb-4">
        Navigasi Akun
      </h2>

      <Link href="/pesanan">
        <motion.div
          whileHover={{ x: 4, borderColor: '#9a7b4f' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 px-4 py-3 border border-neutral-100 text-neutral-700 hover:text-brand-gold font-heading font-medium tracking-wide uppercase transition-colors duration-200 rounded-none text-xs bg-white cursor-pointer"
        >
          <ClipboardList size={14} className="text-neutral-400" />
          <span>Pesanan Saya</span>
        </motion.div>
      </Link>

      <Link href="/akun/alamat">
        <motion.div
          whileHover={{ x: 4, borderColor: '#9a7b4f' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 px-4 py-3 border border-neutral-100 text-neutral-700 hover:text-brand-gold font-heading font-medium tracking-wide uppercase transition-colors duration-200 rounded-none text-xs bg-white cursor-pointer"
        >
          <MapPin size={14} className="text-neutral-400" />
          <span>Daftar Alamat</span>
        </motion.div>
      </Link>

      <Link href="/wishlist">
        <motion.div
          whileHover={{ x: 4, borderColor: '#9a7b4f' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 px-4 py-3 border border-neutral-100 text-neutral-700 hover:text-brand-gold font-heading font-medium tracking-wide uppercase transition-colors duration-200 rounded-none text-xs bg-white cursor-pointer"
        >
          <Heart size={14} className="text-neutral-400" />
          <span>Wishlist Saya</span>
        </motion.div>
      </Link>

      <Link href="/akun/notifikasi">
        <motion.div
          whileHover={{ x: 4, borderColor: '#9a7b4f' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 px-4 py-3 border border-neutral-100 text-neutral-700 hover:text-brand-gold font-heading font-medium tracking-wide uppercase transition-colors duration-200 rounded-none text-xs bg-white cursor-pointer"
        >
          <Bell size={14} className="text-neutral-400" />
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
        className="w-full flex items-center space-x-3 px-4 py-3 border border-red-100 text-red-500 hover:text-red-700 font-heading font-medium tracking-wide uppercase transition-all duration-200 rounded-none text-xs text-left bg-white"
      >
        <LogOut size={14} />
        <span>Keluar dari Akun</span>
      </motion.button>
    </motion.div>
  )
}
