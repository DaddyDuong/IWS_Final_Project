const DEFAULTS = {
  page: 1,
  limit: 12,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const ALLOWED_SORT_BY = new Set(['createdAt', 'price', 'name'])
const ALLOWED_SORT_ORDER = new Set(['asc', 'desc'])

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

function parseBoolean(value) {
  if (value === true || value === 'true') {
    return true
  }

  if (value === false || value === 'false') {
    return false
  }

  return undefined
}

export function normalizeCatalogQuery(searchParams) {
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

  const q = parseText(searchParams.get('q'))
  const brand = parseText(searchParams.get('brand'))
  const cpu = parseText(searchParams.get('cpu'))
  const ram = parseIntValue(searchParams.get('ram'))
  const storage = parseIntValue(searchParams.get('storage'))
  const minPrice = parseIntValue(searchParams.get('minPrice'))
  const maxPrice = parseIntValue(searchParams.get('maxPrice'))
  const inStock = parseBoolean(searchParams.get('inStock'))

  if (q) query.q = q
  if (brand) query.brand = brand
  if (cpu) query.cpu = cpu
  if (ram && ram > 0) query.ram = ram
  if (storage && storage > 0) query.storage = storage
  if (typeof inStock === 'boolean') query.inStock = inStock

  if (minPrice !== undefined || maxPrice !== undefined) {
    const min = minPrice !== undefined ? Math.max(0, minPrice) : undefined
    const max = maxPrice !== undefined ? Math.max(0, maxPrice) : undefined

    if (min !== undefined && max !== undefined) {
      query.minPrice = Math.min(min, max)
      query.maxPrice = Math.max(min, max)
    } else {
      if (min !== undefined) query.minPrice = min
      if (max !== undefined) query.maxPrice = max
    }
  }

  return query
}

export function toCatalogSearchParams(query) {
  const params = new URLSearchParams()

  if (query.page > DEFAULTS.page) params.set('page', String(query.page))
  if (query.limit !== DEFAULTS.limit) params.set('limit', String(query.limit))
  if (query.sortBy !== DEFAULTS.sortBy) params.set('sortBy', query.sortBy)
  if (query.sortOrder !== DEFAULTS.sortOrder) params.set('sortOrder', query.sortOrder)
  if (query.q) params.set('q', query.q)
  if (query.brand) params.set('brand', query.brand)
  if (query.cpu) params.set('cpu', query.cpu)
  if (query.ram) params.set('ram', String(query.ram))
  if (query.storage) params.set('storage', String(query.storage))
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice))
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice))
  if (typeof query.inStock === 'boolean') params.set('inStock', String(query.inStock))

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

export function patchCatalogSearchParams(searchParams, patch) {
  const merged = new URLSearchParams(searchParams)

  for (const [key, value] of Object.entries(patch)) {
    if (shouldDeletePatchValue(value)) {
      merged.delete(key)
      continue
    }

    merged.set(key, String(value).trim())
  }

  return toCatalogSearchParams(normalizeCatalogQuery(merged))
}
