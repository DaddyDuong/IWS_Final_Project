import { Link } from 'react-router-dom'

const useCases = [
  { title: 'Study', copy: 'Portable laptops for classes, notes, and everyday browsing.' },
  { title: 'Work', copy: 'Reliable machines for productivity, meetings, and multitasking.' },
  { title: 'Gaming', copy: 'High-performance devices with strong CPUs, RAM, and storage.' },
  { title: 'Creator', copy: 'Premium screens and fast storage for design, video, and code.' },
]

const proofPoints = [
  'JWT account access',
  'Server-side filters',
  'Cart and checkout',
  'Order history',
]

export function HomePage() {
  return (
    <div className="storefront-page" aria-labelledby="home-title">
      <section className="store-hero store-section--dark">
        <p className="eyebrow eyebrow--on-dark">Premium laptop retail</p>
        <h1 id="home-title">Find the laptop that fits your next move.</h1>
        <p className="store-hero__copy">
          Browse focused devices, compare the specs that matter, and move from discovery to checkout in a clear retail flow.
        </p>
        <div className="cta-row cta-row--centered">
          <Link className="button button--primary" to="/products">
            Shop the catalog
          </Link>
          <Link className="button button--secondary button--on-dark" to="/register">
            Create account
          </Link>
        </div>
      </section>

      <section className="store-section" aria-labelledby="home-use-cases">
        <p className="eyebrow">Choose by purpose</p>
        <h2 id="home-use-cases">Built for how you use it.</h2>
        <div className="feature-grid">
          {useCases.map((item) => (
            <article className="feature-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="store-section store-section--soft" aria-labelledby="home-proof">
        <p className="eyebrow">Defense-ready flows</p>
        <h2 id="home-proof">A complete storefront on top of REST APIs.</h2>
        <div className="proof-strip">
          {proofPoints.map((item) => (
            <span className="proof-pill" key={item}>{item}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
