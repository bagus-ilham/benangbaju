import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/notificationTemplate.repository";
import { NotificationTemplate } from "../domain/notificationTemplate.types";

export class NotificationTemplateService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async adminGetNotificationTemplates() {
        return repo.adminGetNotificationTemplates(this.supabase);
    }

    async adminCreateNotificationTemplate(templateData: {
            name: string
            subject: string
            html_body: string
            is_active: boolean
          }) {
        return repo.adminCreateNotificationTemplate(this.supabase, templateData);
    }

    async adminUpdateNotificationTemplate(templateId: string, templateData: Partial<{
            name: string
            subject: string
            html_body: string
            is_active: boolean
          }>) {
        return repo.adminUpdateNotificationTemplate(this.supabase, templateId, templateData);
    }

    async adminDeleteNotificationTemplate(templateId: string) {
        return repo.adminDeleteNotificationTemplate(this.supabase, templateId);
    }
}
