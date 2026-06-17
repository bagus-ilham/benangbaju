import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type Collection = Database['public']['Tables']['collections']['Row']

export async function getActiveCollections(supabase: SupabaseClient<Database>): Promise<Collection[]> {
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching collections:', error)
    return []
  }

  return data || []
}

export async function getCollectionBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error(`Error fetching collection for slug ${slug}:`, error)
    return null
  }

  return data
}

export async function adminGetCollections(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_products(product_id)')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error in adminGetCollections:', error)
    throw error
  }

  return (data || []).map((col: any) => ({
    ...col,
    product_ids: col.collection_products?.map((cp: any) => cp.product_id) || []
  }))
}

export async function adminCreateCollection(
  supabase: SupabaseClient<Database>,
  collectionData: {
    name: string
    slug: string
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  },
  productIds: string[]
) {
  const { data: col, error: colErr } = await supabase
    .from('collections')
    .insert(collectionData)
    .select('id')
    .single()

  if (colErr) throw colErr
  const collectionId = col.id

  if (productIds && productIds.length > 0) {
    const junctionData = productIds.map((pid, idx) => ({
      collection_id: collectionId,
      product_id: pid,
      sort_order: idx
    }))
    const { error: juncErr } = await supabase
      .from('collection_products')
      .insert(junctionData)

    if (juncErr) throw juncErr
  }

  return { id: collectionId }
}

export async function adminUpdateCollection(
  supabase: SupabaseClient<Database>,
  collectionId: string,
  collectionData: {
    name: string
    slug: string
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  },
  productIds: string[]
) {
  const { error: colErr } = await supabase
    .from('collections')
    .update(collectionData)
    .eq('id', collectionId)

  if (colErr) throw colErr

  // delete current links
  const { error: delErr } = await supabase
    .from('collection_products')
    .delete()
    .eq('collection_id', collectionId)

  if (delErr) throw delErr

  if (productIds && productIds.length > 0) {
    const junctionData = productIds.map((pid, idx) => ({
      collection_id: collectionId,
      product_id: pid,
      sort_order: idx
    }))
    const { error: juncErr } = await supabase
      .from('collection_products')
      .insert(junctionData)

    if (juncErr) throw juncErr
  }

  return { id: collectionId }
}

export async function adminDeleteCollection(
  supabase: SupabaseClient<Database>,
  collectionId: string
) {
  const { error } = await supabase
    .from('collections')
    .update({ is_active: false })
    .eq('id', collectionId)

  if (error) throw error
  return { success: true }
}
