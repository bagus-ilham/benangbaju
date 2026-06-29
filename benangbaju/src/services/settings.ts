import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SettingService } from "@/modules/setting/application/setting.service";
import * as types from "@/modules/setting/domain/setting.types";

export type { SiteSetting, ActivityLog } from "@/modules/setting/domain/setting.types";

export async function adminGetSettings(supabase: SupabaseClient<Database>) {
    return new SettingService(supabase).adminGetSettings();
}

export async function adminUpdateSettings(supabase: SupabaseClient<Database>, settings: Record<string, string>) {
    return new SettingService(supabase).adminUpdateSettings(settings);
}

export async function adminGetActivityLogs(supabase: SupabaseClient<Database>) {
    return new SettingService(supabase).adminGetActivityLogs();
}

export async function adminUpsertSettings(supabase: SupabaseClient<Database>, settings: types.SiteSetting[]) {
    return new SettingService(supabase).adminUpsertSettings(settings);
}

export async function getSiteSettings(supabase: SupabaseClient<Database>) {
    return new SettingService(supabase).getSiteSettings();
}
