import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notifications'

export function useUserNotifications(userId: string) : import("@tanstack/react-query").UseQueryResult<import("@/services/notifications").UserNotification[], Error> {
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

export function useMarkNotificationRead(userId: string) : UseMutationResult<
  Awaited<ReturnType<typeof markNotificationRead>>,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(supabase, notificationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
  })
}

export function useMarkAllNotificationsRead(userId: string) : UseMutationResult<
  Awaited<ReturnType<typeof markAllNotificationsRead>>,
  Error,
  void,
  unknown
> {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(supabase, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
  })
}

