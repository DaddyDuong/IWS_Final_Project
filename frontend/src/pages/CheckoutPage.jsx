<<<<<<< HEAD
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertBox } from '../components/shared/AlertBox'
import { StateBlock } from '../components/shared/StateBlock'
import { useAddressesQuery, useCartQuery, useOrdersMutations } from '../hooks/useDomainData'
import { formatMoney } from '../utils/format'
import styles from './CheckoutPage.module.css'

function buildAddressLabel(address) {
  return `${address.line1}, ${address.ward}, ${address.district}, ${address.city}`
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const cartQuery = useCartQuery()
  const addressesQuery = useAddressesQuery()
  const { checkoutMutation } = useOrdersMutations(null)

=======
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { currencyFormatter } from '../lib/formatters'
import { mockAddresses, mockCartItems, mockProducts } from '../lib/mockData'

export function CheckoutPage() {
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [feedback, setFeedback] = useState(null)

<<<<<<< HEAD
  const cartItems = cartQuery.data?.items ?? []
  const addresses = addressesQuery.data?.items ?? []
  const effectiveSelectedAddressId = selectedAddressId
    || addresses.find((address) => address.isDefault)?.id
    || addresses[0]?.id
    || ''

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
=======
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
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c

  async function handlePlaceOrder() {
    if (!effectiveSelectedAddressId) {
      setFeedback({ variant: 'error', title: 'Address required', message: 'Select a shipping address to continue.' })
      return
    }

<<<<<<< HEAD
    setFeedback(null)

    await checkoutMutation.mutateAsync(effectiveSelectedAddressId, {
      onSuccess: (order) => {
        setFeedback({ variant: 'success', title: 'Order placed', message: 'Your order was created successfully.' })
        navigate(`/account/orders/${order.id}`)
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Checkout failed', message: 'Unable to place order. Please try again.' })
      },
    })
=======
    const address = addresses.find((entry) => entry.id === effectiveSelectedAddressId)
    setFeedback(
      `Mock order placed for ${address?.receiver ?? 'your selected address'}. This checkout is powered by mockData.js.`
    )
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
  }

  return (
    <section className={styles.pageSection}>
      <header className="pageHeader">
        <h1 className="pageTitle">Checkout</h1>
        <p className="pageSubtitle">Select your shipping address and place your order.</p>
      </header>

      {feedback ? (
        <AlertBox
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      ) : null}

<<<<<<< HEAD
      <div className={styles.layout}>
        <section className="panel">
          <StateBlock
            isLoading={cartQuery.isLoading || addressesQuery.isLoading}
            isError={cartQuery.isError || addressesQuery.isError}
            error={cartQuery.error ?? addressesQuery.error}
            isEmpty={false}
            loadingText="Loading cart and addresses..."
          >
            {!cartItems.length ? (
              <section className={styles.emptyCard}>
                <h3>Your cart is empty</h3>
                <p>Add products before starting checkout.</p>
                <Link to="/shop" className="secondaryButton">Browse products</Link>
              </section>
            ) : null}

            {!!cartItems.length && !addresses.length ? (
              <section className={styles.emptyCard}>
                <h3>No saved addresses</h3>
                <p>Add a shipping address before placing your order.</p>
                <Link to="/account/addresses" className="secondaryButton">Add address</Link>
              </section>
            ) : null}

            {!!cartItems.length && !!addresses.length ? (
              <div className={styles.addressList}>
                {addresses.map((address) => {
                  const selected = effectiveSelectedAddressId === address.id

                  return (
                    <article key={address.id} className={`${styles.addressCard} ${selected ? styles.selected : ''}`.trim()}>
                      <label className={styles.selector}>
                        <input
                          type="radio"
                          name="shipping-address"
                          checked={selected}
                          onChange={() => setSelectedAddressId(address.id)}
                        />
                        <span>
                          <strong>{address.receiver}</strong>
                          <span>{buildAddressLabel(address)}</span>
                          <span>{address.phone}</span>
                        </span>
                      </label>
                      <div className="inlineActions">
                        {address.isDefault ? <span className="badge badgeSuccess">Default</span> : null}
                        <Link to="/account/addresses" className="secondaryButton">Edit</Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : null}
          </StateBlock>
        </section>

        <aside className={`${styles.summaryPanel} panel`}>
          <h2>Order summary</h2>
          <div className={styles.itemsSummary}>
            {cartItems.map((item) => (
              <article key={item.id} className={styles.summaryRow}>
                <img src={item.product.imageUrl} alt={item.product.name} />
                <div>
                  <p>{item.product.name}</p>
                  <p className="mutedText">Qty: {item.quantity}</p>
                </div>
                <p>{formatMoney(item.product.price * item.quantity)}</p>
              </article>
            ))}
=======
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
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
          </div>

          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>FREE</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatMoney(subtotal)}</dd>
            </div>
          </dl>

<<<<<<< HEAD
          <button
            type="button"
            className="primaryButton"
            onClick={handlePlaceOrder}
            disabled={!cartItems.length || !addresses.length || checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? 'Placing order...' : 'Place order'}
          </button>
        </aside>
      </div>
=======
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
>>>>>>> 8633106a76b27636b43164c85c26e5b3d9c0b07c
    </section>
  )
}
