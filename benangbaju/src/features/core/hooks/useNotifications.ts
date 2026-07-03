import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/features/core/services/notifications'

import { ApiListResponse } from '@/lib/api-response'

export function useUserNotifications(
  userId: string
): import('@tanstack/react-query').UseQueryResult<
  ApiListResponse<import('@/features/core/services/notifications').UserNotification>,
  Error
> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient, supabase])

  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getUserNotifications(supabase, userId),
    enabled: !!userId,
  })
}

export function useMarkNotificationRead(
  userId: string
): UseMutationResult<Awaited<ReturnType<typeof markNotificationRead>>, Error, string, unknown> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await markNotificationRead(supabase, notificationId, userId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menandai notifikasi terbaca')
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
  })
}

export function useMarkAllNotificationsRead(
  userId: string
): UseMutationResult<Awaited<ReturnType<typeof markAllNotificationsRead>>, Error, void, unknown> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: async () => {
      const res = await markAllNotificationsRead(supabase, userId)
      if (!res.success)
        throw new Error(res.error?.message || 'Gagal menandai semua notifikasi telah dibaca')
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
  })
}
