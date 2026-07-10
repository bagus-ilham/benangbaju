'use server'

import { reviewService } from './review.service'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'
import { SubmitReviewParams } from './types'

// Public Actions
export async function getApprovedReviewsAction(productId: string, page = 1, limit = 20) {
  return reviewService.getApprovedReviews(productId, page, limit)
}

// Auth Actions
export async function submitReviewAction(params: Omit<SubmitReviewParams, 'userId'>) {
  const { user } = await requireAuth()
  return reviewService.customerSubmitReview({
    ...params,
    userId: user.id,
  })
}

// Admin Actions
export async function getAdminReviewsAction(page = 1, limit = 20) {
  await requireAdmin()
  return reviewService.adminGetReviews(page, limit)
}

export async function updateAdminReviewStatusAction(
  reviewId: string,
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
) {
  await requireAdmin()
  return reviewService.adminUpdateReviewStatus(reviewId, status)
}

export async function adminReplyToReviewAction(reviewId: string, body: string) {
  const { user } = await requireAdmin()
  return reviewService.adminReplyToReview(reviewId, body, user.id)
}
