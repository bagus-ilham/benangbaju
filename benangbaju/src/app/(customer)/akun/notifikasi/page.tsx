'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import {
  useUserNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications'
import { Button } from '@/components/shared/Button'
import { Bell, Check, ClipboardList, Heart, MapPin, LogOut, MailOpen, User, BellOff } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils/format'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function NotifikasiPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const { user, profile, clearAuth, isAuthenticated, isLoading: authLoading } = useAuthStore()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/akun/notifikasi')
    }
  }, [isAuthenticated, authLoading, router])

  const { data: notifications, isLoading: notificationsLoading } = useUserNotifications(user?.id || '')
  const markReadMutation = useMarkNotificationRead(user?.id || '')
  const markAllReadMutation = useMarkAllNotificationsRead(user?.id || '')

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (isRead) return
    try {
      await markReadMutation.mutateAsync(id)
    } catch (err) {
      toast.error('Gagal menandai notifikasi terbaca')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
      toast.success('Semua notifikasi ditandai telah dibaca')
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
    } catch (err) {
      toast.error('Gagal keluar dari akun')
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
        <p className="text-neutral-400 text-sm tracking-widest uppercase animate-pulse">Memuat halaman...</p>
      </div>
    )
  }

  const hasUnread = notifications?.some((n) => !n.is_read)

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="border-b border-neutral-200 pb-5 mb-8">
          <h1 className="text-3xl font-serif tracking-tight text-neutral-900 mb-1">Akun Saya</h1>
          <p className="text-sm text-neutral-500">Kelola informasi pribadi Anda dan akses riwayat pesanan Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Navigation Menu */}
          <div className="space-y-2 md:col-span-1">
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-4">Navigasi Akun</h2>
            
            <Link
              href="/pesanan"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-neutral-50 border border-neutral-100 text-neutral-700 hover:text-neutral-950 font-medium transition duration-150 rounded-none text-sm"
            >
              <ClipboardList size={16} />
              <span>Pesanan Saya</span>
            </Link>

            <Link
              href="/akun/alamat"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-neutral-50 border border-neutral-100 text-neutral-700 hover:text-neutral-950 font-medium transition duration-150 rounded-none text-sm"
            >
              <MapPin size={16} />
              <span>Daftar Alamat</span>
            </Link>

            <Link
              href="/wishlist"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-neutral-50 border border-neutral-100 text-neutral-700 hover:text-neutral-950 font-medium transition duration-150 rounded-none text-sm"
            >
              <Heart size={16} />
              <span>Wishlist Saya</span>
            </Link>

            <Link
              href="/akun/notifikasi"
              className="flex items-center space-x-3 px-4 py-3 bg-neutral-900 border border-neutral-900 text-white font-semibold transition duration-150 rounded-none text-sm"
            >
              <Bell size={16} />
              <span>Notifikasi Saya</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50/50 border border-red-100 text-red-500 hover:text-red-700 font-medium transition duration-150 rounded-none text-sm text-left"
            >
              <LogOut size={16} />
              <span>Keluar dari Akun</span>
            </button>
          </div>

          {/* Notifications Content */}
          <div className="md:col-span-2 border border-neutral-200 p-6 sm:p-8 rounded-none bg-white">
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
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {notifications.map((n, idx) => (
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
                        : 'border-neutral-900 bg-neutral-50/80 hover:border-neutral-950 text-neutral-900 hover:shadow-xs'
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
                      <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-neutral-950 animate-pulse" />
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-neutral-200">
                <BellOff size={28} className="mx-auto text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-500 font-medium">Belum ada pemberitahuan baru.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
