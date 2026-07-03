import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";
import { AdminLogService } from "@/features/core/application/adminLog.service";

export async function insertAdminActivityLog(supabase: SupabaseClient<Database>, action: string, resourceType: string, resourceId?: string | null, details?: string | null, adminId?: string) {
    return new AdminLogService(supabase).insertAdminActivityLog(action, resourceType, resourceId, details, adminId);
}
