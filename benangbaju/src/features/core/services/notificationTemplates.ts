import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";
import { NotificationTemplateService } from "@/features/core/application/notificationTemplate.service";
import * as types from "@/features/core/domain/notificationTemplate.types";

export type { NotificationTemplate } from "@/features/core/domain/notificationTemplate.types";

export async function adminGetNotificationTemplates(supabase: SupabaseClient<Database>) {
    return new NotificationTemplateService(supabase).adminGetNotificationTemplates();
}

export async function adminCreateNotificationTemplate(supabase: SupabaseClient<Database>, templateData: {
        name: string
        subject: string
        html_body: string
        is_active: boolean
      }) {
    return new NotificationTemplateService(supabase).adminCreateNotificationTemplate(templateData);
}

export async function adminUpdateNotificationTemplate(supabase: SupabaseClient<Database>, templateId: string, templateData: Partial<{
        name: string
        subject: string
        html_body: string
        is_active: boolean
      }>) {
    return new NotificationTemplateService(supabase).adminUpdateNotificationTemplate(templateId, templateData);
}

export async function adminDeleteNotificationTemplate(supabase: SupabaseClient<Database>, templateId: string) {
    return new NotificationTemplateService(supabase).adminDeleteNotificationTemplate(templateId);
}
