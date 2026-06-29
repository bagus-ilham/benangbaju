export interface CustomerProfile {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
