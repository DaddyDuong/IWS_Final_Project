import { Link } from 'react-router-dom'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function ProductCard({ product }) {
  return (
    <article className="product-card">
      <div className="product-card__media">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card__body">
        <p className="eyebrow">{product.brand}</p>
        <h2>{product.name}</h2>
        <p className="product-specs">
          {product.cpu} - {product.ramGb}GB RAM - {product.storageGb}GB SSD
        </p>
        <div className="product-card__footer">
          <strong>{currencyFormatter.format(product.price)}</strong>
          <span className={product.stockQty > 0 ? 'stock stock--available' : 'stock stock--empty'}>
            {product.stockQty > 0 ? `${product.stockQty} in stock` : 'Out of stock'}
          </span>
        </div>
        <Link className="button button--primary" to={`/products/${product.id}`}>
          View details
        </Link>
      </div>
    </article>
  )
}

export function ProductGrid({ products, meta, isLoading, isError, error, isFetching, onPageChange }) {
  if (isLoading) {
    return <p className="catalog-feedback">Loading products...</p>
  }

  if (isError) {
    return <p className="catalog-feedback catalog-feedback--error">{error?.message || 'Failed to load products.'}</p>
  }

  if (products.length === 0) {
    return (
      <p className="catalog-feedback">
        No products match your filters. Try widening your search criteria.
      </p>
    )
  }

  const hasPrevious = meta.page > 1
  const hasNext = meta.page < meta.totalPages

  return (
    <>
      <div className="products-grid" role="list" aria-label="Product catalog">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="pagination-bar" aria-live="polite">
        <button
          type="button"
          className="button button--secondary"
          disabled={!hasPrevious || isFetching}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </button>
        <p>
          Page {meta.page} of {Math.max(meta.totalPages, 1)} ({meta.total} results)
          {isFetching ? ' - Updating...' : ''}
        </p>
        <button
          type="button"
          className="button button--secondary"
          disabled={!hasNext || isFetching}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </button>
      </div>
    </>
  )
}
