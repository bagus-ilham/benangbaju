import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/services/adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { CustomerProfile, CustomerDetail } from "../domain/adminCustomer.types";

// 1. Get list of all customer profiles
export async function adminGetCustomers(
  supabase: SupabaseClient<Database>
): Promise<CustomerProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    safeLogError('Error fetching admin customers:', error)
    throw error
  }

  if (!data) return []

  return data.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar_url: row.avatar_url,
    role: row.role,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

// 2. Toggle customer activation status (Block / Unblock)
export async function adminToggleCustomerStatus(
  supabase: SupabaseClient<Database>,
  customerId: string,
  isActive: boolean
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', customerId)
    .neq('role', 'admin') // Security guard: only toggle non-admin role profiles

  if (error) {
    safeLogError('Error toggling customer status:', error)
    return { success: false, error: new Error('Gagal mengubah status pelanggan.') }
  }

  await insertAdminActivityLog(supabase, 'update', 'customer', customerId, `Toggled customer ${customerId} status to ${isActive}`)

  return { success: true, error: null }
}

export async function adminGetCustomerDetail(
  supabase: SupabaseClient<Database>,
  customerId: string
): Promise<CustomerDetail | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at')
    .eq('id', customerId)
    .single();

  if (profileError || !profile) {
    safeLogError('Error fetching admin customer profile:', profileError);
    return null;
  }

  const [
    { data: addresses },
    { data: wishlist },
    { data: cart }
  ] = await Promise.all([
    supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', customerId),
    supabase
      .from('wishlist_items')
      .select(`
        id,
        products (
          id,
          name,
          product_variants ( price ),
          product_images ( url )
        )
      `)
      .eq('user_id', customerId),
    supabase
      .from('carts')
      .select('id')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  let cartItems: any[] = [];
  if (cart?.id) {
    const { data: items } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_variants (
          id,
          name,
          price,
          sku,
          products (
            id,
            name,
            product_images ( url )
          )
        )
      `)
      .eq('cart_id', cart.id);
    cartItems = items || [];
  }

  // Format data
  const formattedWishlist = (wishlist || []).map((w: any) => {
    const p = w.products;
    const pImages = p?.product_images || [];
    const pImage = Array.isArray(pImages) && pImages.length > 0 ? pImages[0]?.url : null;
    const pVariants = p?.product_variants || [];
    const pPrice = Array.isArray(pVariants) && pVariants.length > 0 ? pVariants[0]?.price : 0;
    return {
      id: w.id,
      product: p ? {
        id: p.id,
        name: p.name,
        price: pPrice,
        image_url: pImage,
      } : null,
    };
  });

  const formattedCart = cartItems.map((c: any) => {
    const v = c.product_variants;
    const p = v?.products;
    const pImages = p?.product_images || [];
    const pImage = Array.isArray(pImages) && pImages.length > 0 ? pImages[0]?.url : null;
    return {
      id: c.id,
      quantity: c.quantity,
      variant: v ? {
        id: v.id,
        name: v.name,
        price: v.price,
        sku: v.sku,
        product: p ? {
          id: p.id,
          name: p.name,
          image_url: pImage,
        } : null,
      } : null,
    };
  });

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    avatar_url: profile.avatar_url,
    role: profile.role,
    is_active: profile.is_active,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    addresses: addresses || [],
    wishlist_items: formattedWishlist,
    cart_items: formattedCart,
  };
}
