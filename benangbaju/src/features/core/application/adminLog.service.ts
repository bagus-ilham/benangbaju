import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";
import * as repo from "@/entities/adminLog/api/adminLog.repository";

export class AdminLogService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async insertAdminActivityLog(action: string, resourceType: string, resourceId?: string | null, details?: string | null, adminId?: string) {
        return repo.insertAdminActivityLog(this.supabase, action, resourceType, resourceId, details, adminId);
    }
}
