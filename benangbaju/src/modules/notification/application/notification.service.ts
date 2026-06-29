import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/notification.repository";
import { UserNotification } from "../domain/notification.types";

export class NotificationService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async getUserNotifications(userId: string) {
        return repo.getUserNotifications(this.supabase, userId);
    }

    async markNotificationRead(notificationId: string, userId: string) {
        return repo.markNotificationRead(this.supabase, notificationId, userId);
    }

    async markAllNotificationsRead(userId: string) {
        return repo.markAllNotificationsRead(this.supabase, userId);
    }
}
