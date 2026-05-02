import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { currencyFormatter } from '../lib/formatters'
import { ProductImage } from './ProductImage'

export function ProductCard({ product }) {
  return (
    <li className="products-grid__item" style={{ display: 'block' }}>
      <article className="product-card">
        <Link to={`/products/${product.id}`} className="product-card__media" aria-label={`View details for ${product.name}`}>
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            brand={product.brand}
            loading="lazy"
            width="640"
            height="480"
          />
        </Link>
        <div className="product-card__body">
          <div className="product-tags">
            <span className="product-tag">{product.condition || 'New 100%'}</span>
          </div>
          <h2>{product.name}</h2>
          <p className="product-specs" aria-label="Laptop specifications">
            {product.cpu} - {product.ramGb}GB RAM - {product.storageGb}GB SSD
          </p>
          <div className="product-card__footer">
            <strong className="product-price">
              {new Intl.NumberFormat('vi-VN').format(product.price)}₫
            </strong>
          </div>
          <Link className="button button--primary" to={`/products/${product.id}`} style={{ marginTop: '0.5vw', width: '100%' }}>
            View details
          </Link>
        </div>
      </article>
    </li>
  )
}
const TARGET_BRANDS = [
  { id: 'Dell', name: 'Laptop Dell' },
  { id: 'Asus', name: 'Laptop Asus' },
  { id: 'HP', name: 'Laptop HP' },
  { id: 'MSI', name: 'Laptop MSI' },
  { id: 'Acer', name: 'Laptop Acer' },
  { id: 'Gigabyte', name: 'Laptop Gigabyte' },
  { id: 'Lenovo', name: 'Laptop Lenovo' }
]

function BrandSection({ brandName, products }) {
  const [displayCount, setDisplayCount] = useState(10)

  if (!products || products.length === 0) return null

  const visibleProducts = products.slice(0, displayCount)
  const hasMore = displayCount < products.length

  return (
    <section className="brand-section" style={{ marginBottom: '60px', width: '100%' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', color: '#1a202c' }}>
        {brandName}
      </h2>
      <ul className="brand-products-grid" aria-label={`Products from ${brandName}`}>
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setDisplayCount(prev => prev + 5)}
            style={{ padding: '12px 32px', fontSize: '16px' }}
          >
            Show more
          </button>
        </div>
      )}
    </section>
  )
}

export function ProductGrid({ products, isLoading, isError, error, isFetching }) {
  const groupedProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      const brand = product.brand || 'Other'
      if (!acc[brand]) acc[brand] = []
      acc[brand].push(product)
      return acc
    }, {})
  }, [products])

  if (isLoading && products.length === 0) {
    return <p className="catalog-feedback">Loading products…</p>
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

  return (
    <div className="product-grid-container" style={{ width: '100%' }}>
      {TARGET_BRANDS.map(brandDef => (
        <BrandSection
          key={brandDef.id}
          brandName={brandDef.name}
          products={groupedProducts[brandDef.id] || []}
        />
      ))}
      {isFetching && <p className="catalog-feedback" style={{ textAlign: 'center', marginTop: '20px' }}>Updating…</p>}
    </div>
  )
}
