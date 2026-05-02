import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { formatApiError } from '../lib/formatters'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
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
    setIsSubmitting(true)
    setFeedback({ message: '', type: 'success' })

    try {
      await apiClient.post('/auth/register', {
        email: form.email,
        password: form.password,
        fullName: form.fullName,
      })

      navigate('/login', {
        replace: true,
        state: { message: 'Account created. You can sign in now.' },
      })
    } catch (error) {
      setFeedback({
        message: formatApiError(error, 'Unable to create account right now.'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page page--auth" aria-labelledby="register-title">
      <div className="auth-card">
        <p className="eyebrow">Create your account</p>
        <h1 id="register-title">Register</h1>
        <p>Set up your account to manage orders, addresses, and checkout faster.</p>

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
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="fullName"
            autoComplete="name"
            required
            value={form.fullName}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />

          <button type="submit" className="button button--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <Link className="inline-link" to="/login">
          Already have an account? Sign in
        </Link>
      </div>
    </section>
  )
}
