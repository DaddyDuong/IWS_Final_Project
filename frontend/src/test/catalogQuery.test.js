import { describe, expect, it } from 'vitest'
import {
  normalizeCatalogQuery,
  patchCatalogSearchParams,
  toCatalogSearchParams,
} from '../utils/query/catalogQuery'

describe('normalizeCatalogQuery', () => {
  it('returns defaults for empty params', () => {
    const query = normalizeCatalogQuery(new URLSearchParams())

    expect(query).toEqual({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  })

  it('normalizes valid params and fixes price range order', () => {
    const query = normalizeCatalogQuery(new URLSearchParams({
      page: '2',
      limit: '18',
      sortBy: 'price',
      sortOrder: 'asc',
      brand: 'ASUS',
      minPrice: '5000',
      maxPrice: '1000',
      inStock: 'true',
    }))

    expect(query).toEqual({
      page: 2,
      limit: 18,
      sortBy: 'price',
      sortOrder: 'asc',
      brand: 'ASUS',
      minPrice: 1000,
      maxPrice: 5000,
      inStock: true,
    })
  })
})

describe('catalog query search params conversion', () => {
  it('builds canonical params', () => {
    const params = toCatalogSearchParams({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      q: 'nova',
      inStock: true,
    })

    expect(params.toString()).toBe('q=nova&inStock=true')
  })

  it('applies patch and canonicalizes values', () => {
    const base = new URLSearchParams({
      page: '3',
      sortBy: 'name',
      sortOrder: 'asc',
    })

    const next = patchCatalogSearchParams(base, {
      page: '2',
      sortBy: 'invalid',
      q: '   ',
      minPrice: '700',
    })

    expect(next.toString()).toBe('page=2&sortOrder=asc&minPrice=700')
  })
})
