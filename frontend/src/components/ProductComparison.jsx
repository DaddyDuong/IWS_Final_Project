import { Link } from 'react-router-dom'
import { currencyFormatter } from '../lib/formatters'

export function ProductComparison({ products }) {
  const comparableProducts = products.slice(0, 3)

  if (comparableProducts.length < 2) {
    return null
  }

  return (
    <section className="comparison-panel" aria-labelledby="comparison-title">
      <div>
        <p className="eyebrow">Quick comparison</p>
        <h2 id="comparison-title">Compare visible laptops</h2>
      </div>

      <div className="comparison-grid">
        {comparableProducts.map((product) => (
          <article className="comparison-card" key={product.id}>
            <p className="eyebrow">{product.brand}</p>
            <h3>{product.name}</h3>
            <dl>
              <div>
                <dt>CPU</dt>
                <dd>{product.cpu}</dd>
              </div>
              <div>
                <dt>Memory</dt>
                <dd>{product.ramGb}GB RAM</dd>
              </div>
              <div>
                <dt>Storage</dt>
                <dd>{product.storageGb}GB SSD</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{currencyFormatter.format(product.price)}</dd>
              </div>

            </dl>
            <Link className="inline-link" to={`/products/${product.id}`}>
              View details
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
