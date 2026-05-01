import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AccountSidebar } from '../components/layout/AccountSidebar'
import { AlertBox } from '../components/shared/AlertBox'
import { StateBlock } from '../components/shared/StateBlock'
import { useAuthStore } from '../stores/authStore'
import { useOrderQuery, useOrdersMutations } from '../hooks/useDomainData'
import { formatDateTime, formatMoney, toSlugLabel } from '../utils/format'
import styles from './OrderDetailPage.module.css'

const CANCELLABLE_STATUSES = new Set(['pending', 'processing'])

export function OrderDetailPage() {
  const { id } = useParams()
  const user = useAuthStore((state) => state.user)
  const [feedback, setFeedback] = useState(null)

  const orderQuery = useOrderQuery(id)
  const { cancelMutation } = useOrdersMutations(id)

  const order = orderQuery.data
  const safeOrder = order ?? {
    id: '',
    status: '',
    placedAt: null,
    subtotal: 0,
    shippingFee: 0,
    total: 0,
    address: {
      receiver: '',
      phone: '',
      line1: '',
      ward: '',
      district: '',
      city: '',
    },
    items: [],
  }
  const canCancel = order ? CANCELLABLE_STATUSES.has(order.status) : false

  async function handleCancel() {
    if (!order) {
      return
    }

    setFeedback(null)

    await cancelMutation.mutateAsync(order.id, {
      onSuccess: () => {
        setFeedback({ variant: 'success', title: 'Order canceled', message: 'Your order has been canceled and stock was restored.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Unable to cancel order', message: 'This order may no longer be cancellable.' })
      },
    })
  }

  return (
    <section className={styles.layout}>
      <AccountSidebar isManager={user?.role === 'manager'} />

      <div className={styles.content}>
        <header className="pageHeader">
          <h1 className="pageTitle">Order details</h1>
          <p className="pageSubtitle">Review status, shipping destination, and item totals.</p>
        </header>

        {feedback ? (
          <AlertBox
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        ) : null}

        <StateBlock
          isLoading={orderQuery.isLoading}
          isError={orderQuery.isError}
          error={orderQuery.error}
          isEmpty={!order}
          emptyTitle="Order not found"
          emptyMessage="This order may have been removed or does not belong to your account."
          loadingText="Loading order details..."
        >
          <section className="panel">
            <div className={styles.metaGrid}>
                <article>
                  <p className="mutedText">Order</p>
                  <h3>#{safeOrder.id.slice(0, 8)}</h3>
                </article>
                <article>
                  <p className="mutedText">Status</p>
                  <h3>{toSlugLabel(safeOrder.status)}</h3>
                </article>
                <article>
                  <p className="mutedText">Placed on</p>
                  <h3>{formatDateTime(safeOrder.placedAt)}</h3>
                </article>
              </div>

            <AlertBox
              variant={canCancel ? 'info' : 'success'}
              title={canCancel ? 'Order in progress' : 'Order completed'}
              message={canCancel ? 'This order can still be canceled.' : 'This order can no longer be canceled.'}
            />
          </section>

          <section className="panel">
            <h2 className={styles.sectionTitle}>Shipping address</h2>
            <p>{safeOrder.address.receiver}</p>
            <p className="mutedText">{safeOrder.address.phone}</p>
            <p className="mutedText">
              {safeOrder.address.line1}, {safeOrder.address.ward}, {safeOrder.address.district}, {safeOrder.address.city}
            </p>
          </section>

          <section className="panel">
            <h2 className={styles.sectionTitle}>Items</h2>
            <div className={styles.itemsList}>
              {safeOrder.items.map((item) => (
                <article key={item.id} className={styles.itemRow}>
                  <img src={item.product.imageUrl} alt={item.product.name} />
                  <div>
                    <p className={styles.itemName}>{item.product.name}</p>
                    <p className="mutedText">Qty: {item.quantity}</p>
                  </div>
                  <p>{formatMoney(item.lineTotal)}</p>
                </article>
              ))}
            </div>

            <dl className={styles.totals}>
              <div><dt>Subtotal</dt><dd>{formatMoney(safeOrder.subtotal)}</dd></div>
              <div><dt>Shipping</dt><dd>{formatMoney(safeOrder.shippingFee)}</dd></div>
              <div><dt>Total</dt><dd>{formatMoney(safeOrder.total)}</dd></div>
            </dl>
          </section>

          <section className={styles.actions}>
            <Link to="/account/orders" className="secondaryButton">Back to order history</Link>
            <button
              type="button"
              className="ghostDangerButton"
              onClick={handleCancel}
              disabled={!canCancel || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Canceling...' : 'Cancel order'}
            </button>
          </section>
        </StateBlock>
      </div>
    </section>
  )
}
