import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ReviewService } from "@/modules/review/application/review.service";
import * as types from "@/modules/review/domain/review.types";

export type { ReviewDetail, AdminReviewListItem, SubmitReviewParams } from "@/modules/review/domain/review.types";

export async function getApprovedReviews(supabase: SupabaseClient<Database>, productId: string) {
    return new ReviewService(supabase).getApprovedReviews(productId);
}

export async function adminGetReviews(supabase: SupabaseClient<Database>) {
    return new ReviewService(supabase).adminGetReviews();
}

export async function adminUpdateReviewStatus(supabase: SupabaseClient<Database>, reviewId: string, status: 'pending' | 'approved' | 'rejected' | 'hidden') {
    return new ReviewService(supabase).adminUpdateReviewStatus(reviewId, status);
}

export async function adminReplyToReview(supabase: SupabaseClient<Database>, reviewId: string, body: string, adminId: string) {
    return new ReviewService(supabase).adminReplyToReview(reviewId, body, adminId);
}

export async function customerSubmitReview(supabase: SupabaseClient<Database>, params: types.SubmitReviewParams) {
    return new ReviewService(supabase).customerSubmitReview(params);
}
