import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { forgotPassword, resetPassword } from '../api/services'
import { AlertBox } from '../components/shared/AlertBox'
import styles from './RecoveryPage.module.css'

export function RecoveryPage() {
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetForm, setResetForm] = useState({
    token: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [demoToken, setDemoToken] = useState('')
  const [feedback, setFeedback] = useState({ forgot: null, reset: null })

  const forgotMutation = useMutation({ mutationFn: forgotPassword })
  const resetMutation = useMutation({ mutationFn: resetPassword })

  async function handleForgotSubmit(event) {
    event.preventDefault()
    setFeedback((previous) => ({ ...previous, forgot: null }))

    await forgotMutation.mutateAsync({ email: forgotEmail }, {
      onSuccess: (data) => {
        setDemoToken(data?.demoResetToken ?? '')
        setFeedback((previous) => ({
          ...previous,
          forgot: {
            variant: 'success',
            title: 'Reset link sent',
            message: data?.message ?? 'If this email exists, reset instructions were sent.',
          },
        }))
      },
      onError: () => {
        setFeedback((previous) => ({
          ...previous,
          forgot: {
            variant: 'error',
            title: 'Request failed',
            message: 'We could not process your request. Please try again.',
          },
        }))
      },
    })
  }

  async function handleResetSubmit(event) {
    event.preventDefault()
    setFeedback((previous) => ({ ...previous, reset: null }))

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setFeedback((previous) => ({
        ...previous,
        reset: {
          variant: 'error',
          title: 'Password mismatch',
          message: 'Confirm password must match new password.',
        },
      }))
      return
    }

    await resetMutation.mutateAsync({ token: resetForm.token, newPassword: resetForm.newPassword }, {
      onSuccess: () => {
        setFeedback((previous) => ({
          ...previous,
          reset: {
            variant: 'success',
            title: 'Password updated',
            message: 'You can now return to sign in with your new password.',
          },
        }))
      },
      onError: () => {
        setFeedback((previous) => ({
          ...previous,
          reset: {
            variant: 'error',
            title: 'Reset failed',
            message: 'Invalid or expired reset token. Request a new one.',
          },
        }))
      },
    })
  }

  async function copyDemoToken() {
    if (!demoToken) {
      return
    }

    try {
      await navigator.clipboard.writeText(demoToken)
      setFeedback((previous) => ({
        ...previous,
        reset: {
          variant: 'success',
          title: 'Token copied',
          message: 'Demo reset token copied to clipboard.',
        },
      }))
    } catch {
      setFeedback((previous) => ({
        ...previous,
        reset: {
          variant: 'error',
          title: 'Copy failed',
          message: 'Unable to copy token. Please copy it manually.',
        },
      }))
    }
  }

  return (
    <section className={styles.pageSection}>
      <header className="pageHeader">
        <h1 className="pageTitle">Password recovery</h1>
        <p className="pageSubtitle">Reset your password in two steps.</p>
      </header>

      <div className={styles.columns}>
        <section className="panel">
          <h2 className={styles.sectionTitle}>1. Forgot your password?</h2>
          <p className="pageSubtitle">Enter your email and we will send reset instructions.</p>

          {feedback.forgot ? (
            <AlertBox
              variant={feedback.forgot.variant}
              title={feedback.forgot.title}
              message={feedback.forgot.message}
              onClose={() => setFeedback((previous) => ({ ...previous, forgot: null }))}
            />
          ) : null}

          <form className={styles.form} onSubmit={handleForgotSubmit}>
            <label className="field">
              <span className="fieldLabel">Email</span>
              <input type="email" value={forgotEmail} required onChange={(event) => setForgotEmail(event.target.value)} />
            </label>
            <button type="submit" className="primaryButton" disabled={forgotMutation.isPending}>
              {forgotMutation.isPending ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <Link to="/auth">← Back to sign in</Link>
        </section>

        <section className="panel">
          <h2 className={styles.sectionTitle}>2. Reset password</h2>
          <p className="pageSubtitle">Use the token from your email or demo token.</p>

          {feedback.reset ? (
            <AlertBox
              variant={feedback.reset.variant}
              title={feedback.reset.title}
              message={feedback.reset.message}
              onClose={() => setFeedback((previous) => ({ ...previous, reset: null }))}
            />
          ) : null}

          <form className={styles.form} onSubmit={handleResetSubmit}>
            <label className="field">
              <span className="fieldLabel">Reset token</span>
              <input
                value={resetForm.token}
                required
                onChange={(event) => setResetForm((previous) => ({ ...previous, token: event.target.value }))}
              />
            </label>
            <label className="field">
              <span className="fieldLabel">New password</span>
              <input
                type="password"
                minLength={8}
                value={resetForm.newPassword}
                required
                onChange={(event) => setResetForm((previous) => ({ ...previous, newPassword: event.target.value }))}
              />
            </label>
            <label className="field">
              <span className="fieldLabel">Confirm password</span>
              <input
                type="password"
                minLength={8}
                value={resetForm.confirmPassword}
                required
                onChange={(event) => setResetForm((previous) => ({ ...previous, confirmPassword: event.target.value }))}
              />
            </label>
            <button type="submit" className="primaryButton" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? 'Updating...' : 'Update password'}
            </button>
          </form>

          {demoToken ? (
            <div className={styles.demoTokenCard}>
              <p><strong>Demo reset token</strong></p>
              <code>{demoToken}</code>
              <button type="button" className="secondaryButton" onClick={copyDemoToken}>
                Copy token
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  )
}
