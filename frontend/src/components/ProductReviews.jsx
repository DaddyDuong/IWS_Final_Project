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
const initialReviewQuery = {
  page: 1,
  limit: 5,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  rating: undefined,
  hasComment: undefined,
}

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
  const [reviewQuery, setReviewQuery] = useState(initialReviewQuery)
  const reviewsQueryKey = ['product-reviews', productId, reviewQuery]

  const reviewsQuery = useQuery({
    queryKey: reviewsQueryKey,
    queryFn: () => fetchProductReviews(productId, reviewQuery),
    enabled: Boolean(productId),
    placeholderData: (previousData) => previousData,
  })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
  })

  const reviewsPayload = reviewsQuery.data
  const reviews = Array.isArray(reviewsPayload)
    ? reviewsPayload
    : reviewsPayload?.items || []
  const meta = Array.isArray(reviewsPayload)
    ? {
        page: 1,
        limit: reviews.length,
        total: reviews.length,
        totalPages: reviews.length > 0 ? 1 : 0,
      }
    : reviewsPayload?.meta || {
        page: reviewQuery.page,
        limit: reviewQuery.limit,
        total: 0,
        totalPages: 0,
      }
  const profile = profileQuery.data
  const isEditing = Boolean(editingId)

  const createMutation = useMutation({
    mutationFn: (variables) => createProductReview(variables),
    onSuccess: () => {
      setFeedback({ message: 'Review submitted.', type: 'success' })
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
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
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
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
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
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
  const hasPrevious = meta.page > 1
  const hasNext = meta.page < meta.totalPages

  function updateReviewQuery(patch) {
    setReviewQuery((current) => ({
      ...current,
      ...patch,
    }))
  }

  return (
    <section className="reviews-panel" aria-labelledby="reviews-title">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Customer reviews</p>
          <h2 id="reviews-title">Reviews</h2>
        </div>
        <span className="proof-pill" aria-label={`${reviews.length} reviews`}>
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      {feedback.message ? (
        <p
          className={`catalog-feedback ${feedback.type === 'error' ? 'catalog-feedback--error' : 'catalog-feedback--success'}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
        >
          {feedback.message}
        </p>
      ) : null}

      {reviewsQuery.isLoading ? (
        <p className="catalog-feedback" role="status" aria-live="polite">
          Loading reviews...
        </p>
      ) : null}

      {reviewsQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error" role="alert">
          {formatApiError(reviewsQuery.error, 'Unable to load reviews right now.')}
        </p>
      ) : null}

      <form className="product-filters" onSubmit={(event) => event.preventDefault()} aria-label="Review filters">
        <div className="filter-row">
          <label className="filter-field" htmlFor="reviews-sort">
            Sort by
            <select
              id="reviews-sort"
              value={`${reviewQuery.sortBy}:${reviewQuery.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(':')
                updateReviewQuery({ sortBy, sortOrder, page: 1 })
              }}
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="rating:desc">Highest rating</option>
              <option value="rating:asc">Lowest rating</option>
            </select>
          </label>

          <label className="filter-field" htmlFor="reviews-rating">
            Score
            <select
              id="reviews-rating"
              value={reviewQuery.rating ?? ''}
              onChange={(event) => {
                updateReviewQuery({
                  rating: event.target.value ? Number(event.target.value) : undefined,
                  page: 1,
                })
              }}
            >
              <option value="">All ratings</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>

          <label className="filter-field" htmlFor="reviews-comment-filter">
            Comment
            <select
              id="reviews-comment-filter"
              value={reviewQuery.hasComment === undefined ? 'all' : reviewQuery.hasComment ? 'with' : 'without'}
              onChange={(event) => {
                const value = event.target.value
                updateReviewQuery({
                  hasComment: value === 'all' ? undefined : value === 'with',
                  page: 1,
                })
              }}
            >
              <option value="all">All comments</option>
              <option value="with">With comment</option>
              <option value="without">Without comment</option>
            </select>
          </label>

          <label className="filter-field" htmlFor="reviews-limit">
            Per page
            <select
              id="reviews-limit"
              value={reviewQuery.limit}
              onChange={(event) => updateReviewQuery({ limit: Number(event.target.value), page: 1 })}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </label>
        </div>
      </form>

      {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 ? (
        <p className="catalog-feedback">No reviews yet. Be the first to share your experience.</p>
      ) : null}

      {reviews.length > 0 ? (
        <ul className="review-list" aria-label="Product reviews">
          {reviews.map((review) => {
            const canManageReview = Boolean(profile?.id && review.userId === profile.id)

            return (
              <li key={review.id}>
                <article className="review-card">
                  <div>
                    <div>
                      <strong>{getReviewerName(review)}</strong>
                      <p className="review-stars" aria-label={getRatingLabel(review.rating)}>
                        {'★'.repeat(Number(review.rating) || 0)}
                      </p>
                    </div>
                    {canManageReview ? (
                      <div className="cta-row">
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => startEditing(review)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button--secondary"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(review.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <p>{review.comment}</p>
                </article>
              </li>
            )
          })}
        </ul>
      ) : null}

      {reviews.length > 0 ? (
        <div className="pagination-bar" aria-live="polite">
          <button
            type="button"
            className="button button--secondary"
            disabled={!hasPrevious || reviewsQuery.isFetching}
            onClick={() => updateReviewQuery({ page: meta.page - 1 })}
          >
            Previous
          </button>
          <p>
            Page {meta.page} of {Math.max(meta.totalPages, 1)} ({meta.total} reviews)
            {reviewsQuery.isFetching ? ' - Updating…' : ''}
          </p>
          <button
            type="button"
            className="button button--secondary"
            disabled={!hasNext || reviewsQuery.isFetching}
            onClick={() => updateReviewQuery({ page: meta.page + 1 })}
          >
            Next
          </button>
        </div>
      ) : null}

      {!token ? <p className="catalog-feedback">Sign in to write a review.</p> : null}

      {token ? (
        <form className="review-form" onSubmit={handleSubmit}>
          <label htmlFor="review-rating">Rating</label>
          <select
            id="review-rating"
            value={form.rating}
            onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
          >
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>

          <label htmlFor="review-comment">Review comment</label>
          <textarea
            id="review-comment"
            value={form.comment}
            rows="4"
            required
            onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
          />

          <div className="cta-row">
            <button type="submit" className="button button--primary" disabled={isSaving || !productId}>
              {isEditing ? 'Update review' : 'Submit review'}
            </button>
            {isEditing ? (
              <button type="button" className="button button--secondary" onClick={cancelEditing}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  )
}
