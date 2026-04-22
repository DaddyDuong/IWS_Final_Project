import { Link, useLocation } from 'react-router-dom'

export function LoginPage() {
  const location = useLocation()
  const fromPath = location.state?.from

  return (
    <section className="page page--auth" aria-labelledby="login-title">
      <div className="auth-card">
        <p className="eyebrow">Account access</p>
        <h1 id="login-title">Welcome back</h1>
        <p>Sign in to continue to your account{fromPath ? ` from ${fromPath}` : ''}.</p>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" required />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />

          <button type="submit" className="button button--primary">Sign in</button>
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
