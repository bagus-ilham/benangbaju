import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";
import { ShippingService } from "@/features/core/application/shipping.service";
import * as types from "@/features/core/domain/shipping.types";

export type { UserAddress, District, ShippingOption, ShippingCalculationResult, ShippingZone, ShippingRate } from "@/features/core/domain/shipping.types";

export async function getUserAddresses(supabase: SupabaseClient<Database>, userId: string) {
    return new ShippingService(supabase).getUserAddresses(userId);
}

export async function addUserAddress(supabase: SupabaseClient<Database>, address: Omit<types.UserAddress, 'id' | 'created_at'>) {
    return new ShippingService(supabase).addUserAddress(address);
}

export async function updateUserAddress(supabase: SupabaseClient<Database>, addressId: string, userId: string, address: Partial<Omit<types.UserAddress, 'id' | 'user_id' | 'created_at'>>) {
    return new ShippingService(supabase).updateUserAddress(addressId, userId, address);
}

export async function deleteUserAddress(supabase: SupabaseClient<Database>, addressId: string, userId: string) {
    return new ShippingService(supabase).deleteUserAddress(addressId, userId);
}

export async function setDefaultAddress(supabase: SupabaseClient<Database>, addressId: string, userId: string) {
    return new ShippingService(supabase).setDefaultAddress(addressId, userId);
}

export async function searchDistricts(supabase: SupabaseClient<Database>, searchQuery: string) {
    return new ShippingService(supabase).searchDistricts(searchQuery);
}

export async function calculateShippingRates(supabase: SupabaseClient<Database>, zoneId: string, weightGram: number) {
    return new ShippingService(supabase).calculateShippingRates(zoneId, weightGram);
}

export async function adminGetShippingZones(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
    return new ShippingService(supabase).adminGetShippingZones(page, limit);
}

export async function adminCreateShippingZone(supabase: SupabaseClient<Database>, zone: Omit<types.ShippingZone, 'id' | 'shipping_zone_coverage'>, provinces: string[]) {
    return new ShippingService(supabase).adminCreateShippingZone(zone, provinces);
}

export async function adminUpdateShippingZone(supabase: SupabaseClient<Database>, zoneId: string, zone: Partial<Omit<types.ShippingZone, 'id' | 'shipping_zone_coverage'>>, provinces?: string[]) {
    return new ShippingService(supabase).adminUpdateShippingZone(zoneId, zone, provinces);
}

export async function adminDeleteShippingZone(supabase: SupabaseClient<Database>, zoneId: string) {
    return new ShippingService(supabase).adminDeleteShippingZone(zoneId);
}

export async function adminGetShippingRates(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
    return new ShippingService(supabase).adminGetShippingRates(page, limit);
}

export async function adminCreateShippingRate(supabase: SupabaseClient<Database>, rate: Omit<types.ShippingRate, 'id' | 'shipping_zones'>) {
    return new ShippingService(supabase).adminCreateShippingRate(rate);
}

export async function adminUpdateShippingRate(supabase: SupabaseClient<Database>, rateId: string, rate: Partial<Omit<types.ShippingRate, 'id' | 'shipping_zones'>>) {
    return new ShippingService(supabase).adminUpdateShippingRate(rateId, rate);
}

export async function adminDeleteShippingRate(supabase: SupabaseClient<Database>, rateId: string) {
    return new ShippingService(supabase).adminDeleteShippingRate(rateId);
}
