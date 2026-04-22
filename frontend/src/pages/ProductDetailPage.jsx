import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
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
          <img src={product.imageUrl} alt={product.name} width="960" height="720" />
        </div>

        <div className="product-detail-content">
          {feedback.message ? (
            <p
              className={`catalog-feedback ${feedback.type === 'error' ? 'catalog-feedback--error' : 'catalog-feedback--success'}`}
              role={feedback.type === 'error' ? 'alert' : 'status'}
              aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
            >
              {feedback.message}
            </p>
          ) : null}

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
          <button
            type="button"
            className="button button--primary"
            disabled={product.stockQty < 1 || addToCartMutation.isPending}
            onClick={handleAddToCart}
          >
            {product.stockQty < 1
              ? 'Out of stock'
              : addToCartMutation.isPending
                ? 'Adding...'
                : 'Add to cart'}
          </button>
        </div>
      </div>
    </section>
  )
}
