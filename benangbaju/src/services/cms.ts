import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CmsService } from "@/modules/cms/application/cms.service";
import * as types from "@/modules/cms/domain/cms.types";

export type { RedirectRule, LandingPage } from "@/modules/cms/domain/cms.types";

export async function adminGetRedirects(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
    return new CmsService(supabase).adminGetRedirects(page, limit);
}

export async function adminCreateRedirect(supabase: SupabaseClient<Database>, redirect: Omit<types.RedirectRule, 'id' | 'created_at'>) {
    return new CmsService(supabase).adminCreateRedirect(redirect);
}

export async function adminUpdateRedirect(supabase: SupabaseClient<Database>, redirectId: string, redirect: Partial<Omit<types.RedirectRule, 'id' | 'created_at'>>) {
    return new CmsService(supabase).adminUpdateRedirect(redirectId, redirect);
}

export async function adminDeleteRedirect(supabase: SupabaseClient<Database>, redirectId: string) {
    return new CmsService(supabase).adminDeleteRedirect(redirectId);
}

export async function adminGetLandingPages(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
    return new CmsService(supabase).adminGetLandingPages(page, limit);
}

export async function adminCreateLandingPage(supabase: SupabaseClient<Database>, landingPage: Omit<types.LandingPage, 'id' | 'created_at' | 'updated_at'>) {
    return new CmsService(supabase).adminCreateLandingPage(landingPage);
}

export async function adminUpdateLandingPage(supabase: SupabaseClient<Database>, landingPageId: string, landingPage: Partial<Omit<types.LandingPage, 'id' | 'created_at' | 'updated_at'>>) {
    return new CmsService(supabase).adminUpdateLandingPage(landingPageId, landingPage);
}

export async function adminDeleteLandingPage(supabase: SupabaseClient<Database>, landingPageId: string) {
    return new CmsService(supabase).adminDeleteLandingPage(landingPageId);
}
