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

  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [feedback, setFeedback] = useState(null)

  const cartItems = cartQuery.data?.items ?? []
  const addresses = addressesQuery.data?.items ?? []
  const effectiveSelectedAddressId = selectedAddressId
    || addresses.find((address) => address.isDefault)?.id
    || addresses[0]?.id
    || ''

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  async function handlePlaceOrder() {
    if (!effectiveSelectedAddressId) {
      setFeedback({ variant: 'error', title: 'Address required', message: 'Select a shipping address to continue.' })
      return
    }

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
    </section>
  )
}
