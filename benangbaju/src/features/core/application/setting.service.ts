import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";
import * as repo from "../infrastructure/setting.repository";
import { SiteSetting } from "../domain/setting.types";

export class SettingService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async adminGetSettings() {
        return repo.adminGetSettings(this.supabase);
    }

    async adminUpdateSettings(settings: Record<string, string>) {
        return repo.adminUpdateSettings(this.supabase, settings);
    }

    async adminGetActivityLogs(page = 1, limit = 100) {
        return repo.adminGetActivityLogs(this.supabase, page, limit);
    }

    async adminUpsertSettings(settings: SiteSetting[]) {
        return repo.adminUpsertSettings(this.supabase, settings);
    }

    async getSiteSettings() {
        return repo.getSiteSettings(this.supabase);
    }
}
