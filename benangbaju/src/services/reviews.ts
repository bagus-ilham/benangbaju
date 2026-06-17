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

  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }

  return data as unknown as ReviewDetail[]
}

export async function adminGetReviews(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      *,
      profiles (name, email),
      products (name),
      review_media (id, url, type),
      review_replies (id, body, created_at, profiles (name))
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin reviews:', error)
    throw error
  }

  return data || []
}

export async function adminUpdateReviewStatus(
  supabase: SupabaseClient<Database>,
  reviewId: string,
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
) {
  const { data, error } = await supabase
    .from('product_reviews')
    .update({ status })
    .eq('id', reviewId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function adminReplyToReview(
  supabase: SupabaseClient<Database>,
  reviewId: string,
  body: string,
  adminId: string
) {
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
    .select('*')
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
) {
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
    .select('*')
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
