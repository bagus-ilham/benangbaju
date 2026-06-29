import type { Database, Json } from '@/types/database';
export interface SiteSetting {
    key: string;
    value: string;
    type: 'text' | 'json' | 'boolean' | 'image' | 'number';
    group: 'general' | 'seo' | 'payment' | 'social';
    label: string;
}

export interface ActivityLog {
    id: string;
    admin_id: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    old_data: Json | null;
    new_data: Json | null;
    ip_address: string | null;
    created_at: string;
    profiles?: {
        name: string
        email: string | null
        } | null;
}
