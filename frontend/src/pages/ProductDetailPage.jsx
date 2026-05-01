import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCartMutations, useProductQuery } from '../hooks/useDomainData'
import { formatMoney } from '../utils/format'
import { AlertBox } from '../components/shared/AlertBox'
import { StateBlock } from '../components/shared/StateBlock'
import { ReviewsPanel } from '../components/product/ReviewsPanel'
import styles from './ProductDetailPage.module.css'

export function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState(null)

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
    <section className={styles.pageSection}>
      <Link to="/shop" className={styles.backLink}>← Back to catalog</Link>

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
          </div>

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
    </section>
  )
}
