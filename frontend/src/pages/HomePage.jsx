import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="page page--hero" aria-labelledby="home-title">
      <p className="eyebrow">Apple-inspired laptop shopping</p>
      <h1 id="home-title">Discover your next laptop</h1>
      <p className="lead">
        Explore premium devices, compare specs, and move from shortlist to checkout
        with a clean, focused experience.
      </p>
      <div className="cta-row">
        <Link className="button button--primary" to="/products">
          Browse products
        </Link>
        <Link className="button button--secondary" to="/register">
          Create account
        </Link>
      </div>
    </section>
  )
}
