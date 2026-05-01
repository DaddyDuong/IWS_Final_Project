import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertBox } from '../components/shared/AlertBox'
import { useAuthMutations } from '../hooks/useDomainData'
import { useAuthStore } from '../stores/authStore'
import styles from './AuthPage.module.css'

export function AuthPage() {
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const location = useLocation()
  const { loginMutation, registerMutation } = useAuthMutations()

  const [mode, setMode] = useState('signin')
  const [feedback, setFeedback] = useState(null)
  const [signInForm, setSignInForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })

  useEffect(() => {
    if (token) {
      navigate('/account', { replace: true })
    }
  }, [token, navigate])

  async function handleSignIn(event) {
    event.preventDefault()
    setFeedback(null)

    const destination = location.state?.from ?? '/account'

    await loginMutation.mutateAsync(signInForm, {
      onSuccess: () => {
        navigate(destination, { replace: true })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Invalid email or password', message: 'Please try again or reset your password.' })
      },
    })
  }

  async function handleRegister(event) {
    event.preventDefault()
    setFeedback(null)

    await registerMutation.mutateAsync(registerForm, {
      onSuccess: () => {
        setMode('signin')
        setSignInForm((previous) => ({ ...previous, email: registerForm.email }))
        setFeedback({ variant: 'success', title: 'Account created', message: 'You can now sign in with your new credentials.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Unable to create account', message: 'Please verify the form and try again.' })
      },
    })
  }

  return (
    <section className={styles.page}>
      <article className={styles.card}>
        <div className={styles.visualPanel}>
          <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p>
            {mode === 'signin'
              ? 'Sign in to track orders, manage addresses, and continue checkout.'
              : 'Join Nova Laptop Studio to save your cart and order history.'}
          </p>
          <img src="/assets/generated/auth-laptop-desk-white.png" alt="Laptop on desk" />
        </div>

        <div className={styles.formPanel}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={mode === 'signin' ? styles.activeTab : styles.tab}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'register' ? styles.activeTab : styles.tab}
              onClick={() => setMode('register')}
            >
              Create account
            </button>
          </div>

          {feedback ? (
            <AlertBox
              variant={feedback.variant}
              title={feedback.title}
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          ) : null}

          {mode === 'signin' ? (
            <form className={styles.form} onSubmit={handleSignIn}>
              <label className="field">
                <span className="fieldLabel">Email</span>
                <input
                  type="email"
                  value={signInForm.email}
                  required
                  onChange={(event) => setSignInForm((previous) => ({ ...previous, email: event.target.value }))}
                />
              </label>

              <label className="field">
                <span className="fieldLabel">Password</span>
                <input
                  type="password"
                  value={signInForm.password}
                  required
                  onChange={(event) => setSignInForm((previous) => ({ ...previous, password: event.target.value }))}
                />
              </label>

              <div className={styles.formActions}>
                <button type="submit" className="primaryButton" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                </button>
                <Link to="/auth/recovery">Forgot password?</Link>
              </div>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleRegister}>
              <label className="field">
                <span className="fieldLabel">Full name</span>
                <input
                  value={registerForm.fullName}
                  required
                  onChange={(event) => setRegisterForm((previous) => ({ ...previous, fullName: event.target.value }))}
                />
              </label>

              <div className="fieldGrid">
                <label className="field">
                  <span className="fieldLabel">Email</span>
                  <input
                    type="email"
                    value={registerForm.email}
                    required
                    onChange={(event) => setRegisterForm((previous) => ({ ...previous, email: event.target.value }))}
                  />
                </label>

                <label className="field">
                  <span className="fieldLabel">Phone</span>
                  <input
                    value={registerForm.phone}
                    onChange={(event) => setRegisterForm((previous) => ({ ...previous, phone: event.target.value }))}
                  />
                </label>
              </div>

              <label className="field">
                <span className="fieldLabel">Password</span>
                <input
                  type="password"
                  minLength={8}
                  value={registerForm.password}
                  required
                  onChange={(event) => setRegisterForm((previous) => ({ ...previous, password: event.target.value }))}
                />
              </label>

              <button type="submit" className="primaryButton" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </article>
    </section>
  )
}
