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

export interface ProductReview {
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
}

export interface ReviewReply {
  id: string
  review_id: string
  admin_id: string
  body: string
  created_at: string
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
