import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/adminCustomer.repository";
import { CustomerProfile } from "../domain/adminCustomer.types";

export class AdminCustomerService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async adminGetCustomers() {
        return repo.adminGetCustomers(this.supabase);
    }

    async adminToggleCustomerStatus(customerId: string, isActive: boolean) {
        return repo.adminToggleCustomerStatus(this.supabase, customerId, isActive);
    }

    async adminGetCustomerDetail(customerId: string) {
        return repo.adminGetCustomerDetail(this.supabase, customerId);
    }
}
