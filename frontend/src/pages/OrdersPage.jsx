import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchOrders } from '../lib/customerApi'
import { currencyFormatter, dateTimeFormatter, formatApiError } from '../lib/formatters'

export function OrdersPage() {
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  })

  const orders = ordersQuery.data || []

  return (
    <section className="page page--customer" aria-labelledby="orders-title">
      <p className="eyebrow">Orders</p>
      <h1 id="orders-title">Order history</h1>

      {ordersQuery.isLoading ? <p>Loading orders...</p> : null}

      {ordersQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(ordersQuery.error, 'Unable to load order history right now.')}
        </p>
      ) : null}

      {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 ? (
        <div className="catalog-feedback">
          <p>You have not placed any orders yet.</p>
          <div className="cta-row">
            <Link className="button button--secondary" to="/products">
              Start shopping
            </Link>
          </div>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.id}>
              <article className="customer-card">
                <div className="order-row">
                  <h2>Order #{order.id.slice(0, 8)}</h2>
                  <span className="order-status">{order.status}</span>
                </div>
                <p>Placed at: {dateTimeFormatter.format(new Date(order.placedAt))}</p>
                <p>{order.items.length} item(s)</p>
                <p>
                  Total: <strong>{currencyFormatter.format(order.total)}</strong>
                </p>
                <Link className="button button--secondary" to={`/profile/orders/${order.id}`}>
                  View details
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
