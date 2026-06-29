import type { Database, Json } from '@/types/database';
export interface AdminCollectionItem {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    product_ids: string[];
}

export type Collection = Database['public']['Tables']['collections']['Row'];
