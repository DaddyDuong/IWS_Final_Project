import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { formatApiError } from '../lib/formatters'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    token: searchParams.get('token') || '',
    password: '',
    passwordConfirmation: '',
  })
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.token.trim()) {
      setFeedback({ message: 'Reset token is required.', type: 'error' })
      return
    }

    if (form.password !== form.passwordConfirmation) {
      setFeedback({ message: 'Passwords do not match.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setFeedback({ message: '', type: 'success' })

    try {
      const response = await apiClient.post('/auth/reset-password', {
        token: form.token,
        newPassword: form.password,
      })
      const message = response?.data?.data?.message || 'Password reset successfully.'
      setFeedback({ message, type: 'success' })
      setForm((current) => ({
        ...current,
        password: '',
        passwordConfirmation: '',
      }))
    } catch (error) {
      setFeedback({
        message: formatApiError(error, 'Unable to reset password right now.'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page page--auth" aria-labelledby="reset-password-title">
      <div className="auth-card">
        <p className="eyebrow">Set a new password</p>
        <h1 id="reset-password-title">Reset password</h1>
        <p>Use a password with at least 8 characters.</p>

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
          <label htmlFor="reset-token">Reset token</label>
          <input
            id="reset-token"
            name="token"
            autoComplete="off"
            required
            value={form.token}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />

          <label htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />

          <label htmlFor="reset-password-confirmation">Confirm password</label>
          <input
            id="reset-password-confirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            required
            value={form.passwordConfirmation}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />

          <button type="submit" className="button button--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <Link className="inline-link" to="/login">
          Back to sign in
        </Link>
      </div>
    </section>
  )
}
