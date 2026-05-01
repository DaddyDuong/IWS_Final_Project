const DEFAULTS = {
  page: 1,
  limit: 6,
  sortBy: 'placedAt',
  sortOrder: 'desc',
}

const ALLOWED_SORT_BY = new Set(['placedAt', 'total', 'status'])
const ALLOWED_SORT_ORDER = new Set(['asc', 'desc'])
const ALLOWED_STATUS = new Set(['pending', 'processing', 'shipped', 'delivered', 'canceled'])

function parseIntValue(value) {
  if (value == null) {
    return undefined
  }

  const normalized = String(value).trim()
  if (!/^\d+$/.test(normalized)) {
    return undefined
  }

  return Number.parseInt(normalized, 10)
}

function parseText(value) {
  if (value == null) {
    return undefined
  }

  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : undefined
}

export function normalizeOrdersQuery(searchParams) {
  const page = parseIntValue(searchParams.get('page'))
  const limit = parseIntValue(searchParams.get('limit'))
  const sortBy = parseText(searchParams.get('sortBy'))
  const sortOrder = parseText(searchParams.get('sortOrder'))

  const query = {
    page: page && page > 0 ? page : DEFAULTS.page,
    limit: limit && limit > 0 && limit <= 100 ? limit : DEFAULTS.limit,
    sortBy: ALLOWED_SORT_BY.has(sortBy) ? sortBy : DEFAULTS.sortBy,
    sortOrder: ALLOWED_SORT_ORDER.has(sortOrder) ? sortOrder : DEFAULTS.sortOrder,
  }

  const status = parseText(searchParams.get('status'))
  const from = parseText(searchParams.get('from'))
  const to = parseText(searchParams.get('to'))
  const minTotal = parseIntValue(searchParams.get('minTotal'))
  const maxTotal = parseIntValue(searchParams.get('maxTotal'))

  if (status && ALLOWED_STATUS.has(status)) query.status = status
  if (from) query.from = from
  if (to) query.to = to

  if (minTotal !== undefined || maxTotal !== undefined) {
    const min = minTotal !== undefined ? Math.max(0, minTotal) : undefined
    const max = maxTotal !== undefined ? Math.max(0, maxTotal) : undefined

    if (min !== undefined && max !== undefined) {
      query.minTotal = Math.min(min, max)
      query.maxTotal = Math.max(min, max)
    } else {
      if (min !== undefined) query.minTotal = min
      if (max !== undefined) query.maxTotal = max
    }
  }

  return query
}

export function toOrdersSearchParams(query) {
  const params = new URLSearchParams()

  if (query.page > DEFAULTS.page) params.set('page', String(query.page))
  if (query.limit !== DEFAULTS.limit) params.set('limit', String(query.limit))
  if (query.sortBy !== DEFAULTS.sortBy) params.set('sortBy', query.sortBy)
  if (query.sortOrder !== DEFAULTS.sortOrder) params.set('sortOrder', query.sortOrder)
  if (query.status) params.set('status', query.status)
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  if (query.minTotal !== undefined) params.set('minTotal', String(query.minTotal))
  if (query.maxTotal !== undefined) params.set('maxTotal', String(query.maxTotal))

  return params
}

function shouldDeletePatchValue(value) {
  if (value == null) {
    return true
  }

  if (typeof value === 'string' && value.trim() === '') {
    return true
  }

  return false
}

export function patchOrdersSearchParams(searchParams, patch) {
  const merged = new URLSearchParams(searchParams)

  for (const [key, value] of Object.entries(patch)) {
    if (shouldDeletePatchValue(value)) {
      merged.delete(key)
      continue
    }

    merged.set(key, String(value).trim())
  }

  return toOrdersSearchParams(normalizeOrdersQuery(merged))
}
