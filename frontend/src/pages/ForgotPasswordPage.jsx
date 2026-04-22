import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { formatApiError } from '../lib/formatters'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback({ message: '', type: 'success' })

    try {
      const response = await apiClient.post('/auth/forgot-password', { email })
      const message = response?.data?.data?.message || 'If your email exists, reset instructions were sent.'
      setFeedback({ message, type: 'success' })
    } catch (error) {
      setFeedback({
        message: formatApiError(error, 'Unable to process this request right now.'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page page--auth" aria-labelledby="forgot-password-title">
      <div className="auth-card">
        <p className="eyebrow">Password recovery</p>
        <h1 id="forgot-password-title">Forgot your password?</h1>
        <p>Enter your account email and we will send you a password reset link.</p>

        {feedback.message ? (
          <p
            className={`catalog-feedback ${feedback.type === 'error' ? 'catalog-feedback--error' : 'catalog-feedback--success'}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
            aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
          >
            {feedback.message}
          </p>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
          />

          <button type="submit" className="button button--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <Link className="inline-link" to="/login">
          Back to sign in
        </Link>
      </div>
    </section>
  )
}
