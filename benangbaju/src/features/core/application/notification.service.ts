import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";
import * as repo from "../infrastructure/notification.repository";


export class NotificationService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async getUserNotifications(userId: string, page = 1, limit = 20) {
        return repo.getUserNotifications(this.supabase, userId, page, limit);
    }

    async markNotificationRead(notificationId: string, userId: string) {
        return repo.markNotificationRead(this.supabase, notificationId, userId);
    }

    async markAllNotificationsRead(userId: string) {
        return repo.markAllNotificationsRead(this.supabase, userId);
    }
}
