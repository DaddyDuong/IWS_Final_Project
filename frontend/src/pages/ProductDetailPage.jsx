import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

async function fetchProductById(productId) {
  const response = await apiClient.get(`/products/${productId}`)
  return response.data.data
}

export function ProductDetailPage() {
  const { id } = useParams()

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: Boolean(id),
  })

  if (productQuery.isLoading) {
    return (
      <section className="page page--detail" aria-labelledby="product-detail-title">
        <h1 id="product-detail-title">Product details</h1>
        <p>Loading product...</p>
      </section>
    )
  }

  if (productQuery.isError) {
    return (
      <section className="page page--detail" aria-labelledby="product-detail-title">
        <h1 id="product-detail-title">Product details</h1>
        <p>Unable to load this product right now.</p>
        <Link className="inline-link" to="/products">
          Back to catalog
        </Link>
      </section>
    )
  }

  const product = productQuery.data

  return (
    <section className="page page--detail" aria-labelledby="product-detail-title">
      <p className="eyebrow">{product.brand}</p>
      <h1 id="product-detail-title">{product.name}</h1>

      <div className="product-detail-grid">
        <div className="product-detail-media">
          <img src={product.imageUrl} alt={product.name} />
        </div>

        <div className="product-detail-content">
          <p>{product.description}</p>
          <dl>
            <dt>CPU</dt>
            <dd>{product.cpu}</dd>

            <dt>RAM</dt>
            <dd>{product.ramGb} GB</dd>

            <dt>Storage</dt>
            <dd>{product.storageGb} GB SSD</dd>

            <dt>Screen</dt>
            <dd>{product.screenSize} inch</dd>

            <dt>Availability</dt>
            <dd>{product.stockQty > 0 ? `${product.stockQty} in stock` : 'Out of stock'}</dd>

            <dt>Price</dt>
            <dd className="product-detail-price">{currencyFormatter.format(product.price)}</dd>
          </dl>

          <Link className="button button--secondary" to="/products">
            Back to catalog
          </Link>
        </div>
      </div>
    </section>
  )
}
