import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AccountSidebar } from '../components/layout/AccountSidebar'
import { Pagination } from '../components/shared/Pagination'
import { StateBlock } from '../components/shared/StateBlock'
import { useAuthStore } from '../stores/authStore'
import { useOrdersQuery } from '../hooks/useDomainData'
import { formatDateTime, formatMoney, toSlugLabel } from '../utils/format'
import {
  normalizeOrdersQuery,
  patchOrdersSearchParams,
  toOrdersSearchParams,
} from '../utils/query/ordersQuery'
import styles from './OrdersPage.module.css'

function statusBadgeClass(status) {
  if (status === 'delivered') return 'badge badgeSuccess'
  if (status === 'canceled') return 'badge badgeError'
  if (status === 'processing' || status === 'shipped') return 'badge badgeWarning'
  return 'badge'
}

export function OrdersPage() {
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()

  const query = useMemo(() => normalizeOrdersQuery(searchParams), [searchParams])

  useEffect(() => {
    const canonical = toOrdersSearchParams(query)
    if (canonical.toString() !== searchParams.toString()) {
      setSearchParams(canonical, { replace: true })
    }
  }, [query, searchParams, setSearchParams])

  const ordersQuery = useOrdersQuery(query)
  const orders = ordersQuery.data?.items ?? []
  const meta = ordersQuery.data?.meta ?? { page: 1, totalPages: 0, total: 0 }

  function updateQuery(patch) {
    const nextParams = patchOrdersSearchParams(searchParams, patch)
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <section className={styles.layout}>
      <AccountSidebar isManager={user?.role === 'manager'} />

      <div className={styles.content}>
        <header className="pageHeader">
          <h1 className="pageTitle">Order history</h1>
          <p className="pageSubtitle">Filter and review all your previous purchases.</p>
        </header>

        <form className="panel" onSubmit={(event) => event.preventDefault()}>
          <div className="fieldGrid">
            <label className="field">
              <span className="fieldLabel">Status</span>
              <select value={query.status ?? ''} onChange={(event) => updateQuery({ status: event.target.value || undefined, page: 1 })}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="canceled">Canceled</option>
              </select>
            </label>

            <label className="field">
              <span className="fieldLabel">From</span>
              <input type="date" value={query.from ?? ''} onChange={(event) => updateQuery({ from: event.target.value, page: 1 })} />
            </label>

            <label className="field">
              <span className="fieldLabel">To</span>
              <input type="date" value={query.to ?? ''} onChange={(event) => updateQuery({ to: event.target.value, page: 1 })} />
            </label>

            <label className="field">
              <span className="fieldLabel">Sort by</span>
              <select
                value={`${query.sortBy}:${query.sortOrder}`}
                onChange={(event) => {
                  const [sortBy, sortOrder] = event.target.value.split(':')
                  updateQuery({ sortBy, sortOrder, page: 1 })
                }}
              >
                <option value="placedAt:desc">Newest first</option>
                <option value="placedAt:asc">Oldest first</option>
                <option value="total:desc">Highest total</option>
                <option value="total:asc">Lowest total</option>
                <option value="status:asc">Status A-Z</option>
              </select>
            </label>

            <label className="field">
              <span className="fieldLabel">Min total</span>
              <input type="number" min="0" value={query.minTotal ?? ''} onChange={(event) => updateQuery({ minTotal: event.target.value, page: 1 })} />
            </label>

            <label className="field">
              <span className="fieldLabel">Max total</span>
              <input type="number" min="0" value={query.maxTotal ?? ''} onChange={(event) => updateQuery({ maxTotal: event.target.value, page: 1 })} />
            </label>
          </div>

          <div className={styles.filterActions}>
            <button type="button" className="secondaryButton" onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}>
              Reset filters
            </button>
          </div>
        </form>

        <StateBlock
          isLoading={ordersQuery.isLoading}
          isError={ordersQuery.isError}
          error={ordersQuery.error}
          isEmpty={!orders.length}
          emptyTitle="No orders found"
          emptyMessage="Try changing filters or place your first order."
          loadingText="Loading latest orders..."
        >
          <section className={styles.list}>
            {orders.map((order) => (
              <article key={order.id} className={styles.orderCard}>
                <div>
                  <p className={styles.orderId}>Order #{order.id.slice(0, 8)}</p>
                  <p className="mutedText">Placed on {formatDateTime(order.placedAt)}</p>
                </div>

                <span className={statusBadgeClass(order.status)}>{toSlugLabel(order.status)}</span>
                <p className={styles.total}>{formatMoney(order.total)}</p>
                <Link to={`/account/orders/${order.id}`} className="secondaryButton">View details</Link>
              </article>
            ))}
          </section>

          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={(page) => updateQuery({ page })} />
        </StateBlock>
      </div>
    </section>
  )
}
