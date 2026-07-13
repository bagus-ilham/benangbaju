import { reviewRepository } from './review.repository'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import {
  ReviewDetail,
  AdminReviewListItem,
  SubmitReviewParams,
  ProductReview,
  ReviewReply,
} from './types'

export class ReviewService {
  async getApprovedReviews(
    productId: string,
    page = 1,
    limit = 20
  ): Promise<ApiListResponse<ReviewDetail>> {
    return reviewRepository.getApprovedReviews(productId, page, limit)
  }

  async adminGetReviews(page = 1, limit = 20): Promise<ApiListResponse<AdminReviewListItem>> {
    return reviewRepository.adminGetReviews(page, limit)
  }

  async adminUpdateReviewStatus(
    reviewId: string,
    status: 'pending' | 'approved' | 'rejected' | 'hidden'
  ): Promise<ApiResponse<ProductReview>> {
    return reviewRepository.adminUpdateReviewStatus(reviewId, status)
  }

  async adminReplyToReview(
    reviewId: string,
    body: string,
    adminId: string
  ): Promise<ApiResponse<ReviewReply>> {
    return reviewRepository.adminReplyToReview(reviewId, body, adminId)
  }

  async customerSubmitReview(params: SubmitReviewParams): Promise<ApiResponse<ProductReview>> {
    return reviewRepository.customerSubmitReview(params)
  }
}

export const reviewService = new ReviewService()
