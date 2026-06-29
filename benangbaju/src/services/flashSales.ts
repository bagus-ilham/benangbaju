import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { FlashSaleService } from "@/modules/flashSale/application/flashSale.service";
import * as types from "@/modules/flashSale/domain/flashSale.types";

export type { FlashSaleItemDetail, FlashSaleDetail, AdminFlashSaleListItem } from "@/modules/flashSale/domain/flashSale.types";

export async function getActiveFlashSale(supabase: SupabaseClient<Database>) {
    return new FlashSaleService(supabase).getActiveFlashSale();
}

export async function adminGetFlashSales(supabase: SupabaseClient<Database>) {
    return new FlashSaleService(supabase).adminGetFlashSales();
}

export async function adminCreateFlashSale(supabase: SupabaseClient<Database>, saleData: {
        name: string
        description: string | null
        banner_url: string | null
        starts_at: string
        ends_at: string
        is_active: boolean
      }, items: {
        variant_id: string
        original_price: number
        sale_price: number
        quota: number
      }[]) {
    return new FlashSaleService(supabase).adminCreateFlashSale(saleData, items);
}

export async function adminUpdateFlashSale(supabase: SupabaseClient<Database>, saleId: string, saleData: {
        name: string
        description: string | null
        banner_url: string | null
        starts_at: string
        ends_at: string
        is_active: boolean
      }, items: {
        variant_id: string
        original_price: number
        sale_price: number
        quota: number
      }[]) {
    return new FlashSaleService(supabase).adminUpdateFlashSale(saleId, saleData, items);
}

export async function adminDeleteFlashSale(supabase: SupabaseClient<Database>, saleId: string) {
    return new FlashSaleService(supabase).adminDeleteFlashSale(saleId);
}
