import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";
import { NotificationService } from "@/features/core/application/notification.service";
import * as types from "@/features/core/domain/notification.types";

export type { UserNotification } from "@/features/core/domain/notification.types";

export async function getUserNotifications(supabase: SupabaseClient<Database>, userId: string, page = 1, limit = 20) {
    return new NotificationService(supabase).getUserNotifications(userId, page, limit);
}

export async function markNotificationRead(supabase: SupabaseClient<Database>, notificationId: string, userId: string) {
    return new NotificationService(supabase).markNotificationRead(notificationId, userId);
}

export async function markAllNotificationsRead(supabase: SupabaseClient<Database>, userId: string) {
    return new NotificationService(supabase).markAllNotificationsRead(userId);
}
