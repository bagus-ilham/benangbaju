import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/category.repository";
import { Category } from "../domain/category.types";

export class CategoryService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async getActiveCategories() {
        return repo.getActiveCategories(this.supabase);
    }

    async getCategoryBySlug(slug: string) {
        return repo.getCategoryBySlug(this.supabase, slug);
    }

    async adminGetCategories() {
        return repo.adminGetCategories(this.supabase);
    }

    async adminCreateCategory(categoryData: {
            parent_id: string | null
            name: string
            slug: string
            description: string | null
            image_url: string | null
            sort_order: number
            is_active: boolean
          }) {
        return repo.adminCreateCategory(this.supabase, categoryData);
    }

    async adminUpdateCategory(categoryId: string, categoryData: {
            parent_id: string | null
            name: string
            slug: string
            description: string | null
            image_url: string | null
            sort_order: number
            is_active: boolean
          }) {
        return repo.adminUpdateCategory(this.supabase, categoryId, categoryData);
    }

    async adminDeleteCategory(categoryId: string) {
        return repo.adminDeleteCategory(this.supabase, categoryId);
    }
}
