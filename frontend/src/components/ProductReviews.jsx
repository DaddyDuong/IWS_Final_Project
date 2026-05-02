import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProductReview,
  deleteProductReview,
  fetchProductReviews,
  fetchProfile,
  updateProductReview,
} from '../lib/customerApi'
import { formatApiError } from '../lib/formatters'
import { useAuthStore } from '../stores/authStore'

const emptyForm = { rating: '5', comment: '' }

function getReviewerName(review) {
  return review.user?.fullName || review.user?.email || 'Verified customer'
}

function getRatingLabel(rating) {
  const value = Number(rating) || 0
  return `${value} out of 5 stars`
}

export function ProductReviews({ productId }) {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })
  const queryKey = ['product-reviews', productId]

  const reviewsQuery = useQuery({
    queryKey,
    queryFn: () => fetchProductReviews(productId),
    enabled: Boolean(productId),
  })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
  })

  const reviews = reviewsQuery.data || []
  const profile = profileQuery.data
  const isEditing = Boolean(editingId)

  const createMutation = useMutation({
    mutationFn: (variables) => createProductReview(variables),
    onSuccess: () => {
      setFeedback({ message: 'Review submitted.', type: 'success' })
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to submit your review.'),
        type: 'error',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (variables) => updateProductReview(variables),
    onSuccess: () => {
      setFeedback({ message: 'Review updated.', type: 'success' })
      setEditingId('')
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to update this review.'),
        type: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProductReview(id),
    onSuccess: () => {
      setFeedback({ message: 'Review deleted.', type: 'success' })
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to delete this review.'),
        type: 'error',
      })
    },
  })

  function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      rating: Number(form.rating),
      comment: form.comment.trim(),
    }

    if (isEditing) {
      updateMutation.mutate({ id: editingId, payload })
      return
    }

    createMutation.mutate({ productId, payload })
  }

  function startEditing(review) {
    setEditingId(review.id)
    setForm({
      rating: String(review.rating || 5),
      comment: review.comment || '',
    })
    setFeedback({ message: '', type: 'success' })
  }

  function cancelEditing() {
    setEditingId('')
    setForm(emptyForm)
  }

  function handleDelete(reviewId) {
    if (globalThis.confirm('Delete this review?')) {
      deleteMutation.mutate(reviewId)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  // Compute live average from actual reviews
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1)
    : '0.0'
  const avgFill = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
    : 0

  return (
    <section className="mb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tighter mb-4">Customer Reviews</h2>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-black text-on-surface">{avgRating}</div>
            <div className="flex flex-col">
              <div className="flex text-tertiary mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: `'FILL' ${star <= Math.round(avgFill) ? 1 : 0}` }}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-on-surface-variant text-sm">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 ? (
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm text-center mb-8">
          <p className="text-on-surface-variant font-medium italic">No reviews yet. Be the first to share your experience.</p>
        </div>
      ) : null}

      {/* Review Cards */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {reviews.map((review) => {
            const canManageReview = Boolean(profile?.id && review.userId === profile.id)
            return (
              <div key={review.id} className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 text-tertiary">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: `'FILL' ${i < Number(review.rating) ? 1 : 0}` }}>
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant uppercase tracking-widest">
                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-on-surface leading-relaxed mb-6 font-medium italic flex-grow">"{review.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed-variant">
                    {getReviewerName(review).substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{getReviewerName(review)}</div>
                    <div className="text-xs text-secondary font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Verified Purchase
                    </div>
                  </div>
                </div>
                {canManageReview && (
                  <div className="flex gap-2 mt-4">
                    <button type="button" className="text-xs font-bold uppercase tracking-widest text-primary hover:underline" onClick={() => startEditing(review)}>
                      Edit
                    </button>
                    <button type="button" className="text-xs font-bold uppercase tracking-widest text-error hover:underline" disabled={deleteMutation.isPending} onClick={() => handleDelete(review.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Write Review Form */}
      {token ? (
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-on-surface mb-6">{isEditing ? 'Edit your review' : 'Write a Review'}</h3>
          {feedback.message && (
            <p className={`mb-4 text-sm font-semibold ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {feedback.message}
            </p>
          )}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Star Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: String(star) }))}
                    className="text-tertiary transition-transform hover:scale-125 focus:outline-none"
                  >
                    <span
                      className="material-symbols-outlined text-4xl"
                      style={{ fontVariationSettings: `'FILL' ${star <= Number(form.rating) ? 1 : 0}` }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="review-comment" className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Your Comment</label>
              <textarea
                id="review-comment"
                className="w-full rounded-xl border border-outline-variant bg-transparent px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={form.comment}
                rows="4"
                placeholder="Share your experience with this product..."
                required
                onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
              />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 hover:opacity-90" disabled={isSaving || !productId}>
                {isSaving ? 'Saving…' : isEditing ? 'Update Review' : 'Submit Review'}
              </button>
              {isEditing ? (
                <button type="button" className="border-2 border-primary text-primary px-8 py-3 rounded-xl font-bold transition-all hover:bg-primary/5" onClick={cancelEditing}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : (
        <p className="mt-8 text-on-surface-variant italic">Sign in to write a review.</p>
      )}
    </section>
  )
}
