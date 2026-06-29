import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AdminCustomerService } from "@/modules/adminCustomer/application/adminCustomer.service";
import * as types from "@/modules/adminCustomer/domain/adminCustomer.types";

export type { CustomerProfile } from "@/modules/adminCustomer/domain/adminCustomer.types";

export async function adminGetCustomers(supabase: SupabaseClient<Database>) {
    return new AdminCustomerService(supabase).adminGetCustomers();
}

export async function adminToggleCustomerStatus(supabase: SupabaseClient<Database>, customerId: string, isActive: boolean) {
    return new AdminCustomerService(supabase).adminToggleCustomerStatus(customerId, isActive);
}
