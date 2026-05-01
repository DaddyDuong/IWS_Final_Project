import { Link } from 'react-router-dom'
import { formatMoney } from '../../utils/format'
import styles from './ComparisonStrip.module.css'

export function ComparisonStrip({ products, onRemove, onClear }) {
  if (!products.length) {
    return null
  }

  return (
    <section className={styles.strip}>
      <div className={styles.headerRow}>
        <h3>Quick comparison</h3>
        <button type="button" className={styles.clearButton} onClick={onClear}>
          Clear all
        </button>
      </div>

      <div className={styles.list}>
        {products.map((item) => (
          <article key={item.id} className={styles.item}>
            <img src={item.imageUrl} alt={item.name} loading="lazy" />
            <div>
              <p className={styles.name}>{item.name}</p>
              <p className={styles.spec}>{item.cpu} · {item.ramGb}GB · {item.storageGb}GB</p>
              <p className={styles.price}>{formatMoney(item.price)}</p>
            </div>
            <button type="button" className={styles.remove} onClick={() => onRemove(item.id)}>×</button>
            <Link to={`/shop/${item.id}`} className={styles.inlineLink}>Details</Link>
          </article>
        ))}
      </div>
    </section>
  )
}
