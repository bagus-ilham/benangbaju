import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { createAdminClient } from '@/lib/supabase/admin'
import { CustomerProfile, CustomerDetail } from './types'

import { ApiListResponse, ApiResponse, paginated, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

export class AdminCustomerRepository {
  async adminGetCustomers(page = 1, limit = 20): Promise<ApiListResponse<CustomerProfile>> {
    const supabase = createAdminClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, count, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at', {
        count: 'exact',
      })
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching admin customers:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat daftar pelanggan')
    }

    const profiles = (data || []).map((row) => ({
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

    return paginated(profiles, count || 0, page, limit)
  }

  async adminToggleCustomerStatus(
    customerId: string,
    isActive: boolean
  ): Promise<ApiResponse<null>> {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', customerId)
      .neq('role', 'admin') // Security guard: only toggle non-admin role profiles

    if (error) {
      safeLogError('Error toggling customer status:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengubah status pelanggan.', {
        detail: [error.message],
      })
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'customer',
      customerId,
      `Toggled customer ${customerId} status to ${isActive}`
    )

    return ok(null)
  }

  async adminGetCustomerDetail(customerId: string): Promise<ApiResponse<CustomerDetail>> {
    const supabase = createAdminClient()
    const [profileRes, addressesRes, wishlistRes, cartRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at')
        .eq('id', customerId)
        .single(),
      supabase.from('user_addresses').select('*').eq('user_id', customerId),
      supabase
        .from('wishlist_items')
        .select(
          `
          id,
          products (
            id,
            name,
            product_variants ( price ),
            product_images ( url )
          )
        `
        )
        .eq('user_id', customerId),
      supabase
        .from('carts')
        .select(
          `
          id,
          cart_items(
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
          )
        `
        )
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const profile = profileRes.data
    if (profileRes.error || !profile) {
      safeLogError('Error fetching admin customer profile:', profileRes.error)
      return fail(ApiErrorCode.NOT_FOUND, 'Pelanggan tidak ditemukan', {
        detail: [profileRes.error?.message || ''],
      })
    }

    const addresses = addressesRes.data
    const wishlist = wishlistRes.data
    const cart = cartRes.data
    const cartItems = cart?.cart_items && Array.isArray(cart.cart_items) ? cart.cart_items : []

    // Format data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedWishlist = (wishlist || []).map((w: any) => {
      const p = w.products
      const pImages = p?.product_images || []
      const pImage = Array.isArray(pImages) && pImages.length > 0 ? pImages[0]?.url : null
      const pVariants = p?.product_variants || []
      const pPrice = Array.isArray(pVariants) && pVariants.length > 0 ? pVariants[0]?.price : 0
      return {
        id: w.id,
        product: p
          ? {
              id: p.id,
              name: p.name,
              price: pPrice,
              image_url: pImage,
            }
          : null,
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedCart = cartItems.map((c: any) => {
      const v = c.product_variants
      const p = v?.products
      const pImages = p?.product_images || []
      const pImage = Array.isArray(pImages) && pImages.length > 0 ? pImages[0]?.url : null
      return {
        id: c.id,
        quantity: c.quantity,
        variant: v
          ? {
              id: v.id,
              name: v.name,
              price: v.price,
              sku: v.sku,
              product: p
                ? {
                    id: p.id,
                    name: p.name,
                    image_url: pImage,
                  }
                : null,
            }
          : null,
      }
    })

    return ok({
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
    })
  }
}

export const adminCustomerRepository = new AdminCustomerRepository()
