'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/modules/users/stores/authStore'
import {
  useUserNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/modules/notifications/hooks/useNotifications'
import { AuthLoading, PageContainer, PageHero } from '@/shared/components'
import { Bell, ClipboardList, Heart, MapPin, LogOut, MailOpen, BellOff } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils/format'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function NotifikasiPage(): React.JSX.Element {
  const router = useRouter()
  const supabase = createBrowserClient()
  const { user, clearAuth, isAuthenticated, isLoading: authLoading } = useAuthStore()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/akun/notifikasi')
    }
  }, [isAuthenticated, authLoading, router])

  const { data: notifications, isLoading: notificationsLoading } = useUserNotifications(
    user?.id || ''
  )
  const markReadMutation = useMarkNotificationRead(user?.id || '')
  const markAllReadMutation = useMarkAllNotificationsRead(user?.id || '')

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (isRead) return
    try {
      await markReadMutation.mutateAsync(id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Gagal menandai notifikasi terbaca')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
      toast.success('Semua notifikasi ditandai telah dibaca')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Gagal memproses permintaan')
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      clearAuth()
      toast.success('Berhasil keluar')
      router.push('/')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Gagal keluar dari akun')
    }
  }

  if (authLoading || !isAuthenticated) {
    return <AuthLoading message="Memuat halaman..." />
  }

  const notificationList = notifications?.data || []
  const hasUnread = notificationList.some((n) => !n.is_read)

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Profil Pengguna"
        title="Notifikasi"
        subtitle="Lihat pembaruan pesanan, promo, dan informasi akun Anda."
      />
      <PageContainer size="lg" className="py-10 page-content">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Navigation Menu */}
          <div className="space-y-2 md:col-span-1">
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

            <div className="flex items-center space-x-3 px-4 py-3 bg-brand-black border border-brand-black border-l-4 border-l-brand-gold text-white font-heading font-semibold tracking-wide uppercase rounded-none text-xs">
              <Bell size={14} className="text-brand-gold-light" />
              <span>Notifikasi Saya</span>
            </div>

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
          </div>

          {/* Notifications Content */}
          <div className="md:col-span-2 border border-neutral-200 p-6 sm:p-8 rounded-none bg-white card-hover-lift gold-border-hover relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-neutral-100">
              <h2 className="text-lg font-serif tracking-tight text-neutral-900 flex items-center">
                <Bell size={18} className="mr-2" /> Pemberitahuan Anda
              </h2>
              {hasUnread && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  className="inline-flex items-center text-xs text-neutral-600 hover:text-neutral-950 hover:underline font-semibold"
                >
                  <MailOpen size={13} className="mr-1.5" /> Tandai Semua Dibaca
                </button>
              )}
            </div>

            {notificationsLoading ? (
              <div className="space-y-4">
                <div className="h-16 bg-neutral-50 animate-pulse border border-neutral-100" />
                <div className="h-16 bg-neutral-50 animate-pulse border border-neutral-100" />
                <div className="h-16 bg-neutral-50 animate-pulse border border-neutral-100" />
              </div>
            ) : notificationList && notificationList.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {notificationList.map((n, idx) => (
                  <motion.div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id, n.is_read)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    whileHover={{ scale: 1.01, transition: { duration: 0.1 } }}
                    className={`p-4 border text-xs font-sans transition relative cursor-pointer ${
                      n.is_read
                        ? 'border-neutral-100 bg-neutral-50/20 hover:bg-neutral-50/50 text-neutral-500'
                        : 'border-brand-gold bg-brand-gold-muted/10 hover:border-brand-gold-light text-neutral-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-400">
                        {n.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    <p className="font-bold text-neutral-950 text-sm mb-1">{n.title}</p>
                    <p className="leading-relaxed text-xs">{n.message}</p>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-brand-gold animate-pulse" />
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-neutral-200">
                <BellOff size={28} className="mx-auto text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-500 font-medium">
                  Belum ada pemberitahuan baru.
                </p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
