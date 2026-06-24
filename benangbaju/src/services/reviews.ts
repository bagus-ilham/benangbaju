import { safeLogError } from '@/lib/logger'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface ReviewDetail {
  id: string
  rating: number
  title: string | null
  body: string
  is_anonymous: boolean
  is_verified_purchase: boolean
  created_at: string
  helpful_count: number
  profiles: {
    name: string
    avatar_url: string | null
  } | null
  review_media: {
    id: string
    url: string
    type: string
  }[]
  review_replies: {
    id: string
    body: string
    created_at: string
    profiles: {
      name: string
    } | null
  }[]
}

export async function getApprovedReviews(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<ReviewDetail[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      id, rating, title, body, is_anonymous, is_verified_purchase, created_at, helpful_count,
      profiles (name, avatar_url),
      review_media (id, url, type),
      review_replies (id, body, created_at, profiles (name))
    `)
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    safeLogError('Error fetching reviews:', error)
    return []
  }

  if (!data) return []

  return data.map(item => {
    const rawProfile = item.profiles
    let profiles: { name: string; avatar_url: string | null } | null = null
    if (rawProfile && !Array.isArray(rawProfile)) {
      profiles = {
        name: rawProfile.name,
        avatar_url: rawProfile.avatar_url,
      }
    }

    const rawMedia = item.review_media
    const mediaList = Array.isArray(rawMedia) ? rawMedia : []
    const review_media = mediaList.map(m => ({
      id: m.id,
      url: m.url,
      type: m.type,
    }))

    const rawReplies = item.review_replies
    const repliesList = Array.isArray(rawReplies) ? rawReplies : []
    const review_replies = repliesList.map(r => {
      const rawRProfile = r.profiles
      let rProfiles: { name: string } | null = null
      if (rawRProfile && !Array.isArray(rawRProfile)) {
        rProfiles = { name: rawRProfile.name }
      }
      return {
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        profiles: rProfiles,
      }
    })

    return {
      id: item.id,
      rating: item.rating,
      title: item.title,
      body: item.body,
      is_anonymous: item.is_anonymous,
      is_verified_purchase: item.is_verified_purchase,
      created_at: item.created_at,
      helpful_count: item.helpful_count,
      profiles,
      review_media,
      review_replies,
    }
  })
}

export interface AdminReviewListItem {
  id: string
  order_item_id: string
  product_id: string
  variant_id: string | null
  user_id: string
  rating: number
  title: string | null
  body: string
  is_anonymous: boolean
  is_verified_purchase: boolean
  is_pinned: boolean
  status: string
  helpful_count: number
  created_at: string
  profiles: {
    name: string
    email: string | null
  } | null
  products: {
    name: string
  } | null
  review_media: {
    id: string
    url: string
    type: string
  }[]
  review_replies: {
    id: string
    body: string
    created_at: string
    profiles: {
      name: string
    } | null
  }[]
}

export async function adminGetReviews(
  supabase: SupabaseClient<Database>
): Promise<AdminReviewListItem[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      id, order_item_id, product_id, variant_id, user_id, rating, title, body,
      is_anonymous, is_verified_purchase, is_pinned, status, helpful_count, created_at,
      profiles (name, email),
      products (name),
      review_media (id, url, type),
      review_replies (id, body, created_at, profiles (name))
    `)
    .order('created_at', { ascending: false })

  if (error) {
    safeLogError('Error fetching admin reviews:', error)
    throw error
  }

  if (!data) return []

  return data.map(item => {
    const rawProfile = item.profiles
    let profiles: { name: string; email: string | null } | null = null
    if (rawProfile && !Array.isArray(rawProfile)) {
      profiles = {
        name: rawProfile.name,
        email: rawProfile.email,
      }
    }

    const rawProduct = item.products
    let products: { name: string } | null = null
    if (rawProduct && !Array.isArray(rawProduct)) {
      products = {
        name: rawProduct.name,
      }
    }

    const rawMedia = item.review_media
    const mediaList = Array.isArray(rawMedia) ? rawMedia : []
    const review_media = mediaList.map(m => ({
      id: m.id,
      url: m.url,
      type: m.type,
    }))

    const rawReplies = item.review_replies
    const repliesList = Array.isArray(rawReplies) ? rawReplies : []
    const review_replies = repliesList.map(r => {
      const rawRProfile = r.profiles
      let rProfiles: { name: string } | null = null
      if (rawRProfile && !Array.isArray(rawRProfile)) {
        rProfiles = { name: rawRProfile.name }
      }
      return {
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        profiles: rProfiles,
      }
    })

    return {
      id: item.id,
      order_item_id: item.order_item_id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      user_id: item.user_id,
      rating: item.rating,
      title: item.title,
      body: item.body,
      is_anonymous: item.is_anonymous,
      is_verified_purchase: item.is_verified_purchase,
      is_pinned: item.is_pinned,
      status: item.status,
      helpful_count: item.helpful_count,
      created_at: item.created_at,
      profiles,
      products,
      review_media,
      review_replies,
    }
  })
}

export async function adminUpdateReviewStatus(
  supabase: SupabaseClient<Database>,
  reviewId: string,
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
) : Promise<{ id: string; order_item_id: string; product_id: string; variant_id: string | null; user_id: string; rating: number; title: string | null; body: string; is_anonymous: boolean; is_verified_purchase: boolean; is_pinned: boolean; status: string; helpful_count: number; created_at: string; }> {
  const { data, error } = await supabase
    .from('product_reviews')
    .update({ status })
    .eq('id', reviewId)
    .select('id, order_item_id, product_id, variant_id, user_id, rating, title, body, is_anonymous, is_verified_purchase, is_pinned, status, helpful_count, created_at')
    .single()

  if (error) throw error
  return data
}

export async function adminReplyToReview(
  supabase: SupabaseClient<Database>,
  reviewId: string,
  body: string,
  adminId: string
) : Promise<{ id: string; review_id: string; admin_id: string; body: string; created_at: string; }> {
  const { data, error } = await supabase
    .from('review_replies')
    .upsert(
      {
        review_id: reviewId,
        admin_id: adminId,
        body,
        created_at: new Date().toISOString()
      },
      { onConflict: 'review_id' }
    )
    .select('id, review_id, admin_id, body, created_at')
    .single()

  if (error) throw error
  return data
}

export interface SubmitReviewParams {
  orderItemId: string
  productId: string
  variantId: string | null
  userId: string
  rating: number
  title?: string
  body: string
  isAnonymous?: boolean
  mediaUrls?: string[]
}

export async function customerSubmitReview(
  supabase: SupabaseClient<Database>,
  params: SubmitReviewParams
) : Promise<{ id: string; order_item_id: string; product_id: string; variant_id: string | null; user_id: string; rating: number; title: string | null; body: string; is_anonymous: boolean; is_verified_purchase: boolean; is_pinned: boolean; status: string; helpful_count: number; created_at: string; }> {
  // 1. Insert review into product_reviews
  const { data: review, error: reviewErr } = await supabase
    .from('product_reviews')
    .insert({
      order_item_id: params.orderItemId,
      product_id: params.productId,
      variant_id: params.variantId,
      user_id: params.userId,
      rating: params.rating,
      title: params.title || null,
      body: params.body,
      is_anonymous: params.isAnonymous || false,
      status: 'pending',
      is_verified_purchase: true,
    })
    .select('id, order_item_id, product_id, variant_id, user_id, rating, title, body, is_anonymous, is_verified_purchase, is_pinned, status, helpful_count, created_at')
    .single()

  if (reviewErr) throw reviewErr

  // 2. Insert media if present
  if (params.mediaUrls && params.mediaUrls.length > 0) {
    const mediaData = params.mediaUrls.map((url, index) => ({
      review_id: review.id,
      url,
      type: url.endsWith('.mp4') || url.endsWith('.mov') ? 'video' : 'image',
      sort_order: index,
    }))

    const { error: mediaErr } = await supabase
      .from('review_media')
      .insert(mediaData)

    if (mediaErr) throw mediaErr
  }

  return review
}
