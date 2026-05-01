import { useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [draftQuantities, setDraftQuantities] = useState({})
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })

  const items = cartItems

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  function handleQuantityChange(itemId, nextValue) {
    setDraftQuantities((current) => ({
      ...current,
      [itemId]: nextValue,
    }))
  }

  function handleUpdate(itemId) {
    const item = cartItems.find((entry) => entry.id === itemId)
    const fallbackQuantity = item?.quantity ?? 1
    const nextQuantity = Number.parseInt(draftQuantities[itemId] ?? String(fallbackQuantity), 10)

    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      setFeedback({ message: 'Quantity must be at least 1.', type: 'error' })
      return
    }

    if (item && nextQuantity === item.quantity) {
      setFeedback({ message: 'Quantity is unchanged.', type: 'success' })
      return
    }

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
  }

  return (
    <section className="page page--customer" aria-labelledby="cart-title">
      <p className="eyebrow">Cart</p>
      <p className="step-label">Step 1 of 2</p>
      <h1 id="cart-title">Your cart</h1>

      <p className="catalog-feedback catalog-feedback--success" role="status" aria-live="polite">
        This cart is powered by mock data from <strong>mockData.js</strong>, so you can edit quantities and remove items without the backend.
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
    </section>
  )
}
