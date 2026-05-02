import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { formatApiError } from '../lib/formatters'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setToken = useAuthStore((state) => state.setToken)
  const [form, setForm] = useState({ email: '', password: '' })
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fromState = location.state?.from
  const locationMessage = typeof location.state?.message === 'string' ? location.state.message : ''
  const fromPath =
    typeof fromState === 'string'
      ? fromState
      : fromState
        ? `${fromState.pathname ?? ''}${fromState.search ?? ''}${fromState.hash ?? ''}`
        : ''

  async function handleSubmit(event) {
    event.preventDefault()

    setIsSubmitting(true)
    setFeedback({ message: '', type: 'success' })

    try {
      const response = await apiClient.post('/auth/login', {
        email: form.email,
        password: form.password,
      })
      const token = response?.data?.data?.token

      if (!token) {
        setFeedback({ message: 'Login failed. Missing access token.', type: 'error' })
        return
      }

      setToken(token)
      navigate(fromPath || '/profile', { replace: true })
    } catch (error) {
      setFeedback({
        message: formatApiError(error, 'Unable to sign in right now.'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  return (
    <section className="page page--auth" aria-labelledby="login-title">
      <div className="auth-card">
        <p className="eyebrow">Account access</p>
        <h1 id="login-title">Welcome back</h1>
        <p>Sign in to continue to your account{fromPath ? ` from ${fromPath}` : ''}.</p>

        {locationMessage ? (
          <p className="catalog-feedback catalog-feedback--success" role="status" aria-live="polite">
            {locationMessage}
          </p>
        ) : null}

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
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />

          <button type="submit" className="button button--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-links">
          <Link className="inline-link" to="/forgot-password">
            Forgot password?
          </Link>
          <Link className="inline-link" to="/register">
            Create account
          </Link>
        </div>
      </div>
    </section>
  )
}
