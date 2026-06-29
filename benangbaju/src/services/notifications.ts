import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { NotificationService } from "@/modules/notification/application/notification.service";
import * as types from "@/modules/notification/domain/notification.types";

export type { UserNotification } from "@/modules/notification/domain/notification.types";

export async function getUserNotifications(supabase: SupabaseClient<Database>, userId: string) {
    return new NotificationService(supabase).getUserNotifications(userId);
}

export async function markNotificationRead(supabase: SupabaseClient<Database>, notificationId: string, userId: string) {
    return new NotificationService(supabase).markNotificationRead(notificationId, userId);
}

export async function markAllNotificationsRead(supabase: SupabaseClient<Database>, userId: string) {
    return new NotificationService(supabase).markAllNotificationsRead(userId);
}
