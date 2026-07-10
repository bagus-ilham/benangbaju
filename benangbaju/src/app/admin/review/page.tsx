'use client'

import React, { useState } from 'react'
import {
  useAdminReviews,
  useAdminUpdateReviewStatus,
  useAdminReplyToReview,
} from '@/app/admin/hooks/useAdmin'
import { Button, Modal, AdminPageHeader, Textarea } from '@/shared/components'
import { Star, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/modules/users/stores/authStore'
import toast from 'react-hot-toast'
import type { AdminReviewListItem } from '@/modules/reviews/types'
import Image from 'next/image'

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-50 text-green-700 border border-green-200'
    case 'rejected':
    case 'hidden':
      return 'bg-red-50 text-red-700 border border-red-200'
    default:
      return 'bg-amber-50 text-amber-700 border border-amber-200'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Disetujui'
    case 'hidden':
      return 'Disembunyikan'
    case 'rejected':
      return 'Ditolak'
    default:
      return 'Menunggu'
  }
}

export default function AdminReviewsPage(): React.JSX.Element {
  const { data: reviewsRes, isLoading, isError, refetch } = useAdminReviews()
  const reviews = reviewsRes?.data || []
  const { user } = useAuthStore()

  const updateStatusMutation = useAdminUpdateReviewStatus()
  const replyMutation = useAdminReplyToReview()

  // Reply Modal Control
  const [selectedReview, setSelectedReview] = useState<AdminReviewListItem | null>(null)
  const [replyText, setReplyText] = useState('')

  const handleOpenReplyModal = (rev: AdminReviewListItem) => {
    setSelectedReview(rev)
    const existingReply = rev.review_replies?.[0]?.body || ''
    setReplyText(existingReply)
  }

  const handleUpdateStatus = async (
    reviewId: string,
    status: 'approved' | 'rejected' | 'hidden' | 'pending'
  ) => {
    toast.loading('Memperbarui status ulasan...', { id: 'update-status' })
    try {
      await updateStatusMutation.mutateAsync({ reviewId, status })
      toast.success('Status ulasan berhasil diperbarui!', { id: 'update-status' })
      refetch()
    } catch {
      toast.error('Gagal memperbarui status ulasan', { id: 'update-status' })
    }
  }

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReview || !user) return
    if (!replyText.trim()) {
      toast.error('Teks balasan tidak boleh kosong')
      return
    }

    toast.loading('Menyimpan balasan...', { id: 'save-reply' })
    try {
      await replyMutation.mutateAsync({
        reviewId: selectedReview.id,
        body: replyText.trim(),
      })
      toast.success('Balasan berhasil disimpan!', { id: 'save-reply' })
      setSelectedReview(null)
      refetch()
    } catch {
      toast.error('Gagal menyimpan balasan', { id: 'save-reply' })
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Ulasan Produk"
        subtitle="Moderasi ulasan produk dan berikan balasan ke pelanggan."
      />

      {/* Main Table */}
      <div className="border border-neutral-200 bg-white rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
              Memuat ulasan...
            </p>
          </div>
        ) : isError ? (
          <div className="py-24 text-center">
            <p className="text-red-500 text-xs font-semibold uppercase">
              Gagal memuat ulasan dari server
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 text-xs font-bold uppercase border-neutral-200 py-2 px-3 mx-auto block"
            >
              Coba Lagi
            </Button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 italic text-xs">
            Belum ada ulasan produk masuk.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-3 px-5">Produk</th>
                  <th className="py-3 px-4">Pengulas</th>
                  <th className="py-3 px-4">Bintang / Ulasan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                {reviews.map((rev: AdminReviewListItem) => (
                  <tr key={rev.id} className="hover:bg-neutral-50/20 transition duration-150">
                    <td className="py-4 px-5">
                      <span className="font-semibold text-neutral-900 text-sm block">
                        {rev.products?.name || 'Produk'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-neutral-600">
                      <p>{rev.is_anonymous ? 'Anonim' : rev.profiles?.name || 'Pelanggan'}</p>
                      <p className="text-[10px] text-neutral-400 font-normal">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-4 space-y-1 max-w-sm">
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={12}
                            fill={idx < rev.rating ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                      {rev.title && <p className="font-bold text-neutral-800">{rev.title}</p>}
                      <p className="text-neutral-600 leading-relaxed font-normal">{rev.body}</p>

                      {/* Review Media Previews */}
                      {rev.review_media && rev.review_media.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {rev.review_media.map((media) => (
                            <a
                              key={media.id}
                              href={media.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block border border-neutral-200 hover:border-brand-gold transition-colors relative w-12 h-12"
                            >
                              <Image
                                src={media.url}
                                alt="Review attachment"
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {rev.review_replies?.length > 0 && (
                        <div className="bg-neutral-55 bg-neutral-100/60 p-2 border-l-2 border-neutral-900 mt-2 font-normal text-[11px]">
                          <span className="font-bold text-neutral-800 text-[10px] uppercase block">
                            Balasan Admin:
                          </span>
                          <span className="italic block mt-0.5 text-neutral-600">
                            {rev.review_replies[0].body}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 ${getStatusBadgeClass(rev.status)}`}
                      >
                        {getStatusLabel(rev.status)}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1 whitespace-nowrap">
                      {rev.status !== 'approved' && (
                        <Button
                          onClick={() => handleUpdateStatus(rev.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white border-green-600 text-[10px] py-1.5 px-2.5 font-bold uppercase"
                        >
                          Setujui
                        </Button>
                      )}
                      {rev.status !== 'rejected' && (
                        <Button
                          onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white border-red-600 text-[10px] py-1.5 px-2.5 font-bold uppercase"
                        >
                          Tolak
                        </Button>
                      )}
                      {rev.status !== 'hidden' && (
                        <Button
                          onClick={() => handleUpdateStatus(rev.id, 'hidden')}
                          variant="outline"
                          className="text-[10px] py-1.5 px-2.5 font-bold uppercase border-neutral-200 text-neutral-500 hover:text-neutral-900"
                        >
                          Sembunyikan
                        </Button>
                      )}
                      <Button
                        onClick={() => handleOpenReplyModal(rev)}
                        variant="outline"
                        className="text-[10px] py-1.5 px-2.5 font-bold uppercase border-neutral-800 text-neutral-800 hover:bg-neutral-50"
                      >
                        <MessageSquare size={10} className="mr-1 inline" /> Balas
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <Modal
          isOpen={!!selectedReview}
          onClose={() => setSelectedReview(null)}
          title="Tulis Balasan Ulasan"
        >
          <form onSubmit={handleSaveReply} className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none leading-relaxed text-neutral-600 font-normal">
              <span className="font-bold text-neutral-800 block">Ulasan Pelanggan:</span>
              <span className="italic block mt-1">&quot;{selectedReview.body}&quot;</span>
            </div>

            <Textarea
              label="Tulis Balasan Admin"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Terima kasih atas ulasan positif Anda!..."
              required
              rows={4}
            />

            <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-100">
              <Button type="button" variant="outline" onClick={() => setSelectedReview(null)}>
                Batal
              </Button>
              <Button type="submit" isLoading={replyMutation.isPending}>
                Kirim Balasan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
