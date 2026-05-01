import { Link } from 'react-router-dom'
import { formatMoney } from '../../utils/format'
import styles from './ProductCard.module.css'

export function ProductCard({ product, onToggleCompare, compared = false }) {
  return (
    <article className={styles.card}>
      <button
        type="button"
        className={`${styles.compareToggle} ${compared ? styles.compared : ''}`.trim()}
        aria-label={compared ? 'Remove from quick comparison' : 'Add to quick comparison'}
        onClick={() => onToggleCompare(product)}
      >
        {compared ? '✓' : '+'}
      </button>

      <img src={product.imageUrl} alt={product.name} className={styles.image} loading="lazy" />

      <div className={styles.info}>
        <h3>{product.name}</h3>
        <p className={styles.meta}>{product.cpu} · {product.ramGb}GB · {product.storageGb}GB SSD</p>
        <p className={styles.price}>{formatMoney(product.price)}</p>
        <p className={product.stockQty > 0 ? styles.stock : `${styles.stock} ${styles.outOfStock}`.trim()}>
          {product.stockQty > 0 ? 'In stock' : 'Out of stock'}
        </p>
      </div>

      <Link className="secondaryButton" to={`/shop/${product.id}`}>
        View details
      </Link>
    </article>
  )
}
