import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CollectionService } from "@/modules/collection/application/collection.service";
import * as types from "@/modules/collection/domain/collection.types";

export type { AdminCollectionItem, Collection } from "@/modules/collection/domain/collection.types";

export async function getActiveCollections(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
    return new CollectionService(supabase).getActiveCollections(page, limit);
}

export async function getCollectionBySlug(supabase: SupabaseClient<Database>, slug: string) {
    return new CollectionService(supabase).getCollectionBySlug(slug);
}

export async function adminGetCollections(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
    return new CollectionService(supabase).adminGetCollections(page, limit);
}

export async function adminCreateCollection(supabase: SupabaseClient<Database>, collectionData: {
        name: string
        slug: string
        description: string | null
        image_url: string | null
        sort_order: number
        is_active: boolean
        starts_at: string | null
        ends_at: string | null
      }, productIds: string[]) {
    return new CollectionService(supabase).adminCreateCollection(collectionData, productIds);
}

export async function adminUpdateCollection(supabase: SupabaseClient<Database>, collectionId: string, collectionData: {
        name: string
        slug: string
        description: string | null
        image_url: string | null
        sort_order: number
        is_active: boolean
        starts_at: string | null
        ends_at: string | null
      }, productIds: string[]) {
    return new CollectionService(supabase).adminUpdateCollection(collectionId, collectionData, productIds);
}

export async function adminDeleteCollection(supabase: SupabaseClient<Database>, collectionId: string) {
    return new CollectionService(supabase).adminDeleteCollection(collectionId);
}
