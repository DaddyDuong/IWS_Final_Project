import { describe, expect, it } from 'vitest'
import {
  normalizeOrdersQuery,
  patchOrdersSearchParams,
  toOrdersSearchParams,
} from '../utils/query/ordersQuery'

describe('normalizeOrdersQuery', () => {
  it('returns defaults for empty params', () => {
    const query = normalizeOrdersQuery(new URLSearchParams())

    expect(query).toEqual({
      page: 1,
      limit: 6,
      sortBy: 'placedAt',
      sortOrder: 'desc',
    })
  })

  it('accepts valid filters and fixes total range order', () => {
    const query = normalizeOrdersQuery(new URLSearchParams({
      status: 'processing',
      minTotal: '9000',
      maxTotal: '5000',
      sortBy: 'total',
      sortOrder: 'asc',
    }))

    expect(query).toEqual({
      page: 1,
      limit: 6,
      sortBy: 'total',
      sortOrder: 'asc',
      status: 'processing',
      minTotal: 5000,
      maxTotal: 9000,
    })
  })
})

describe('orders query search params conversion', () => {
  it('builds canonical params for non-default values', () => {
    const params = toOrdersSearchParams({
      page: 2,
      limit: 6,
      sortBy: 'placedAt',
      sortOrder: 'desc',
      status: 'delivered',
    })

    expect(params.toString()).toBe('page=2&status=delivered')
  })

  it('applies patch and canonicalizes invalid sort keys', () => {
    const base = new URLSearchParams({
      page: '2',
      sortBy: 'total',
      sortOrder: 'asc',
    })

    const next = patchOrdersSearchParams(base, {
      sortBy: 'invalid',
      page: '1',
      minTotal: '100',
    })

    expect(next.toString()).toBe('sortOrder=asc&minTotal=100')
  })
})
