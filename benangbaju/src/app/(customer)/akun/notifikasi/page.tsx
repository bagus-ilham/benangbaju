'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/modules/users/stores/authStore'
import {
  useUserNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/modules/notifications/hooks/useNotifications'
import { AuthLoading, PageContainer, PageHero, HandDrawnIcon } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils/format'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { AccountNavMenu } from '../components'

export default function NotifikasiPage(): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'
  const router = useRouter()
  const supabase = createBrowserClient()
  const { user, profile, clearAuth, isAuthenticated, isLoading: authLoading } = useAuthStore()

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
    } catch {
      toast.error(isMY ? 'Failed to mark notification as read' : 'Gagal menandai notifikasi terbaca')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
      toast.success(
        isMY ? 'All notifications marked as read' : 'Semua notifikasi ditandai telah dibaca'
      )
    } catch {
      toast.error(isMY ? 'Failed to process request' : 'Gagal memproses permintaan')
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      clearAuth()
      toast.success(isMY ? 'Signed out successfully' : 'Berhasil keluar')
      router.push('/')
    } catch {
      toast.error(isMY ? 'Failed to sign out' : 'Gagal keluar dari akun')
    }
  }

  if (authLoading || !isAuthenticated) {
    return <AuthLoading message={isMY ? 'Loading page...' : 'Memuat halaman...'} />
  }

  const notificationList = notifications?.data || []
  const hasUnread = notificationList.some((n) => !n.is_read)

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow={isMY ? 'User Profile' : 'Profil Pengguna'}
        title={isMY ? 'Notifications' : 'Notifikasi'}
        subtitle={
          isMY
            ? 'Stay updated on your orders, promos, and account activity.'
            : 'Lihat pembaruan pesanan, promo, dan informasi akun Anda.'
        }
      />
      <PageContainer size="lg" className="pt-10 pb-20 md:pb-24 page-content">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Shared Boutique Account Sidebar */}
          <AccountNavMenu
            handleSignOut={handleSignOut}
            userName={profile?.name}
            userEmail={user?.email}
          />

          {/* Notifications Content */}
          <div className="md:col-span-2 border border-brand-plum/10 p-6 sm:p-8 rounded-3xl bg-brand-cream shadow-xs relative overflow-hidden">
            <div className="card-accent-bar" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-brand-plum/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/75 border border-brand-gold-stroke/50 flex items-center justify-center text-brand-plum shrink-0">
                  <HandDrawnIcon name="bell" className="h-4 w-4" />
                </div>
                <div>
                  <span className="inline-block text-sm font-accent font-bold text-brand-blue-text leading-none">
                    {isMY ? 'Inbox Updates' : 'Kotak Masuk'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-serif font-medium tracking-tight text-brand-plum">
                    {isMY ? 'Your Notifications' : 'Pemberitahuan Anda'}
                  </h2>
                </div>
              </div>
              {hasUnread && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-brand-gold/70 hover:bg-brand-gold text-[11px] text-brand-plum font-semibold border border-brand-gold-stroke/45 transition-all duration-200 cursor-pointer"
                >
                  <HandDrawnIcon name="mail" className="h-3.5 w-3.5 mr-1.5" />
                  {isMY ? 'Mark All as Read' : 'Tandai Semua Dibaca'}
                </button>
              )}
            </div>

            {notificationsLoading ? (
              <div className="space-y-3">
                <div className="h-16 bg-brand-surface/50 animate-pulse border border-brand-plum/10 rounded-2xl" />
                <div className="h-16 bg-brand-surface/50 animate-pulse border border-brand-plum/10 rounded-2xl" />
                <div className="h-16 bg-brand-surface/50 animate-pulse border border-brand-plum/10 rounded-2xl" />
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
                    whileHover={{ scale: 1.005, transition: { duration: 0.1 } }}
                    className={`p-4 border rounded-2xl text-xs font-sans transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm relative cursor-pointer ${
                      n.is_read
                        ? 'border-brand-plum/10 bg-brand-cream/60 hover:bg-brand-gold/20 text-neutral-600'
                        : 'border-brand-blue-stroke bg-brand-blue-soft/45 hover:border-brand-blue text-brand-plum'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5 pr-4">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-brand-plum/60">
                        {n.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-brand-plum/55 font-normal">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    <p className="font-serif font-medium text-brand-plum text-[15px] mb-1">
                      {n.title}
                    </p>
                    <p className="leading-relaxed text-xs text-neutral-600">{n.message}</p>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-brand-blue ring-4 ring-brand-blue/20" />
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 border border-dashed border-brand-plum/15 bg-brand-gold/35 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-brand-blue-soft/60 border border-brand-blue-stroke/60 flex items-center justify-center mx-auto mb-3 text-brand-plum">
                  <HandDrawnIcon name="bell" className="h-5 w-5" />
                </div>
                <p className="text-base font-serif font-medium text-brand-plum mb-1">
                  {isMY ? 'All Caught Up' : 'Belum Ada Notifikasi'}
                </p>
                <p className="text-xs text-neutral-600 font-sans">
                  {isMY ? 'No notifications yet.' : 'Belum ada pemberitahuan baru saat ini.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
