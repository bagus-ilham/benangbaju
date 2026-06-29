import type { Database, Json } from '@/types/database';
export interface UserNotification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    data: Json | null;
    created_at: string;
}
