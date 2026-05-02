import { useState } from 'react'
import { Link } from 'react-router-dom'
<<<<<<< HEAD
import { AlertBox } from '../components/shared/AlertBox'
import { StateBlock } from '../components/shared/StateBlock'
import { useCartMutations, useCartQuery } from '../hooks/useDomainData'
import { formatMoney } from '../utils/format'
import styles from './CartPage.module.css'

export function CartPage() {
  const cartQuery = useCartQuery()
  const { updateMutation, removeMutation } = useCartMutations()

=======
import { mockCartItems, mockProducts } from '../lib/mockData'
import { currencyFormatter, formatApiError } from '../lib/formatters'

export function CartPage() {
  const [cartItems, setCartItems] = useState(() =>
    mockCartItems
      .map((item) => {
        const product = mockProducts.find((entry) => entry.id === item.productId)
        return product ? { ...item, product } : null
      })
      .filter(Boolean)
  )
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
  const [draftQuantities, setDraftQuantities] = useState({})
  const [feedback, setFeedback] = useState(null)

<<<<<<< HEAD
  const items = cartQuery.data?.items ?? []
=======
  const items = cartItems
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  function getDraftQuantity(item) {
    return draftQuantities[item.id] ?? item.quantity
  }

<<<<<<< HEAD
  async function handleUpdate(item) {
    const nextQuantity = Number(getDraftQuantity(item))
=======
  function handleUpdate(itemId) {
    const item = cartItems.find((entry) => entry.id === itemId)
    const fallbackQuantity = item?.quantity ?? 1
    const nextQuantity = Number.parseInt(draftQuantities[itemId] ?? String(fallbackQuantity), 10)
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c

    if (nextQuantity === item.quantity) {
      setFeedback({
        variant: 'error',
        title: 'Quantity unchanged',
        message: 'Choose a different quantity before updating.',
      })
      return
    }

    setFeedback(null)

<<<<<<< HEAD
    await updateMutation.mutateAsync({ id: item.id, quantity: nextQuantity }, {
      onSuccess: () => {
        setFeedback({ variant: 'success', title: 'Cart updated', message: 'Item quantity updated successfully.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Update failed', message: 'Unable to update item quantity right now.' })
      },
    })
  }

  async function handleRemove(itemId) {
    setFeedback(null)

    await removeMutation.mutateAsync(itemId, {
      onSuccess: () => {
        setFeedback({ variant: 'success', title: 'Item removed', message: 'Item removed from your cart.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Remove failed', message: 'Unable to remove item right now.' })
      },
    })
=======
    setCartItems((current) =>
      current.map((entry) =>
        entry.id === itemId
          ? {
              ...entry,
              quantity: nextQuantity,
            }
          : entry
      )
    )
    setDraftQuantities({})
    setFeedback({ message: 'Cart item updated.', type: 'success' })
  }

  function handleRemove(itemId) {
    setCartItems((current) => current.filter((entry) => entry.id !== itemId))
    setDraftQuantities((current) => {
      const nextDraft = { ...current }
      delete nextDraft[itemId]
      return nextDraft
    })
    setFeedback({ message: 'Item removed from cart.', type: 'success' })
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
  }

  return (
    <section className={styles.pageSection}>
      <header className="pageHeader">
        <h1 className="pageTitle">Your cart</h1>
        <p className="pageSubtitle">Review quantity, update cart lines, and continue to checkout.</p>
      </header>

<<<<<<< HEAD
      {feedback ? (
        <AlertBox
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      ) : null}

      <div className={styles.layout}>
        <StateBlock
          isLoading={cartQuery.isLoading}
          isError={cartQuery.isError}
          error={cartQuery.error}
          isEmpty={!items.length}
          emptyTitle="Your cart is empty"
          emptyMessage="Browse products and add your first item to continue checkout."
          loadingText="Loading cart items..."
=======
      <p className="catalog-feedback catalog-feedback--success" role="status" aria-live="polite">
        This cart is powered by mock data from <strong>mockData.js</strong>, so you can edit quantities and remove items without the backend.
      </p>

      {feedback.message ? (
        <p
          className={`catalog-feedback ${feedback.type === 'error' ? 'catalog-feedback--error' : 'catalog-feedback--success'}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
        >
          <section className={styles.itemsPanel}>
            {items.map((item) => (
              <article key={item.id} className={styles.itemRow}>
                <img src={item.product.imageUrl} alt={item.product.name} className={styles.image} />
                <div className={styles.itemInfo}>
                  <h3>{item.product.name}</h3>
                  <p>{item.product.cpu} · {item.product.ramGb}GB · {item.product.storageGb}GB SSD</p>
                  <p className={item.product.stockQty > 0 ? 'badge badgeSuccess' : 'badge badgeError'}>
                    {item.product.stockQty > 0 ? 'In stock' : 'Out of stock'}
                  </p>
                </div>

<<<<<<< HEAD
                <div className={styles.controls}>
                  <label className="field">
                    <span className="fieldLabel">Quantity</span>
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, item.product.stockQty)}
                      value={getDraftQuantity(item)}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setDraftQuantities((previous) => ({ ...previous, [item.id]: value }))
                      }}
                    />
                  </label>
                  <div className="inlineActions">
                    <button type="button" className="secondaryButton" onClick={() => handleUpdate(item)}>
                      Update
                    </button>
                    <button type="button" className="ghostDangerButton" onClick={() => handleRemove(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>

                <p className={styles.price}>{formatMoney(item.product.price * item.quantity)}</p>
              </article>
            ))}
          </section>
        </StateBlock>

        <aside className={`${styles.summaryPanel} panel`}>
          <h2>Order summary</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>Calculated at checkout</dd>
            </div>
            <div>
              <dt>Estimated tax</dt>
              <dd>Calculated at checkout</dd>
            </div>
          </dl>
          <p className={styles.total}>Total {formatMoney(subtotal)}</p>

          <div className={styles.summaryActions}>
            {items.length > 0 ? (
              <Link to="/checkout" className="primaryButton">
                Continue to checkout
              </Link>
            ) : (
              <button type="button" className="primaryButton" disabled>
                Continue to checkout
              </button>
            )}
            <Link to="/shop" className="secondaryButton">Browse products</Link>
          </div>
        </aside>
      </div>
=======
      {items.length === 0 ? (
        <div className="catalog-feedback">
          <p>Your cart is empty.</p>
          <div className="cta-row">
            <Link className="button button--secondary" to="/products">
              Browse products
            </Link>
          </div>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="cart-list">
          {items.map((item) => (
            <article key={item.id} className="cart-item">
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className="cart-item__image"
                width="180"
                height="135"
              />

              <div className="cart-item__content">
                <div>
                  <h2>{item.product.name}</h2>
                  <p className="product-specs">{item.product.brand}</p>
                  <p>{currencyFormatter.format(item.product.price)}</p>
                </div>

                <div className="cart-item__actions">
                  <label htmlFor={`quantity-${item.id}`}>Quantity</label>
                  <input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="1"
                    max={999}
                    value={draftQuantities[item.id] ?? String(item.quantity)}
                    onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                  />
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleUpdate(item.id)}
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleRemove(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="checkout-summary">
          <p>Subtotal</p>
          <strong>{currencyFormatter.format(subtotal)}</strong>
          <Link className="button button--primary" to="/checkout">
            Continue to checkout
          </Link>
        </div>
      ) : null}
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
    </section>
  )
}
