import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";
import { CategoryService } from "@/features/marketing/application/category.service";
import * as types from "@/features/marketing/domain/category.types";

export type { Category } from "@/features/marketing/domain/category.types";

export async function getActiveCategories(supabase: SupabaseClient<Database>) {
    return new CategoryService(supabase).getActiveCategories();
}

export async function getCategoryBySlug(supabase: SupabaseClient<Database>, slug: string) {
    return new CategoryService(supabase).getCategoryBySlug(slug);
}

export async function adminGetCategories(supabase: SupabaseClient<Database>) {
    return new CategoryService(supabase).adminGetCategories();
}

export async function adminCreateCategory(supabase: SupabaseClient<Database>, categoryData: {
        parent_id: string | null
        name: string
        slug: string
        description: string | null
        image_url: string | null
        sort_order: number
        is_active: boolean
      }) {
    return new CategoryService(supabase).adminCreateCategory(categoryData);
}

export async function adminUpdateCategory(supabase: SupabaseClient<Database>, categoryId: string, categoryData: {
        parent_id: string | null
        name: string
        slug: string
        description: string | null
        image_url: string | null
        sort_order: number
        is_active: boolean
      }) {
    return new CategoryService(supabase).adminUpdateCategory(categoryId, categoryData);
}

export async function adminDeleteCategory(supabase: SupabaseClient<Database>, categoryId: string) {
    return new CategoryService(supabase).adminDeleteCategory(categoryId);
}
