import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from './adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface FlashSaleItemDetail {
  id: string
  flash_sale_id: string
  variant_id: string
  original_price: number
  sale_price: number
  discount_percent: number
  quota: number
  sold_count: number
  product_variants: {
    id: string
    sku: string
    name: string
    price: number
    stock: number
    products: {
      id: string
      name: string
      slug: string
      product_images: {
        url: string
        alt_text: string | null
        is_primary: boolean
      }[]
    }
  }
}

export interface FlashSaleDetail {
  id: string
  name: string
  description: string | null
  banner_url: string | null
  starts_at: string
  ends_at: string
  is_active: boolean
  flash_sale_items: FlashSaleItemDetail[]
}

export async function getActiveFlashSale(
  supabase: SupabaseClient<Database>
): Promise<FlashSaleDetail | null> {
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
    return null
  }

  if (!data) return null

  const rawItems = data.flash_sale_items
  const itemsList = Array.isArray(rawItems) ? rawItems : []

  const flash_sale_items: FlashSaleItemDetail[] = []

  for (const item of itemsList) {
    if (!item) continue
    const pv = item.product_variants
    if (!pv) continue
    const prod = pv.products
    if (!prod) continue

    const rawImages = prod.product_images
    const imagesList = Array.isArray(rawImages) ? rawImages : []
    const product_images = imagesList.map(img => ({
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
      discount_percent: item.discount_percent,
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

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    banner_url: data.banner_url,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    is_active: data.is_active,
    flash_sale_items,
  }
}

export interface AdminFlashSaleListItem {
  id: string
  name: string
  description: string | null
  banner_url: string | null
  starts_at: string
  ends_at: string
  is_active: boolean
  flash_sale_items: Array<{
    id: string
    variant_id: string
    original_price: number
    sale_price: number
    quota: number
    sold_count: number
    product_variants: {
      name: string
      products: {
        name: string
      } | null
    } | null
  }>
}

export async function adminGetFlashSales(
  supabase: SupabaseClient<Database>
): Promise<AdminFlashSaleListItem[]> {
  const { data, error } = await supabase
    .from('flash_sales')
    .select(`
      id, name, description, banner_url, starts_at, ends_at, is_active,
      flash_sale_items (
        id, variant_id, original_price, sale_price, quota, sold_count,
        product_variants (
          name,
          products (name)
        )
      )
    `)
    .order('starts_at', { ascending: false })

  if (error) {
    safeLogError('Error fetching admin flash sales:', error)
    throw error
  }

  if (!data) return []

  return data.map(sale => {
    const rawItems = sale.flash_sale_items
    const itemsList = Array.isArray(rawItems) ? rawItems : []
    const flash_sale_items = itemsList.map(item => {
      const pv = item.product_variants
      const prod = pv?.products
      return {
        id: item.id,
        variant_id: item.variant_id,
        original_price: item.original_price,
        sale_price: item.sale_price,
        quota: item.quota,
        sold_count: item.sold_count,
        product_variants: pv ? {
          name: pv.name,
          products: prod ? { name: prod.name } : null
        } : null
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
}

export async function adminCreateFlashSale(
  supabase: SupabaseClient<Database>,
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
) : Promise<{ id: string; }> {
  const { data: sale, error: saleErr } = await supabase
    .from('flash_sales')
    .insert(saleData)
    .select('id')
    .single()

  if (saleErr) throw saleErr
  const flashSaleId = sale.id

  if (items && items.length > 0) {
    const itemsData = items.map(item => {
      return {
        flash_sale_id: flashSaleId,
        variant_id: item.variant_id,
        original_price: item.original_price,
        sale_price: item.sale_price,
        quota: item.quota
      }
    })

    const { error: itemsErr } = await supabase
      .from('flash_sale_items')
      .insert(itemsData)

    if (itemsErr) throw itemsErr
  }

  await insertAdminActivityLog(supabase, 'create', 'flash_sale', flashSaleId, `Created flash sale ${saleData.name}`)

  return { id: flashSaleId }
}

export async function adminUpdateFlashSale(
  supabase: SupabaseClient<Database>,
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
) : Promise<{ id: string; }> {
  const { error: saleErr } = await supabase
    .from('flash_sales')
    .update(saleData)
    .eq('id', saleId)

  if (saleErr) throw saleErr

  // Fetch current items to preserve sold_count and determine deletions
  const { data: existingItems, error: fetchErr } = await supabase
    .from('flash_sale_items')
    .select('variant_id, sold_count')
    .eq('flash_sale_id', saleId)

  if (fetchErr) throw fetchErr

  const existingMap = new Map<string, number>()
  existingItems?.forEach(item => existingMap.set(item.variant_id, item.sold_count || 0))

  // Determine items to delete (those that are not in the new items list)
  const newVariantIds = new Set(items.map(item => item.variant_id))
  const itemsToDelete = (existingItems || [])
    .filter(item => !newVariantIds.has(item.variant_id))
    .map(item => item.variant_id)

  if (itemsToDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('flash_sale_items')
      .delete()
      .eq('flash_sale_id', saleId)
      .in('variant_id', itemsToDelete)

    if (delErr) throw delErr
  }

  // Upsert items (preserving sold_count, omitting discount_percent since it is generated)
  if (items && items.length > 0) {
    const itemsData = items.map(item => {
      const soldCount = existingMap.get(item.variant_id) || 0
      return {
        flash_sale_id: saleId,
        variant_id: item.variant_id,
        original_price: item.original_price,
        sale_price: item.sale_price,
        quota: item.quota,
        sold_count: soldCount
      }
    })

    const { error: itemsErr } = await supabase
      .from('flash_sale_items')
      .upsert(itemsData, { onConflict: 'flash_sale_id,variant_id' })

    if (itemsErr) throw itemsErr
  }

  await insertAdminActivityLog(supabase, 'update', 'flash_sale', saleId, `Updated flash sale ${saleData.name}`)

  return { id: saleId }
}

export async function adminDeleteFlashSale(
  supabase: SupabaseClient<Database>,
  saleId: string
) : Promise<{ success: boolean; }> {
  const { error } = await supabase
    .from('flash_sales')
    .delete()
    .eq('id', saleId)

  if (error) throw error
  
  await insertAdminActivityLog(supabase, 'delete', 'flash_sale', saleId, `Deleted flash sale ${saleId}`)
  
  return { success: true }
}
