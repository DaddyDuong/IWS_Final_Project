import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchOrders } from '../lib/customerApi'
import { currencyFormatter, dateTimeFormatter, formatApiError } from '../lib/formatters'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 5
const DEFAULT_SORT_BY = 'placedAt'
const DEFAULT_SORT_ORDER = 'desc'

const allowedSortBy = new Set(['placedAt', 'total', 'status'])
const allowedSortOrder = new Set(['asc', 'desc'])
const allowedStatus = new Set(['pending', 'processing', 'shipped', 'delivered', 'canceled'])

function parseInteger(value) {
  if (value === null || value === undefined) {
    return undefined
  }

  if (!/^\d+$/.test(String(value).trim())) {
    return undefined
  }

  return Number.parseInt(String(value).trim(), 10)
}

function parseText(value) {
  if (value === null || value === undefined) {
    return undefined
  }

  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : undefined
}

function buildOrdersQuery(searchParams) {
  const page = parseInteger(searchParams.get('page'))
  const limit = parseInteger(searchParams.get('limit'))
  const sortBy = parseText(searchParams.get('sortBy'))
  const sortOrder = parseText(searchParams.get('sortOrder'))
  const status = parseText(searchParams.get('status'))
  const from = parseText(searchParams.get('from'))
  const to = parseText(searchParams.get('to'))
  const minTotal = parseInteger(searchParams.get('minTotal'))
  const maxTotal = parseInteger(searchParams.get('maxTotal'))

  const query = {
    page: page && page > 0 ? page : DEFAULT_PAGE,
    limit: limit && limit > 0 && limit <= 100 ? limit : DEFAULT_LIMIT,
    sortBy: allowedSortBy.has(sortBy) ? sortBy : DEFAULT_SORT_BY,
    sortOrder: allowedSortOrder.has(sortOrder) ? sortOrder : DEFAULT_SORT_ORDER,
  }

  if (status && allowedStatus.has(status)) {
    query.status = status
  }

  if (from) {
    query.from = from
  }

  if (to) {
    query.to = to
  }

  if (minTotal !== undefined) {
    query.minTotal = minTotal
  }

  if (maxTotal !== undefined) {
    query.maxTotal = maxTotal
  }

  return query
}

function buildSearchParamsFromOrdersQuery(query) {
  const nextParams = new URLSearchParams()

  if (query.page > DEFAULT_PAGE) {
    nextParams.set('page', String(query.page))
  }

  if (query.limit !== DEFAULT_LIMIT) {
    nextParams.set('limit', String(query.limit))
  }

  if (query.sortBy !== DEFAULT_SORT_BY) {
    nextParams.set('sortBy', query.sortBy)
  }

  if (query.sortOrder !== DEFAULT_SORT_ORDER) {
    nextParams.set('sortOrder', query.sortOrder)
  }

  if (query.status) {
    nextParams.set('status', query.status)
  }

  if (query.from) {
    nextParams.set('from', query.from)
  }

  if (query.to) {
    nextParams.set('to', query.to)
  }

  if (query.minTotal !== undefined) {
    nextParams.set('minTotal', String(query.minTotal))
  }

  if (query.maxTotal !== undefined) {
    nextParams.set('maxTotal', String(query.maxTotal))
  }

  return nextParams
}

function shouldDropValue(value) {
  if (value === undefined || value === null) {
    return true
  }

  if (typeof value === 'string' && value.trim() === '') {
    return true
  }

  return false
}

function updateOrdersSearchParams(baseSearchParams, patch) {
  const mergedParams = new URLSearchParams(baseSearchParams)

  for (const [key, rawValue] of Object.entries(patch)) {
    if (shouldDropValue(rawValue)) {
      mergedParams.delete(key)
      continue
    }

    mergedParams.set(key, String(rawValue).trim())
  }

  const sanitizedQuery = buildOrdersQuery(mergedParams)
  return buildSearchParamsFromOrdersQuery(sanitizedQuery)
}

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => buildOrdersQuery(searchParams), [searchParams])

  useEffect(() => {
    const canonicalParams = buildSearchParamsFromOrdersQuery(query)
    if (canonicalParams.toString() !== searchParams.toString()) {
      setSearchParams(canonicalParams, { replace: true })
    }
  }, [query, searchParams, setSearchParams])

  const ordersQuery = useQuery({
    queryKey: ['orders', query],
    queryFn: () => fetchOrders(query),
    placeholderData: (previousData) => previousData,
  })

  const ordersPayload = ordersQuery.data
  const orders = Array.isArray(ordersPayload)
    ? ordersPayload
    : ordersPayload?.items || []
  const meta = Array.isArray(ordersPayload)
    ? {
        page: 1,
        limit: orders.length,
        total: orders.length,
        totalPages: orders.length > 0 ? 1 : 0,
      }
    : ordersPayload?.meta || {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 0,
      }

  function updateQuery(patch) {
    const nextParams = updateOrdersSearchParams(searchParams, patch)
    setSearchParams(nextParams, { replace: true })
  }

  const selectedSort = `${query.sortBy}:${query.sortOrder}`
  const hasPrevious = meta.page > 1
  const hasNext = meta.page < meta.totalPages

  return (
    <section className="page page--customer account-page" aria-labelledby="orders-title">
      <p className="eyebrow">Orders</p>
      <h1 id="orders-title">Order history</h1>

      <form
        className="product-filters"
        aria-label="Order filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="filter-row">
          <label className="filter-field" htmlFor="orders-status">
            Status
            <select
              id="orders-status"
              value={query.status || ''}
              onChange={(event) => updateQuery({ status: event.target.value || undefined, page: 1 })}
            >
              <option value="">All statuses</option>
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="canceled">canceled</option>
            </select>
          </label>

          <label className="filter-field" htmlFor="orders-from">
            From (ISO)
            <input
              id="orders-from"
              type="text"
              placeholder="2026-01-01T00:00:00.000Z"
              value={query.from || ''}
              onChange={(event) => updateQuery({ from: event.target.value, page: 1 })}
            />
          </label>

          <label className="filter-field" htmlFor="orders-to">
            To (ISO)
            <input
              id="orders-to"
              type="text"
              placeholder="2026-12-31T23:59:59.999Z"
              value={query.to || ''}
              onChange={(event) => updateQuery({ to: event.target.value, page: 1 })}
            />
          </label>

          <label className="filter-field" htmlFor="orders-limit">
            Per page
            <select
              id="orders-limit"
              value={query.limit}
              onChange={(event) => updateQuery({ limit: event.target.value, page: 1 })}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </label>
        </div>

        <div className="filter-row filter-row--footer">
          <label className="filter-field" htmlFor="orders-sort">
            Sort by
            <select
              id="orders-sort"
              value={selectedSort}
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
              <option value="status:desc">Status Z-A</option>
            </select>
          </label>

          <label className="filter-field" htmlFor="orders-min-total">
            Min total
            <input
              id="orders-min-total"
              type="number"
              min="0"
              value={query.minTotal ?? ''}
              onChange={(event) => updateQuery({ minTotal: event.target.value, page: 1 })}
            />
          </label>

          <label className="filter-field" htmlFor="orders-max-total">
            Max total
            <input
              id="orders-max-total"
              type="number"
              min="0"
              value={query.maxTotal ?? ''}
              onChange={(event) => updateQuery({ maxTotal: event.target.value, page: 1 })}
            />
          </label>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setSearchParams(new URLSearchParams(), { replace: true })
            }}
          >
            Reset filters
          </button>
        </div>
      </form>

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
        <>
          <ul className="order-list">
            {orders.map((order) => (
              <li key={order.id}>
                <article className="customer-card account-card">
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

          <div className="pagination-bar" aria-live="polite">
            <button
              type="button"
              className="button button--secondary"
              disabled={!hasPrevious || ordersQuery.isFetching}
              onClick={() => updateQuery({ page: meta.page - 1 })}
            >
              Previous
            </button>
            <p>
              Page {meta.page} of {Math.max(meta.totalPages, 1)} ({meta.total} results)
              {ordersQuery.isFetching ? ' - Updating…' : ''}
            </p>
            <button
              type="button"
              className="button button--secondary"
              disabled={!hasNext || ordersQuery.isFetching}
              onClick={() => updateQuery({ page: meta.page + 1 })}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}
