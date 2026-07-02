import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AdminCustomerService } from "@/modules/adminCustomer/application/adminCustomer.service";
import * as types from "@/modules/adminCustomer/domain/adminCustomer.types";

export type { CustomerProfile, CustomerDetail } from "@/modules/adminCustomer/domain/adminCustomer.types";

export async function adminGetCustomers(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
    return new AdminCustomerService(supabase).adminGetCustomers(page, limit);
}

export async function adminToggleCustomerStatus(supabase: SupabaseClient<Database>, customerId: string, isActive: boolean) {
    return new AdminCustomerService(supabase).adminToggleCustomerStatus(customerId, isActive);
}

export async function adminGetCustomerDetail(supabase: SupabaseClient<Database>, customerId: string) {
    return new AdminCustomerService(supabase).adminGetCustomerDetail(customerId);
}
