import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { createServerClient } from '@/lib/supabase/server'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import {
  ReviewDetail,
  AdminReviewListItem,
  SubmitReviewParams,
  ProductReview,
  ReviewReply,
} from './types'

export class ReviewRepository {
  async getApprovedReviews(
    productId: string,
    page = 1,
    limit = 20
  ): Promise<ApiListResponse<ReviewDetail>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('product_reviews')
      .select(
        `
        id, rating, title, body, is_anonymous, is_verified_purchase, created_at, helpful_count,
        profiles (name, avatar_url),
        review_media (id, url, type),
        review_replies (id, body, created_at, profiles (name))
      `,
        { count: 'exact' }
      )
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching reviews:', error)
      return paginated([], page, limit, 0)
    }

    if (!data) return paginated([], page, limit, 0)

    const result = data.map((item) => {
      const rawProfile = item.profiles
      let profiles: { name: string; avatar_url: string | null } | null = null
      if (rawProfile && !Array.isArray(rawProfile)) {
        profiles = {
          name: (rawProfile as any).name,
          avatar_url: (rawProfile as any).avatar_url,
        }
      }

      const rawMedia = item.review_media
      const mediaList = Array.isArray(rawMedia) ? rawMedia : []
      const review_media = mediaList.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
      }))

      const rawReplies = item.review_replies
      const repliesList = Array.isArray(rawReplies) ? rawReplies : []
      const review_replies = repliesList.map((r) => {
        const rawRProfile = r.profiles
        let rProfiles: { name: string } | null = null
        if (rawRProfile && !Array.isArray(rawRProfile)) {
          rProfiles = { name: (rawRProfile as any).name }
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

    return paginated(result, page, limit, count || 0)
  }

  async adminGetReviews(page = 1, limit = 20): Promise<ApiListResponse<AdminReviewListItem>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('product_reviews')
      .select(
        `
        id, order_item_id, product_id, variant_id, user_id, rating, title, body,
        is_anonymous, is_verified_purchase, is_pinned, status, helpful_count, created_at,
        profiles (name, email),
        products (name),
        review_media (id, url, type),
        review_replies (id, body, created_at, profiles (name))
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching admin reviews:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar ulasan')
    }

    if (!data) return paginated([], page, limit, count || 0)

    const result = data.map((item) => {
      const rawProfile = item.profiles
      let profiles: { name: string; email: string | null } | null = null
      if (rawProfile && !Array.isArray(rawProfile)) {
        profiles = {
          name: (rawProfile as any).name,
          email: (rawProfile as any).email,
        }
      }

      const rawProduct = item.products
      let products: { name: string } | null = null
      if (rawProduct && !Array.isArray(rawProduct)) {
        products = {
          name: (rawProduct as any).name,
        }
      }

      const rawMedia = item.review_media
      const mediaList = Array.isArray(rawMedia) ? rawMedia : []
      const review_media = mediaList.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
      }))

      const rawReplies = item.review_replies
      const repliesList = Array.isArray(rawReplies) ? rawReplies : []
      const review_replies = repliesList.map((r) => {
        const rawRProfile = r.profiles
        let rProfiles: { name: string } | null = null
        if (rawRProfile && !Array.isArray(rawRProfile)) {
          rProfiles = { name: (rawRProfile as any).name }
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

    return paginated(result, page, limit, count || 0)
  }

  async adminUpdateReviewStatus(
    reviewId: string,
    status: 'pending' | 'approved' | 'rejected' | 'hidden'
  ): Promise<ApiResponse<ProductReview>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('product_reviews')
      .update({ status })
      .eq('id', reviewId)
      .select(
        'id, order_item_id, product_id, variant_id, user_id, rating, title, body, is_anonymous, is_verified_purchase, is_pinned, status, helpful_count, created_at'
      )
      .single()

    if (error) {
      safeLogError('Error updating review status:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui status review')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'review',
      reviewId,
      `Updated review status to ${status}`
    )

    return ok(data as ProductReview)
  }

  async adminReplyToReview(
    reviewId: string,
    body: string,
    adminId: string
  ): Promise<ApiResponse<ReviewReply>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('review_replies')
      .upsert(
        {
          review_id: reviewId,
          admin_id: adminId,
          body,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'review_id' }
      )
      .select('id, review_id, admin_id, body, created_at')
      .single()

    if (error) {
      safeLogError('Error replying to review:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membalas review')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'create',
      'review_reply',
      data.id,
      `Replied to review ${reviewId}`
    )

    return ok(data as ReviewReply)
  }

  async customerSubmitReview(params: SubmitReviewParams): Promise<ApiResponse<ProductReview>> {
    const supabase = await createServerClient()
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
      .select(
        'id, order_item_id, product_id, variant_id, user_id, rating, title, body, is_anonymous, is_verified_purchase, is_pinned, status, helpful_count, created_at'
      )
      .single()

    if (reviewErr) {
      safeLogError('Error submitting review:', reviewErr)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengirim ulasan')
    }

    // 2. Insert media if present
    if (params.mediaUrls && params.mediaUrls.length > 0) {
      const mediaData = params.mediaUrls.map((url, index) => ({
        review_id: review.id,
        url,
        type: url.endsWith('.mp4') || url.endsWith('.mov') ? 'video' : 'image',
        sort_order: index,
      }))

      const { error: mediaErr } = await supabase.from('review_media').insert(mediaData)

      if (mediaErr) {
        safeLogError('Error submitting review media:', mediaErr)
        return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengirim gambar/video ulasan')
      }
    }

    return ok(review as ProductReview)
  }
}

export const reviewRepository = new ReviewRepository()
