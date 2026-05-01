import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'

const categoryCards = [
  {
    id: 'study',
    label: 'Study',
    description: 'Lightweight performance for every assignment.',
    image: '/assets/generated/home-category-montage-white.png',
  },
  {
    id: 'work',
    label: 'Work',
    description: 'Reliable power to keep your productivity flowing.',
    image: '/assets/generated/home-category-montage-white.png',
  },
  {
    id: 'gaming',
    label: 'Gaming',
    description: 'High FPS, cool thermals, total immersion.',
    image: '/assets/generated/home-category-montage-white.png',
  },
  {
    id: 'creator',
    label: 'Creator',
    description: 'Built for speed, color, and every idea.',
    image: '/assets/generated/home-category-montage-white.png',
  },
]

const highlights = [
  {
    title: 'Server-side filters',
    description: 'Lightning-fast browsing with premium filter controls for specs and budget.',
  },
  {
    title: 'Cart and checkout',
    description: 'Real-time totals, address selection, and one-step order placement.',
  },
  {
    title: 'Order history',
    description: 'Track, review, and manage every purchase from one account workspace.',
  },
]

const trust = [
  { title: '99.9%', description: 'API uptime' },
  { title: '120ms', description: 'Average response' },
  { title: '100%', description: 'Secure by design' },
  { title: 'Scalable', description: 'Built to grow' },
]

export function HomePage() {
  return (
    <section className={styles.pageSection}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Find the laptop that fits your next move.</h1>
          <p>Premium notebooks, clear specs, and checkout flows designed for zero friction.</p>
          <div className={styles.heroActions}>
            <Link className="primaryButton" to="/shop">Shop the catalog</Link>
            <Link className="secondaryButton" to="/auth">Create account</Link>
          </div>
        </div>

        <figure className={styles.heroFigure}>
          <img src="/assets/generated/home-hero-laptop-white.png" alt="Hero laptop" loading="eager" />
        </figure>
      </section>

      <section className="panel">
        <header className={styles.blockHeader}>
          <h2>Find what fits your world</h2>
        </header>
        <div className={styles.categoryGrid}>
          {categoryCards.map((card) => (
            <article key={card.id} className={styles.categoryCard}>
              <img src={card.image} alt={`${card.label} laptops`} loading="lazy" />
              <div className={styles.categoryBody}>
                <h3>{card.label}</h3>
                <p>{card.description}</p>
                <Link to="/shop" className={styles.inlineLink}>Explore</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <header className={styles.blockHeader}>
          <h2>Built for a seamless experience</h2>
        </header>
        <div className={styles.highlightGrid}>
          {highlights.map((item) => (
            <article key={item.title} className={styles.highlightCard}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <header className={styles.blockHeader}>
          <h2>API-powered. Proven results.</h2>
        </header>
        <div className={styles.trustGrid}>
          {trust.map((item) => (
            <article key={item.title} className={styles.trustCard}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
