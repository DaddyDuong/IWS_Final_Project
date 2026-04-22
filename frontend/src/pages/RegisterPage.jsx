import { Link } from 'react-router-dom'

export function RegisterPage() {
  return (
    <section className="page page--auth" aria-labelledby="register-title">
      <div className="auth-card">
        <p className="eyebrow">Create your account</p>
        <h1 id="register-title">Register</h1>
        <p>Set up your account to manage orders, addresses, and checkout faster.</p>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="register-name">Full name</label>
          <input id="register-name" name="name" autoComplete="name" required />

          <label htmlFor="register-email">Email</label>
          <input id="register-email" name="email" type="email" autoComplete="email" required />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />

          <button type="submit" className="button button--primary">Create account</button>
        </form>

        <Link className="inline-link" to="/login">
          Already have an account? Sign in
        </Link>
      </div>
    </section>
  )
}
