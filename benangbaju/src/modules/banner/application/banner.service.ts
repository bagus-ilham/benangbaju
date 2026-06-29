import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/banner.repository";
import { Banner } from "../domain/banner.types";

export class BannerService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async getActiveBanners() {
        return repo.getActiveBanners(this.supabase);
    }

    async adminGetBanners() {
        return repo.adminGetBanners(this.supabase);
    }

    async adminCreateBanner(bannerData: {
            title: string | null
            subtitle: string | null
            image_url: string
            image_mobile_url: string | null
            link_url: string | null
            position: string
            sort_order: number
            is_active: boolean
            starts_at: string | null
            ends_at: string | null
          }) {
        return repo.adminCreateBanner(this.supabase, bannerData);
    }

    async adminUpdateBanner(bannerId: string, bannerData: {
            title: string | null
            subtitle: string | null
            image_url: string
            image_mobile_url: string | null
            link_url: string | null
            position: string
            sort_order: number
            is_active: boolean
            starts_at: string | null
            ends_at: string | null
          }) {
        return repo.adminUpdateBanner(this.supabase, bannerId, bannerData);
    }

    async adminDeleteBanner(bannerId: string) {
        return repo.adminDeleteBanner(this.supabase, bannerId);
    }
}
