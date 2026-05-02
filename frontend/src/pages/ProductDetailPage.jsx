import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { ProductReviews } from '../components/ProductReviews'
import { ProductImage } from '../components/ProductImage'
import { addCartItem } from '../lib/customerApi'
import { formatApiError } from '../lib/formatters'
import { useAuthStore } from '../stores/authStore'

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
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { id } = useParams()
  const token = useAuthStore((state) => state.token)
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: Boolean(id),
  })

  const addToCartMutation = useMutation({
    mutationFn: addCartItem,
    onSuccess: () => {
      setFeedback({ message: 'Added to your cart.', type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to add this item to your cart.'),
        type: 'error',
      })
    },
  })

  function handleAddToCart() {
    const product = productQuery.data

    if (!product || product.stockQty < 1) {
      return
    }

    if (!token) {
      navigate('/login', { replace: true, state: { from: location } })
      return
    }

    addToCartMutation.mutate({ productId: product.id, quantity: 1 })
  }

  if (productQuery.isLoading) {
    return (
      <section className="page page--detail" aria-labelledby="product-detail-title">
        <h1 id="product-detail-title">Product details</h1>
        <p>Loading product…</p>
      </section>
    )
  }

  if (productQuery.isError) {
    const status = productQuery.error?.response?.status

    if (status === 404) {
      return (
        <section className="page page--detail" aria-labelledby="product-detail-title">
          <h1 id="product-detail-title">Product details</h1>
          <p>Product not found.</p>
          <Link className="inline-link" to="/products">
            Back to catalog
          </Link>
        </section>
      )
    }

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
    <section className="product-detail-page" aria-labelledby="product-detail-title">
      <div className="top-navigation-bar">
        <Link to="/products" className="btn-back-catalog">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Catalog
        </Link>
        <h1 className="page-header-title">Product Details</h1>
        <div style={{ width: '130px' }}></div>
      </div>

      <div className="product-hero-panel">
        <div className="product-gallery-container">
          <div className="product-gallery-section">
            <div className="product-detail-media product-detail-media--hero">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                brand={product.brand}
                width="960"
                height="720"
                loading="eager"
              />
            </div>
          </div>
          <div className="product-features-bar">
            <span>Premium Build</span>
            <div className="feature-divider"></div>
            <span>Ultra portable</span>
            <div className="feature-divider"></div>
            <span>Fast Charging</span>
            <div className="feature-divider"></div>
            <span>2-year Warranty</span>
          </div>
        </div>

        <div className="purchase-panel" aria-label="Purchase panel">
          <p className="eyebrow">{product.brand}</p>
          <h1 id="product-detail-title">{product.name}</h1>
          <p>{product.description}</p>
          <p className="product-detail-price">{currencyFormatter.format(product.price)}</p>
          <p className={product.stockQty > 0 ? 'stock stock--available' : 'stock stock--empty'}>
            {product.stockQty > 0 ? `${product.stockQty} in stock` : 'Out of stock'}
          </p>

          {feedback.message ? (
            <p
              className={`catalog-feedback ${feedback.type === 'error' ? 'catalog-feedback--error' : 'catalog-feedback--success'}`}
              role={feedback.type === 'error' ? 'alert' : 'status'}
              aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
            >
              {feedback.message}
            </p>
          ) : null}

          <div className="cta-row">
            <button
              type="button"
              className="button button--primary"
              disabled={product.stockQty < 1 || addToCartMutation.isPending}
              onClick={handleAddToCart}
            >
              {product.stockQty < 1
                ? 'Out of stock'
                : addToCartMutation.isPending
                  ? 'Adding…'
                  : 'Add to cart'}
            </button>
            <Link className="button button--secondary" to="/products">
              Back to catalog
            </Link>
          </div>
        </div>
      </div>

      <div className="specifications-panel">
        <h2>Specifications</h2>
        <dl className="specifications-grid" aria-label="Detailed specifications">
          <div>
            <dt>CPU</dt>
            <dd>{product.cpu}</dd>
          </div>
          <div>
            <dt>RAM</dt>
            <dd>{product.ram || `${product.ramGb} GB`}</dd>
          </div>
          <div>
            <dt>Storage</dt>
            <dd>{product.storage || `${product.storageGb} GB SSD`}</dd>
          </div>
          <div>
            <dt>Screen</dt>
            <dd>{product.screen || `${product.screenSize} inch`}</dd>
          </div>
          {product.graphic && (
            <div>
              <dt>Graphics</dt>
              <dd>{product.graphic}</dd>
            </div>
          )}
          {product.battery && (
            <div>
              <dt>Battery</dt>
              <dd>{product.battery}</dd>
            </div>
          )}
          {product.weight && (
            <div>
              <dt>Weight</dt>
              <dd>{product.weight}</dd>
            </div>
          )}
          {product.dimensions && (
            <div>
              <dt>Dimensions</dt>
              <dd>{product.dimensions}</dd>
            </div>
          )}
          {product.os && (
            <div>
              <dt>OS</dt>
              <dd>{product.os}</dd>
            </div>
          )}
          {product.port && (
            <div>
              <dt>Ports</dt>
              <dd>{product.port}</dd>
            </div>
          )}
          {product.connectivity && (
            <div>
              <dt>Connectivity</dt>
              <dd>{product.connectivity}</dd>
            </div>
          )}
          {product.keyboard && (
            <div>
              <dt>Keyboard</dt>
              <dd>{product.keyboard}</dd>
            </div>
          )}
        </dl>
      </div>

      <ProductReviews productId={product.id} />
    </section>
  )
}
