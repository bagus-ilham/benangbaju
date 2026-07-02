import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/cms.repository";
import { RedirectRule, LandingPage } from "../domain/cms.types";

export class CmsService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async adminGetRedirects(page = 1, limit = 20) {
        return repo.adminGetRedirects(this.supabase, page, limit);
    }

    async adminCreateRedirect(redirect: Omit<RedirectRule, 'id' | 'created_at'>) {
        return repo.adminCreateRedirect(this.supabase, redirect);
    }

    async adminUpdateRedirect(redirectId: string, redirect: Partial<Omit<RedirectRule, 'id' | 'created_at'>>) {
        return repo.adminUpdateRedirect(this.supabase, redirectId, redirect);
    }

    async adminDeleteRedirect(redirectId: string) {
        return repo.adminDeleteRedirect(this.supabase, redirectId);
    }

    async adminGetLandingPages(page = 1, limit = 20) {
        return repo.adminGetLandingPages(this.supabase, page, limit);
    }

    async adminCreateLandingPage(landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>) {
        return repo.adminCreateLandingPage(this.supabase, landingPage);
    }

    async adminUpdateLandingPage(landingPageId: string, landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>>) {
        return repo.adminUpdateLandingPage(this.supabase, landingPageId, landingPage);
    }

    async adminDeleteLandingPage(landingPageId: string) {
        return repo.adminDeleteLandingPage(this.supabase, landingPageId);
    }
}
