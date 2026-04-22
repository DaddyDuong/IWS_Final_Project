import { Link } from 'react-router-dom'

export function ResetPasswordPage() {
  return (
    <section className="page page--auth" aria-labelledby="reset-password-title">
      <div className="auth-card">
        <p className="eyebrow">Set a new password</p>
        <h1 id="reset-password-title">Reset password</h1>
        <p>Use a strong password with at least one number and one special character.</p>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />

          <label htmlFor="reset-password-confirmation">Confirm password</label>
          <input
            id="reset-password-confirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            required
          />

          <button type="submit" className="button button--primary">Update password</button>
        </form>

        <Link className="inline-link" to="/login">
          Back to sign in
        </Link>
      </div>
    </section>
  )
}
