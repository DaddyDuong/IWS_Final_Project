import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ProductFilters } from '../components/ProductFilters'
import { ProductGrid } from '../components/ProductGrid'
import { apiClient } from '../lib/apiClient'
import {
  buildProductQuery,
  buildSearchParamsFromProductQuery,
  updateSearchParamsWithQuery,
} from '../lib/buildProductQuery'

async function fetchProducts(query) {
  const response = await apiClient.get('/products', {
    params: query,
  })
  return response.data
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => buildProductQuery(searchParams), [searchParams])

  useEffect(() => {
    const canonicalParams = buildSearchParamsFromProductQuery(query)
    if (canonicalParams.toString() !== searchParams.toString()) {
      setSearchParams(canonicalParams, { replace: true })
    }
  }, [query, searchParams, setSearchParams])

  const fetchQuery = useMemo(() => ({ ...query, limit: 100 }), [query])

  const productsQuery = useQuery({
    queryKey: ['products', fetchQuery],
    queryFn: () => fetchProducts(fetchQuery),
    placeholderData: (previousData) => previousData,
  })

  const products = productsQuery.data?.data || []
  const meta = productsQuery.data?.meta || {
    page: query.page,
    limit: query.limit,
    total: 0,
    totalPages: 0,
  }

  function updateQuery(patch) {
    const nextParams = updateSearchParamsWithQuery(searchParams, patch)
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <section className="catalog-page page page--catalog" aria-labelledby="products-title">
      <header className="catalog-header">
        <p className="eyebrow">Laptop catalog</p>
        <h1 id="products-title">Products</h1>
        <p>
          Compare premium notebooks, tune the filters, and move from shortlist to detail view
          without losing your place.
        </p>
      </header>
      <ProductFilters query={query} onQueryChange={updateQuery} />
      <ProductGrid
        products={products}
        isLoading={productsQuery.isLoading}
        isError={productsQuery.isError}
        error={productsQuery.error}
        isFetching={productsQuery.isFetching}
      />
    </section>
  )
}
