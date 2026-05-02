import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
<<<<<<< HEAD
import { useCartMutations, useProductQuery } from '../hooks/useDomainData'
import { formatMoney } from '../utils/format'
import { AlertBox } from '../components/shared/AlertBox'
import { StateBlock } from '../components/shared/StateBlock'
import { ReviewsPanel } from '../components/product/ReviewsPanel'
import styles from './ProductDetailPage.module.css'
=======
import { mockProducts } from '../lib/mockData'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

async function fetchProductById(productId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const product = mockProducts.find((p) => p.id === productId)
      resolve(product)
    }, 500)
  })
}
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c

export function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
<<<<<<< HEAD
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState(null)
=======
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })
  const [activeImageIndex, setActiveImageIndex] = useState(0)
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c

  const productQuery = useProductQuery(productId)
  const { addMutation } = useCartMutations()

  const product = productQuery.data
  const safeProduct = product ?? {
    id: '',
    name: '',
    brand: '',
    price: 0,
    stockQty: 0,
    description: '',
    imageUrl: '',
    cpu: '',
    ramGb: 0,
    storageGb: 0,
    screenSize: '',
  }

  async function handleAddToCart() {
    if (!product) {
      return
    }

    if (!token) {
      navigate('/auth', { replace: true, state: { from: location.pathname } })
      return
    }

    setFeedback(null)

    await addMutation.mutateAsync({ productId: product.id, quantity: Number(quantity) }, {
      onSuccess: () => {
        setFeedback({ variant: 'success', title: 'Added to cart', message: `${product.name} was added to your cart.` })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Unable to add item', message: 'Please check stock or try again shortly.' })
      },
    })
  }

  return (
<<<<<<< HEAD
    <section className={styles.pageSection}>
      <Link to="/shop" className={styles.backLink}>← Back to catalog</Link>
=======
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
            <div className="thumbnail-list">
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  className={`thumbnail-btn ${activeImageIndex === index ? 'active' : ''}`}
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={product.imageUrl} alt={`${product.name} thumbnail ${index + 1}`} />
                </button>
              ))}
            </div>
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
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c

      <StateBlock
        isLoading={productQuery.isLoading}
        isError={productQuery.isError}
        error={productQuery.error}
        isEmpty={!product}
        emptyTitle="Product unavailable"
        emptyMessage="This item is no longer available."
        loadingText="Loading product details..."
      >
        <section className={styles.productLayout}>
            <div className={`${styles.mediaPanel} panel`}>
            <img src={safeProduct.imageUrl} alt={safeProduct.name} className={styles.heroImage} />

<<<<<<< HEAD
            <div className={styles.specTiles}>
              <article>
                <h4>CPU</h4>
                <p>{safeProduct.cpu}</p>
              </article>
              <article>
                <h4>RAM</h4>
                <p>{safeProduct.ramGb} GB</p>
              </article>
              <article>
                <h4>Storage</h4>
                <p>{safeProduct.storageGb} GB SSD</p>
              </article>
              <article>
                <h4>Screen</h4>
                <p>{safeProduct.screenSize}"</p>
              </article>
            </div>
=======
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
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
          </div>

<<<<<<< HEAD
          <aside className={`${styles.purchasePanel} panel`}>
            <span className={safeProduct.stockQty > 0 ? 'badge badgeSuccess' : 'badge badgeError'}>
              {safeProduct.stockQty > 0 ? 'In stock' : 'Out of stock'}
            </span>
            <h1>{safeProduct.name}</h1>
            <p className="pageSubtitle">{safeProduct.brand}</p>
            <p className={styles.price}>{formatMoney(safeProduct.price)}</p>
            <p>{safeProduct.description}</p>

            <label className="field">
              <span className="fieldLabel">Quantity</span>
              <input
                type="number"
                min="1"
                max={Math.max(1, safeProduct.stockQty)}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>

            <div className="inlineActions">
              <button
                type="button"
                className="primaryButton"
                onClick={handleAddToCart}
                disabled={safeProduct.stockQty < 1 || addMutation.isPending}
              >
                {addMutation.isPending ? 'Adding...' : 'Add to cart'}
              </button>
              <Link to="/cart" className="secondaryButton">Go to cart</Link>
            </div>

            {feedback ? (
              <AlertBox
                variant={feedback.variant}
                title={feedback.title}
                message={feedback.message}
                onClose={() => setFeedback(null)}
              />
            ) : null}
          </aside>
        </section>

        <section className="panel">
          <ReviewsPanel productId={safeProduct.id} />
        </section>
      </StateBlock>
=======
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
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
    </section>
  )
}
