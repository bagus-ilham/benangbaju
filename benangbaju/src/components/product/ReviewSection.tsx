'use client'

import React from 'react'
import { Star, CheckCircle, ThumbsUp } from 'lucide-react'
import { useReviews } from '@/hooks/useReviews'
import { ProductRatingSummary } from '@/services/products'
import { cn, formatDate } from '@/lib/utils'

interface ReviewSectionProps {
  productId: string
  ratingSummary: ProductRatingSummary | null
}

export function ReviewSection({ productId, ratingSummary }: ReviewSectionProps) {
  const { data: reviews = [], isLoading } = useReviews(productId)

  // Calculate default values if ratingSummary is missing
  const total = ratingSummary?.total_reviews || reviews.length
  const avgRating = ratingSummary?.avg_rating || (reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0)

  // Star render helper
  const renderStars = (rating: number, className = 'h-3.5 w-3.5') => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          className,
          i < Math.round(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-neutral-200'
        )}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="py-8 space-y-4">
        <h3 className="text-sm font-heading font-medium uppercase tracking-wider text-brand-black">
          Ulasan Pembeli ({total})
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-neutral-100 w-full" />
          <div className="h-16 bg-neutral-50 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="py-10 border-t border-neutral-100 space-y-8">
      <div className="flex flex-col md:flex-row md:space-x-12 space-y-6 md:space-y-0">
        {/* Left: Ratings Summary */}
        <div className="flex flex-col space-y-2 md:w-1/4">
          <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-brand-black">
            Ulasan Pembeli
          </h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-heading font-light text-brand-black">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-400 font-sans">/ 5.0</span>
          </div>
          <div className="flex space-x-1">
            {renderStars(avgRating, 'h-4 w-4')}
          </div>
          <p className="text-[11px] text-neutral-400 font-sans">
            Berdasarkan {total} ulasan terverifikasi
          </p>
        </div>

        {/* Right: Reviews List */}
        <div className="flex-1 space-y-6">
          {reviews.length === 0 ? (
            <div className="text-xs text-neutral-400 font-sans italic py-4">
              Belum ada ulasan untuk produk ini.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {reviews.map((review) => (
                <div key={review.id} className="py-6 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-semibold text-brand-black">
                        {review.is_anonymous ? 'Anonim' : review.profiles?.name || 'Customer'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        {review.is_verified_purchase && (
                          <span className="flex items-center text-[9px] uppercase tracking-wider text-neutral-400 font-heading">
                            <CheckCircle className="h-2.5 w-2.5 text-neutral-400 mr-1" />
                            Terverifikasi
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-sans">
                      {formatDate(review.created_at)}
                    </span>
                  </div>

                  {review.title && (
                    <h4 className="text-xs font-semibold text-brand-black">
                      {review.title}
                    </h4>
                  )}

                  <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                    {review.body}
                  </p>

                  {/* Review Media Attachments */}
                  {review.review_media && review.review_media.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {review.review_media.map((media) => (
                        <div
                          key={media.id}
                          className="relative aspect-square w-16 bg-neutral-100 border border-neutral-100 overflow-hidden"
                        >
                          <img
                            src={media.url}
                            alt="Media review"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Helpful and Admin Reply Section */}
                  <div className="flex items-center justify-between pt-2">
                    <button className="flex items-center text-[10px] text-neutral-400 hover:text-brand-black space-x-1 font-sans">
                      <ThumbsUp className="h-3 w-3" />
                      <span>Membantu ({review.helpful_count})</span>
                    </button>
                  </div>

                  {/* Admin Reply */}
                  {review.review_replies && review.review_replies.length > 0 && (
                    <div className="bg-neutral-50 p-4 border-l-2 border-brand-black mt-3 space-y-1">
                      <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-black">
                        Balasan dari Benangbaju
                      </p>
                      <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                        {review.review_replies[0].body}
                      </p>
                      <p className="text-[9px] text-neutral-400 font-sans">
                        {formatDate(review.review_replies[0].created_at)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
