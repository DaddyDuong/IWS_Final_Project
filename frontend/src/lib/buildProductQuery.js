const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 12
const DEFAULT_SORT_BY = 'createdAt'
const DEFAULT_SORT_ORDER = 'desc'

const ALLOWED_SORT_BY = new Set(['createdAt', 'price', 'name'])
const ALLOWED_SORT_ORDER = new Set(['asc', 'desc'])

function parseInteger(value) {
  if (value === null || value === undefined) {
    return undefined
  }

  if (!/^\d+$/.test(String(value).trim())) {
    return undefined
  }

  return Number.parseInt(String(value).trim(), 10)
}

function parseString(value) {
  if (value === null || value === undefined) {
    return undefined
  }

  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : undefined
}

function parseBoolean(value) {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return undefined
}

export function buildProductQuery(searchParams) {
  const page = parseInteger(searchParams.get('page'))
  const limit = parseInteger(searchParams.get('limit'))
  const sortBy = parseString(searchParams.get('sortBy'))
  const sortOrder = parseString(searchParams.get('sortOrder'))
  const ram = parseInteger(searchParams.get('ram'))
  const storage = parseInteger(searchParams.get('storage'))
  const minPrice = parseInteger(searchParams.get('minPrice'))
  const maxPrice = parseInteger(searchParams.get('maxPrice'))

  const query = {
    page: page && page > 0 ? page : DEFAULT_PAGE,
    limit: limit && limit > 0 && limit <= 100 ? limit : DEFAULT_LIMIT,
    sortBy: ALLOWED_SORT_BY.has(sortBy) ? sortBy : DEFAULT_SORT_BY,
    sortOrder: ALLOWED_SORT_ORDER.has(sortOrder) ? sortOrder : DEFAULT_SORT_ORDER,
  }

  const q = parseString(searchParams.get('q'))
  const brand = parseString(searchParams.get('brand'))
  const cpu = parseString(searchParams.get('cpu'))
  const inStock = parseBoolean(searchParams.get('inStock'))

  if (q) {
    query.q = q
  }

  if (brand) {
    query.brand = brand
  }

  if (cpu) {
    query.cpu = cpu
  }

  if (ram && ram > 0) {
    query.ram = ram
  }

  if (storage && storage > 0) {
    query.storage = storage
  }

  if (typeof inStock === 'boolean') {
    query.inStock = inStock
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const low = minPrice !== undefined && minPrice >= 0 ? minPrice : undefined
    const high = maxPrice !== undefined && maxPrice >= 0 ? maxPrice : undefined

    if (low !== undefined && high !== undefined) {
      query.minPrice = Math.min(low, high)
      query.maxPrice = Math.max(low, high)
    } else {
      if (low !== undefined) {
        query.minPrice = low
      }

      if (high !== undefined) {
        query.maxPrice = high
      }
    }
  }

  return query
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

export function updateSearchParamsWithQuery(baseSearchParams, patch) {
  const nextParams = new URLSearchParams(baseSearchParams)

  for (const [key, rawValue] of Object.entries(patch)) {
    if (shouldDropValue(rawValue)) {
      nextParams.delete(key)
      continue
    }

    nextParams.set(key, String(rawValue).trim())
  }

  if (nextParams.get('page') === String(DEFAULT_PAGE)) {
    nextParams.delete('page')
  }

  if (nextParams.get('limit') === String(DEFAULT_LIMIT)) {
    nextParams.delete('limit')
  }

  if (nextParams.get('sortBy') === DEFAULT_SORT_BY) {
    nextParams.delete('sortBy')
  }

  if (nextParams.get('sortOrder') === DEFAULT_SORT_ORDER) {
    nextParams.delete('sortOrder')
  }

  return nextParams
}
