import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/collection.repository";
import { AdminCollectionItem, Collection } from "../domain/collection.types";

export class CollectionService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async getActiveCollections(page = 1, limit = 20) {
        return repo.getActiveCollections(this.supabase, page, limit);
    }

    async getCollectionBySlug(slug: string) {
        return repo.getCollectionBySlug(this.supabase, slug);
    }

    async adminGetCollections(page = 1, limit = 20) {
        return repo.adminGetCollections(this.supabase, page, limit);
    }

    async adminCreateCollection(collectionData: {
            name: string
            slug: string
            description: string | null
            image_url: string | null
            sort_order: number
            is_active: boolean
            starts_at: string | null
            ends_at: string | null
          }, productIds: string[]) {
        return repo.adminCreateCollection(this.supabase, collectionData, productIds);
    }

    async adminUpdateCollection(collectionId: string, collectionData: {
            name: string
            slug: string
            description: string | null
            image_url: string | null
            sort_order: number
            is_active: boolean
            starts_at: string | null
            ends_at: string | null
          }, productIds: string[]) {
        return repo.adminUpdateCollection(this.supabase, collectionId, collectionData, productIds);
    }

    async adminDeleteCollection(collectionId: string) {
        return repo.adminDeleteCollection(this.supabase, collectionId);
    }
}
