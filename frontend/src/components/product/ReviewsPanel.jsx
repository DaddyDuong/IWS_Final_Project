import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useReviewMutations, useReviewsQuery } from '../../hooks/useDomainData'
import { AlertBox } from '../shared/AlertBox'
import { StateBlock } from '../shared/StateBlock'
import { Pagination } from '../shared/Pagination'
import styles from './ReviewsPanel.module.css'

const DEFAULT_QUERY = {
  page: 1,
  limit: 5,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

export function ReviewsPanel({ productId }) {
  const user = useAuthStore((state) => state.user)
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [draft, setDraft] = useState({ rating: 5, comment: '' })
  const [editingId, setEditingId] = useState(null)
  const [editingDraft, setEditingDraft] = useState({ rating: 5, comment: '' })
  const [feedback, setFeedback] = useState(null)

  const reviewsQuery = useReviewsQuery(productId, query)
  const { createMutation, updateMutation, deleteMutation } = useReviewMutations(productId, query)

  const reviews = reviewsQuery.data?.items ?? []
  const meta = reviewsQuery.data?.meta ?? { page: 1, totalPages: 0 }

  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0

  function resetFeedback() {
    setFeedback(null)
  }

  async function handleCreate(event) {
    event.preventDefault()
    setFeedback(null)

    await createMutation.mutateAsync({
      rating: Number(draft.rating),
      comment: draft.comment,
    }, {
      onSuccess: () => {
        setDraft({ rating: 5, comment: '' })
        setFeedback({ variant: 'success', title: 'Review submitted', message: 'Thanks for sharing your feedback.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Unable to submit review', message: 'Please check your input and try again.' })
      },
    })
  }

  async function handleSaveEdit(reviewId) {
    setFeedback(null)

    await updateMutation.mutateAsync({
      id: reviewId,
      payload: {
        rating: Number(editingDraft.rating),
        comment: editingDraft.comment,
      },
    }, {
      onSuccess: () => {
        setEditingId(null)
        setFeedback({ variant: 'success', title: 'Review updated', message: 'Your review changes were saved.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Unable to update review', message: 'Please try again in a moment.' })
      },
    })
  }

  async function handleDelete(reviewId) {
    setFeedback(null)

    await deleteMutation.mutateAsync(reviewId, {
      onSuccess: () => {
        setFeedback({ variant: 'success', title: 'Review deleted', message: 'Your review was removed.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Unable to delete review', message: 'Please try again in a moment.' })
      },
    })
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2>Customer reviews</h2>
        <p>{reviews.length ? `${averageRating} average rating from this page` : 'No ratings yet'}</p>
      </header>

      <div className={styles.filterRow}>
        <label className="field">
          <span className="fieldLabel">Sort</span>
          <select
            value={`${query.sortBy}:${query.sortOrder}`}
            onChange={(event) => {
              const [sortBy, sortOrder] = event.target.value.split(':')
              setQuery((previous) => ({ ...previous, sortBy, sortOrder, page: 1 }))
            }}
          >
            <option value="createdAt:desc">Most recent</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="rating:desc">Highest rated</option>
            <option value="rating:asc">Lowest rated</option>
          </select>
        </label>

        <label className="field">
          <span className="fieldLabel">Rating</span>
          <select
            value={query.rating ?? ''}
            onChange={(event) => {
              const value = event.target.value
              setQuery((previous) => ({
                ...previous,
                rating: value ? Number(value) : undefined,
                page: 1,
              }))
            }}
          >
            <option value="">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </label>
      </div>

      {feedback ? (
        <AlertBox
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onClose={resetFeedback}
        />
      ) : null}

      <StateBlock
        isLoading={reviewsQuery.isLoading}
        isError={reviewsQuery.isError}
        error={reviewsQuery.error}
        isEmpty={!reviews.length}
        emptyTitle="No reviews yet"
        emptyMessage="Be the first to review this product."
        loadingText="Loading reviews..."
      >
        <div className={styles.list}>
          {reviews.map((review) => {
            const ownReview = user?.id === review.userId
            const isEditing = editingId === review.id

            if (isEditing) {
              return (
                <article key={review.id} className={styles.reviewCard}>
                  <div className={styles.editGrid}>
                    <label className="field">
                      <span className="fieldLabel">Rating</span>
                      <select
                        value={editingDraft.rating}
                        onChange={(event) => setEditingDraft((previous) => ({ ...previous, rating: Number(event.target.value) }))}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="fieldLabel">Comment</span>
                      <textarea value={editingDraft.comment} onChange={(event) => setEditingDraft((previous) => ({ ...previous, comment: event.target.value }))} />
                    </label>
                  </div>
                  <div className="inlineActions">
                    <button type="button" className="primaryButton" onClick={() => handleSaveEdit(review.id)}>
                      Save
                    </button>
                    <button type="button" className="secondaryButton" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </article>
              )
            }

            return (
              <article key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewTop}>
                  <p className={styles.author}>{review.user?.fullName ?? 'Anonymous'}</p>
                  <p className="mutedText">{review.rating} / 5</p>
                </div>
                <p className={styles.comment}>{review.comment}</p>

                {ownReview ? (
                  <div className="inlineActions">
                    <button
                      type="button"
                      className="secondaryButton"
                      onClick={() => {
                        setEditingId(review.id)
                        setEditingDraft({ rating: review.rating, comment: review.comment })
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="ghostDangerButton" onClick={() => handleDelete(review.id)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>

        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={(page) => setQuery((previous) => ({ ...previous, page }))} />
      </StateBlock>

      {user ? (
        <form className={styles.form} onSubmit={handleCreate}>
          <h3>Write a review</h3>
          <div className="fieldGrid">
            <label className="field">
              <span className="fieldLabel">Your rating</span>
              <select
                value={draft.rating}
                onChange={(event) => setDraft((previous) => ({ ...previous, rating: Number(event.target.value) }))}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="fieldLabel">Your review</span>
              <textarea
                value={draft.comment}
                placeholder="Share your experience with this product"
                required
                onChange={(event) => setDraft((previous) => ({ ...previous, comment: event.target.value }))}
              />
            </label>
          </div>
          <button type="submit" className="primaryButton" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      ) : (
        <p className="mutedText">Sign in to write, edit, or delete your reviews.</p>
      )}
    </section>
  )
}
