import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/review.repository";
import { ReviewDetail, AdminReviewListItem, SubmitReviewParams } from "../domain/review.types";

export class ReviewService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async getApprovedReviews(productId: string, page = 1, limit = 20) {
        return repo.getApprovedReviews(this.supabase, productId, page, limit);
    }

    async adminGetReviews(page = 1, limit = 20) {
        return repo.adminGetReviews(this.supabase, page, limit);
    }

    async adminUpdateReviewStatus(reviewId: string, status: 'pending' | 'approved' | 'rejected' | 'hidden') {
        return repo.adminUpdateReviewStatus(this.supabase, reviewId, status);
    }

    async adminReplyToReview(reviewId: string, body: string, adminId: string) {
        return repo.adminReplyToReview(this.supabase, reviewId, body, adminId);
    }

    async customerSubmitReview(params: SubmitReviewParams) {
        return repo.customerSubmitReview(this.supabase, params);
    }
}
