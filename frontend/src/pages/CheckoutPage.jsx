import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { currencyFormatter } from '../lib/formatters'
import { mockAddresses, mockCartItems, mockProducts } from '../lib/mockData'

export function CheckoutPage() {
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [feedback, setFeedback] = useState('')

  const addresses = mockAddresses
  const items = useMemo(
    () =>
      mockCartItems
        .map((item) => {
          const product = mockProducts.find((entry) => entry.id === item.productId)
          return product ? { ...item, product } : null
        })
        .filter(Boolean),
    []
  )
  const defaultAddressId = addresses.find((address) => address.isDefault)?.id || addresses[0]?.id || ''
  const effectiveSelectedAddressId =
    addresses.some((address) => address.id === selectedAddressId) ? selectedAddressId : defaultAddressId

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const shippingFee = 0
  const grandTotal = subtotal + shippingFee

  function handleSubmit(event) {
    event.preventDefault()

    if (!effectiveSelectedAddressId) {
      setFeedback('Please choose a shipping address.')
      return
    }

    const address = addresses.find((entry) => entry.id === effectiveSelectedAddressId)
    setFeedback(
      `Mock order placed for ${address?.receiver ?? 'your selected address'}. This checkout is powered by mockData.js.`
    )
  }

  return (
    <section className="page page--customer" aria-labelledby="checkout-title">
      <p className="eyebrow">Checkout</p>
      <p className="step-label">Step 2 of 2</p>
      <h1 id="checkout-title">Checkout</h1>

      {feedback ? (
        <p className="catalog-feedback catalog-feedback--error" role="alert" aria-live="assertive">
          {feedback}
        </p>
      ) : null}

      <p className="catalog-feedback catalog-feedback--success" role="status" aria-live="polite">
        This checkout is powered by mock data from <strong>mockData.js</strong> so you can test the UI offline.
      </p>

      {items.length === 0 ? (
        <div className="catalog-feedback">
          <p>Your cart is empty. Add items before checkout.</p>
          <div className="cta-row">
            <Link className="button button--secondary" to="/products">
              Browse products
            </Link>
          </div>
        </div>
      ) : null}

      {items.length > 0 ? (
        <form className="checkout-grid" onSubmit={handleSubmit}>
          <section className="checkout-card" aria-label="Shipping address">
            <h2>Shipping address</h2>

            {addresses.length === 0 ? (
              <div className="catalog-feedback">
                <p>No saved addresses yet.</p>
                <Link className="button button--secondary" to="/profile/addresses">
                  Add address
                </Link>
              </div>
            ) : (
              <div className="address-options">
                {addresses.map((address) => (
                  <label key={address.id} className="address-option">
                    <input
                      type="radio"
                      name="addressId"
                      value={address.id}
                      checked={effectiveSelectedAddressId === address.id}
                      onChange={(event) => setSelectedAddressId(event.target.value)}
                    />
                    <span>
                      <strong>{address.receiver}</strong>
                      <span>{address.phone}</span>
                      <span>
                        {address.line1}, {address.ward}, {address.district}, {address.city}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <aside className="checkout-card checkout-card--summary" aria-label="Order summary">
            <div className="checkout-summary__header">
              <div>
                <p className="checkout-summary__eyebrow">Order summary</p>
                <h2>Review your items</h2>
              </div>
              <span className="checkout-summary__badge">{totalItems} items</span>
            </div>

            <div className="checkout-summary__items" aria-label="Items in your order">
              {items.map((item) => (
                <div key={item.id} className="checkout-summary__item">
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>Qty {item.quantity}</span>
                  </div>
                  <strong>{currencyFormatter.format(item.product.price * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="checkout-summary__totals">
              <div>
                <span>Subtotal</span>
                <strong>{currencyFormatter.format(subtotal)}</strong>
              </div>
              <div>
                <span>Shipping fee</span>
                <strong>{shippingFee === 0 ? 'Free' : currencyFormatter.format(shippingFee)}</strong>
              </div>
              <div className="checkout-summary__grand-total">
                <span>Total</span>
                <strong>{currencyFormatter.format(grandTotal)}</strong>
              </div>
            </div>

            <button
              type="submit"
              className="button button--primary"
              disabled={items.length === 0 || addresses.length === 0}
            >
              Place order
            </button>
          </aside>
        </form>
      ) : null}
    </section>
  )
}
