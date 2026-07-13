import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { FlashSaleItemDetail, FlashSaleDetail, AdminFlashSaleListItem } from './types'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import { createServerClient } from '@/lib/supabase/server'

export class FlashSaleRepository {
  async getActiveFlashSale(
    client?: SupabaseClient<Database>
  ): Promise<ApiResponse<FlashSaleDetail | null>> {
    const supabase = client || (await createServerClient())
    const now = new Date().toISOString()

    // Fetch active flash sale that is currently running
    const { data, error } = await supabase
      .from('flash_sales')
      .select(
        `
          id, name, description, banner_url, starts_at, ends_at, is_active,
          flash_sale_items (
            id, flash_sale_id, variant_id, original_price, sale_price, discount_percent, quota, sold_count,
            product_variants (
              id, sku, name, price, stock,
              products (
                id, name, slug,
                product_images (url, alt_text, is_primary)
              )
            )
          )
        `
      )
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .limit(1)
      .maybeSingle()

    if (error) {
      safeLogError('Error fetching active flash sale:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil flash sale aktif')
    }

    if (!data) return ok(null)

    const rawItems = data.flash_sale_items
    const itemsList = Array.isArray(rawItems) ? rawItems : []

    const flash_sale_items: FlashSaleItemDetail[] = []

    for (const item of itemsList) {
      if (!item) continue
      const pv = item.product_variants as any
      if (!pv) continue
      const prod = pv.products as any
      if (!prod) continue

      const rawImages = prod.product_images as any
      const imagesList = Array.isArray(rawImages) ? rawImages : []
      const product_images = imagesList.map((img) => ({
        url: img.url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
      }))

      flash_sale_items.push({
        id: item.id,
        flash_sale_id: item.flash_sale_id,
        variant_id: item.variant_id,
        original_price: item.original_price,
        sale_price: item.sale_price,
        discount_percent: item.discount_percent || 0,
        quota: item.quota,
        sold_count: item.sold_count,
        product_variants: {
          id: pv.id,
          sku: pv.sku,
          name: pv.name,
          price: pv.price,
          stock: pv.stock,
          products: {
            id: prod.id,
            name: prod.name,
            slug: prod.slug,
            product_images,
          },
        },
      })
    }

    return ok({
      id: data.id,
      name: data.name,
      description: data.description,
      banner_url: data.banner_url,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      is_active: data.is_active,
      flash_sale_items,
    })
  }

  async adminGetFlashSales(page = 1, limit = 20): Promise<ApiListResponse<AdminFlashSaleListItem>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('flash_sales')
      .select(
        `
        id, name, description, banner_url, starts_at, ends_at, is_active,
        flash_sale_items (
          id, variant_id, original_price, sale_price, quota, sold_count,
          product_variants (
            name,
            products (name)
          )
        )
      `,
        { count: 'exact' }
      )
      .order('starts_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching admin flash sales:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil data flash sale')
    }

    if (!data) return paginated([], page, limit, count || 0)

    const result = data.map((sale) => {
      const rawItems = sale.flash_sale_items
      const itemsList = Array.isArray(rawItems) ? rawItems : []
      const flash_sale_items = itemsList.map((item) => {
        const pv = item.product_variants as any
        const prod = pv?.products as any
        return {
          id: item.id,
          variant_id: item.variant_id,
          original_price: item.original_price,
          sale_price: item.sale_price,
          quota: item.quota,
          sold_count: item.sold_count,
          product_variants: pv
            ? {
                name: pv.name,
                products: prod ? { name: prod.name } : null,
              }
            : null,
        }
      })

      return {
        id: sale.id,
        name: sale.name,
        description: sale.description,
        banner_url: sale.banner_url,
        starts_at: sale.starts_at,
        ends_at: sale.ends_at,
        is_active: sale.is_active,
        flash_sale_items,
      }
    })

    return paginated(result, page, limit, count || 0)
  }

  async adminCreateFlashSale(
    saleData: {
      name: string
      description: string | null
      banner_url: string | null
      starts_at: string
      ends_at: string
      is_active: boolean
    },
    items: {
      variant_id: string
      original_price: number
      sale_price: number
      quota: number
    }[]
  ): Promise<ApiResponse<{ id: string }>> {
    const supabase = await createServerClient()
    const { data: result, error: rpcErr } = await supabase.rpc('admin_create_flash_sale', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_flash_sale: saleData as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_items: items as any,
    })

    if (rpcErr) {
      safeLogError('Error creating flash sale (RPC):', rpcErr)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat flash sale')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = result as any
    if (res && res.success === false) {
      safeLogError('Error creating flash sale (RPC transaction):', res.error)
      return fail(ApiErrorCode.INTERNAL_ERROR, res.error?.message || 'Transaction failed')
    }

    const flashSaleId = res?.data?.id

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'create',
      'flash_sale',
      flashSaleId,
      `Created flash sale ${saleData.name}`
    )

    return ok({ id: flashSaleId })
  }

  async adminUpdateFlashSale(
    saleId: string,
    saleData: {
      name: string
      description: string | null
      banner_url: string | null
      starts_at: string
      ends_at: string
      is_active: boolean
    },
    items: {
      variant_id: string
      original_price: number
      sale_price: number
      quota: number
    }[]
  ): Promise<ApiResponse<{ id: string }>> {
    const supabase = await createServerClient()
    // Fetch current items to determine deletions
    const { data: existingItems, error: fetchErr } = await supabase
      .from('flash_sale_items')
      .select('variant_id')
      .eq('flash_sale_id', saleId)

    if (fetchErr) {
      safeLogError('Error fetching existing flash sale items:', fetchErr)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil item flash sale saat ini')
    }

    // Determine items to delete (those that are not in the new items list)
    const newVariantIds = new Set(items.map((item) => item.variant_id))
    const itemsToDelete = (existingItems || [])
      .filter((item) => !newVariantIds.has(item.variant_id))
      .map((item) => item.variant_id)

    const { data: result, error: rpcErr } = await supabase.rpc('admin_update_flash_sale', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_flash_sale_id: saleId as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_flash_sale: saleData as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_items_to_upsert: items as any,
      p_variant_ids_to_delete: itemsToDelete,
    })

    if (rpcErr) {
      safeLogError('Error updating flash sale (RPC):', rpcErr)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui flash sale')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = result as any
    if (res && res.success === false) {
      safeLogError('Error updating flash sale (RPC transaction):', res.error)
      return fail(ApiErrorCode.INTERNAL_ERROR, res.error?.message || 'Transaction failed')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'flash_sale',
      saleId,
      `Updated flash sale ${saleData.name}`
    )

    return ok({ id: saleId })
  }

  async adminDeleteFlashSale(saleId: string): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    // 1. Fetch banner image associated with this flash sale to clean up storage
    const { data: sale } = await supabase
      .from('flash_sales')
      .select('banner_url')
      .eq('id', saleId)
      .single()

    // 2. Delete the physical image from Supabase Storage
    if (sale && sale.banner_url) {
      const { deleteImageByUrl } = await import('@/lib/supabase/storage')
      await deleteImageByUrl(supabase, sale.banner_url, 'flash-sales')
    }

    // 3. Delete flash sale record
    const { error } = await supabase.from('flash_sales').delete().eq('id', saleId)

    if (error) {
      safeLogError('Error deleting flash sale:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus flash sale')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'delete',
      'flash_sale',
      saleId,
      `Deleted flash sale ${saleId}`
    )

    return ok()
  }
}

export const flashSaleRepository = new FlashSaleRepository()
