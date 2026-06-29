import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { BannerService } from "@/modules/banner/application/banner.service";
import * as types from "@/modules/banner/domain/banner.types";

export type { Banner } from "@/modules/banner/domain/banner.types";

export async function getActiveBanners(supabase: SupabaseClient<Database>) {
    return new BannerService(supabase).getActiveBanners();
}

export async function adminGetBanners(supabase: SupabaseClient<Database>) {
    return new BannerService(supabase).adminGetBanners();
}

export async function adminCreateBanner(supabase: SupabaseClient<Database>, bannerData: {
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
    return new BannerService(supabase).adminCreateBanner(bannerData);
}

export async function adminUpdateBanner(supabase: SupabaseClient<Database>, bannerId: string, bannerData: {
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
    return new BannerService(supabase).adminUpdateBanner(bannerId, bannerData);
}

export async function adminDeleteBanner(supabase: SupabaseClient<Database>, bannerId: string) {
    return new BannerService(supabase).adminDeleteBanner(bannerId);
}
