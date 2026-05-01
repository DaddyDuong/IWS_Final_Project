import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertBox } from '../components/shared/AlertBox'
import { StateBlock } from '../components/shared/StateBlock'
import { useCartMutations, useCartQuery } from '../hooks/useDomainData'
import { formatMoney } from '../utils/format'
import styles from './CartPage.module.css'

export function CartPage() {
  const cartQuery = useCartQuery()
  const { updateMutation, removeMutation } = useCartMutations()

  const [draftQuantities, setDraftQuantities] = useState({})
  const [feedback, setFeedback] = useState(null)

  const items = cartQuery.data?.items ?? []

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  function getDraftQuantity(item) {
    return draftQuantities[item.id] ?? item.quantity
  }

  async function handleUpdate(item) {
    const nextQuantity = Number(getDraftQuantity(item))

    if (nextQuantity === item.quantity) {
      setFeedback({
        variant: 'error',
        title: 'Quantity unchanged',
        message: 'Choose a different quantity before updating.',
      })
      return
    }

    setFeedback(null)

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
  }

  return (
    <section className={styles.pageSection}>
      <header className="pageHeader">
        <h1 className="pageTitle">Your cart</h1>
        <p className="pageSubtitle">Review quantity, update cart lines, and continue to checkout.</p>
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
        <StateBlock
          isLoading={cartQuery.isLoading}
          isError={cartQuery.isError}
          error={cartQuery.error}
          isEmpty={!items.length}
          emptyTitle="Your cart is empty"
          emptyMessage="Browse products and add your first item to continue checkout."
          loadingText="Loading cart items..."
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
    </section>
  )
}
