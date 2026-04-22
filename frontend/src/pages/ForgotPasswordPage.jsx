import { Link } from 'react-router-dom'

export function ForgotPasswordPage() {
  return (
    <section className="page page--auth" aria-labelledby="forgot-password-title">
      <div className="auth-card">
        <p className="eyebrow">Password recovery</p>
        <h1 id="forgot-password-title">Forgot your password?</h1>
        <p>Enter your account email and we will send you a password reset link.</p>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="forgot-email">Email</label>
          <input id="forgot-email" name="email" type="email" autoComplete="email" required />

          <button type="submit" className="button button--primary">Send reset link</button>
        </form>

        <Link className="inline-link" to="/login">
          Back to sign in
        </Link>
      </div>
    </section>
  )
}
