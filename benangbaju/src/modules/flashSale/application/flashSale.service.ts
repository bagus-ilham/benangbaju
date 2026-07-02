import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/flashSale.repository";
import { FlashSaleItemDetail, FlashSaleDetail, AdminFlashSaleListItem } from "../domain/flashSale.types";

export class FlashSaleService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async getActiveFlashSale() {
        return repo.getActiveFlashSale(this.supabase);
    }

    async adminGetFlashSales(page = 1, limit = 20) {
        return repo.adminGetFlashSales(this.supabase, page, limit);
    }

    async adminCreateFlashSale(saleData: {
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
        return repo.adminCreateFlashSale(this.supabase, saleData, items);
    }

    async adminUpdateFlashSale(saleId: string, saleData: {
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
        return repo.adminUpdateFlashSale(this.supabase, saleId, saleData, items);
    }

    async adminDeleteFlashSale(saleId: string) {
        return repo.adminDeleteFlashSale(this.supabase, saleId);
    }
}
