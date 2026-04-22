import { describe, expect, it } from 'vitest'
import { buildProductQuery, updateSearchParamsWithQuery } from '../lib/buildProductQuery'

describe('buildProductQuery', () => {
  it('returns default values when no params are present', () => {
    const query = buildProductQuery(new URLSearchParams())

    expect(query).toEqual({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  })

  it('coerces valid values and removes invalid values', () => {
    const params = new URLSearchParams({
      page: '2',
      limit: '24',
      sortBy: 'price',
      sortOrder: 'asc',
      q: '   ultrabook   ',
      brand: '  Apple ',
      cpu: 'M3',
      ram: '16',
      storage: '512',
      minPrice: '1000',
      maxPrice: '500',
      inStock: 'true',
    })

    const query = buildProductQuery(params)

    expect(query).toEqual({
      page: 2,
      limit: 24,
      sortBy: 'price',
      sortOrder: 'asc',
      q: 'ultrabook',
      brand: 'Apple',
      cpu: 'M3',
      ram: 16,
      storage: 512,
      minPrice: 500,
      maxPrice: 1000,
      inStock: true,
    })
  })

  it('omits unsupported sort and strict-boolean values', () => {
    const params = new URLSearchParams({
      sortBy: 'stockQty',
      sortOrder: 'up',
      inStock: 'yes',
      page: '0',
      limit: '999',
    })

    const query = buildProductQuery(params)

    expect(query).toEqual({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  })
})

describe('updateSearchParamsWithQuery', () => {
  it('updates params while dropping empty values and default page', () => {
    const baseParams = new URLSearchParams('page=3&sortBy=price')
    const nextParams = updateSearchParamsWithQuery(baseParams, {
      page: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      q: '   ',
      brand: 'ASUS',
    })

    expect(nextParams.toString()).toBe('brand=ASUS')
  })
})
