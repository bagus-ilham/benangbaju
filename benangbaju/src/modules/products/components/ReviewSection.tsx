/* eslint-disable react/no-unescaped-entities */
'use client'

import React from 'react'
import Image from 'next/image'
import { HandDrawnIcon } from '@/shared/components'
import { useReviews } from '@/modules/reviews/hooks/useReviews'
import { ProductRatingSummary } from '@/modules/products/types'
import { cn, formatDate } from '@/lib/utils'
import { useMarket } from '@/shared/stores/marketStore'
import { getProxiedImageUrl } from '@/lib/getImageUrl'

import toast from 'react-hot-toast'
import { voteReviewHelpfulAction } from '@/modules/reviews/actions'

interface ReviewHelpfulButtonProps {
  reviewId: string
  initialCount: number
}

function ReviewHelpfulButton({ reviewId, initialCount }: ReviewHelpfulButtonProps) {
  const market = useMarket()
  const isMY = market === 'MY'
  const [count, setCount] = React.useState(initialCount)
  const [hasVoted, setHasVoted] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleVote = async () => {
    if (hasVoted || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await voteReviewHelpfulAction(reviewId)
      if (res.success && res.data !== undefined) {
        setCount(res.data)
        setHasVoted(true)
        toast.success(isMY ? 'Thank you for your feedback!' : 'Terima kasih atas masukan Anda!')
      } else {
        toast.error(isMY ? 'Failed to submit feedback.' : 'Gagal mengirim tanggapan.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={hasVoted || isSubmitting}
      className={cn(
        'inline-flex items-center text-[10px] space-x-1.5 font-sans px-3 py-1 rounded-full border transition-all',
        hasVoted
          ? 'bg-brand-gold-soft/70 border-brand-gold-stroke/50 text-brand-plum font-bold cursor-default'
          : 'bg-brand-cream border-brand-plum/10 text-neutral-500 hover:text-brand-plum hover:border-brand-plum/25 cursor-pointer'
      )}
    >
      <HandDrawnIcon name="thumbs-up" className="h-3 w-3" />
      <span>
        {hasVoted ? (isMY ? 'Helpful' : 'Terbantu') : isMY ? 'Helpful' : 'Membantu'} ({count})
      </span>
    </button>
  )
}

interface ReviewSectionProps {
  productId: string
  ratingSummary: ProductRatingSummary | null
}

export function ReviewSection({ productId, ratingSummary }: ReviewSectionProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'
  const { data: reviewsRes, isLoading } = useReviews(productId)
  const reviews = reviewsRes?.data || []

  const total = ratingSummary?.total_reviews ?? reviews.length
  const avgRating =
    ratingSummary?.avg_rating ??
    (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0)

  const renderStars = (rating: number, className = 'h-3.5 w-3.5') => {
    return Array.from({ length: 5 }).map((_, i) => (
      <HandDrawnIcon
        key={i}
        name={i < Math.round(rating) ? 'star-filled' : 'star'}
        className={cn(className, i < Math.round(rating) ? 'opacity-100' : 'opacity-35')}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="py-10 space-y-4">
        <h2 className="text-xl font-serif font-medium text-brand-plum">
          {isMY ? 'Customer Reviews' : 'Ulasan Pembeli'} ({total})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-brand-gold-soft/35 border border-brand-plum/10 rounded-3xl skeleton-shimmer" />
          <div className="md:col-span-2 space-y-4">
            <div className="h-20 bg-brand-rose-soft/40 rounded-2xl skeleton-shimmer" />
            <div className="h-20 bg-brand-rose-soft/40 rounded-2xl skeleton-shimmer" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10 border-t border-brand-plum/10 space-y-8">
      <div className="flex flex-col md:flex-row md:space-x-12 space-y-6 md:space-y-0">
        {/* Left: Ratings Summary */}
        <div className="flex flex-col space-y-3.5 md:w-1/3 bg-brand-gold-soft/40 border border-brand-gold-stroke/45 p-6 md:p-8 rounded-3xl shadow-xs relative overflow-hidden h-max">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-blue-soft to-brand-gold" />
          <div className="space-y-0.5">
            <span className="inline-block text-sm font-accent font-bold text-brand-blue-text leading-none">
              {isMY ? 'Customer Love' : 'Kata Mereka'}
            </span>
            <h2 className="text-xl font-serif font-medium tracking-tight text-brand-plum">
              {isMY ? 'Customer Reviews' : 'Ulasan Pembeli'}
            </h2>
          </div>
          <div className="flex items-baseline space-x-2 pt-1">
            <span className="text-4xl font-serif font-medium text-brand-plum tracking-tight">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-brand-plum/65 font-sans">/ 5.0</span>
          </div>
          <div className="flex space-x-1">{renderStars(avgRating, 'h-4 w-4')}</div>
          <p className="text-xs text-brand-plum/75 font-sans leading-relaxed">
            {isMY
              ? `Based on ${total} verified customer reviews.`
              : `Berdasarkan ${total} ulasan terverifikasi dari pembeli.`}
          </p>
        </div>

        {/* Right: Reviews List */}
        <div className="flex-1 space-y-6">
          {reviews.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-brand-plum/15 bg-brand-gold-soft/25 text-center space-y-1.5">
              <p className="text-base font-serif font-medium text-brand-plum">
                {isMY ? 'No Reviews Yet' : 'Belum Ada Ulasan'}
              </p>
              <p className="text-xs text-neutral-600 font-sans">
                {isMY
                  ? 'Be the first to share your thoughts on this piece.'
                  : 'Jadilah yang pertama berbagi pengalaman memakai produk ini.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-brand-plum/10">
              {reviews.map((review) => (
                <div key={review.id} className="py-6 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-serif font-medium text-brand-plum">
                        {review.is_anonymous
                          ? isMY
                            ? 'Anonymous'
                            : 'Anonim'
                          : review.profiles?.name || 'Customer'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-blue-soft/75 text-[9px] uppercase tracking-wider text-brand-plum font-sans font-bold">
                            <HandDrawnIcon name="check-circle" className="h-2.5 w-2.5 mr-1" />
                            {isMY ? 'Verified Purchase' : 'Terverifikasi'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-sans">
                      {formatDate(review.created_at)}
                    </span>
                  </div>

                  {review.title && (
                    <h3 className="text-sm font-serif font-medium text-brand-plum">{review.title}</h3>
                  )}

                  <p className="text-xs md:text-sm text-neutral-600 font-sans leading-relaxed">
                    {review.body}
                  </p>

                  {/* Review Media Attachments */}
                  {review.review_media && review.review_media.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {review.review_media.map((media) => (
                        <div
                          key={media.id}
                          className="relative aspect-square w-16 bg-brand-rose-soft/65 border border-brand-plum/10 overflow-hidden rounded-xl shadow-xs"
                        >
                          <Image
                            src={getProxiedImageUrl(media.url)}
                            alt="Media review"
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Helpful Button */}
                  <div className="flex items-center justify-between pt-2">
                    <ReviewHelpfulButton reviewId={review.id} initialCount={review.helpful_count} />
                  </div>

                  {/* Admin Reply */}
                  {review.review_replies && review.review_replies.length > 0 && (
                    <div className="bg-brand-blue-soft/45 p-4 border-l-4 border-brand-blue mt-3 space-y-1 rounded-r-2xl rounded-l-sm">
                      <p className="text-sm font-accent font-bold text-brand-plum leading-none">
                        {isMY ? 'Reply from Benangbaju' : 'Balasan dari Benangbaju'}
                      </p>
                      <p className="text-xs text-brand-plum/85 font-sans leading-relaxed italic pt-1">
                        "{review.review_replies[0].body}"
                      </p>
                      <p className="text-[9px] text-brand-plum/60 font-sans">
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
