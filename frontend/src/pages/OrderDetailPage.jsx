import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { cancelOrder, fetchOrderById } from '../lib/customerApi'
import { currencyFormatter, dateTimeFormatter, formatApiError } from '../lib/formatters'

const cancellableStatuses = new Set(['pending', 'processing'])

export function OrderDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrderById(id),
    enabled: Boolean(id),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  if (orderQuery.isLoading) {
    return (
      <section className="page page--customer" aria-labelledby="order-detail-title">
        <h1 id="order-detail-title">Order details</h1>
        <p>Loading order details...</p>
      </section>
    )
  }

  if (orderQuery.isError) {
    return (
      <section className="page page--customer" aria-labelledby="order-detail-title">
        <h1 id="order-detail-title">Order details</h1>
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(orderQuery.error, 'Unable to load this order right now.')}
        </p>
        <Link className="button button--secondary" to="/profile/orders">
          Back to order history
        </Link>
      </section>
    )
  }

  const order = orderQuery.data

  if (!order) {
    return (
      <section className="page page--customer" aria-labelledby="order-detail-title">
        <h1 id="order-detail-title">Order details</h1>
        <p className="catalog-feedback catalog-feedback--error">Order details are unavailable.</p>
        <Link className="button button--secondary" to="/profile/orders">
          Back to order history
        </Link>
      </section>
    )
  }

  const canCancel = cancellableStatuses.has(order.status)

  function handleCancel(orderId) {
    const confirmed = globalThis.confirm('Are you sure you want to cancel this order?')
    if (!confirmed) {
      return
    }

    cancelMutation.mutate(orderId)
  }

  return (
    <section className="page page--customer" aria-labelledby="order-detail-title">
      <p className="eyebrow">Order</p>
      <h1 id="order-detail-title">Order #{order.id.slice(0, 8)}</h1>

      <div className="order-detail-meta">
        <p>Status: {order.status}</p>
        <p>Placed at: {dateTimeFormatter.format(new Date(order.placedAt))}</p>
      </div>

      <article className="customer-card">
        <h2>Shipping address</h2>
        <p>{order.address.receiver}</p>
        <p>{order.address.phone}</p>
        <p>
          {order.address.line1}, {order.address.ward}, {order.address.district}, {order.address.city}
        </p>
      </article>

      <article className="customer-card">
        <h2>Items</h2>
        <ul className="order-item-list">
          {order.items.map((item) => (
            <li key={item.id} className="order-item-row">
              <img src={item.product.imageUrl} alt={item.product.name} width="96" height="72" />
              <div>
                <p>{item.product.name}</p>
                <p className="product-specs">Qty: {item.quantity}</p>
              </div>
              <strong>{currencyFormatter.format(item.lineTotal)}</strong>
            </li>
          ))}
        </ul>
      </article>

      <article className="customer-card order-totals">
        <p>Subtotal: {currencyFormatter.format(order.subtotal)}</p>
        <p>Shipping fee: {currencyFormatter.format(order.shippingFee)}</p>
        <p>
          Total: <strong>{currencyFormatter.format(order.total)}</strong>
        </p>
      </article>

      {cancelMutation.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(cancelMutation.error, 'Unable to cancel this order.')}
        </p>
      ) : null}

      <div className="cta-row">
        <Link className="button button--secondary" to="/profile/orders">
          Back to order history
        </Link>
        {canCancel ? (
          <button
            type="button"
            className="button button--secondary"
            onClick={() => handleCancel(order.id)}
            disabled={cancelMutation.isPending}
          >
            Cancel order
          </button>
        ) : null}
      </div>
    </section>
  )
}
