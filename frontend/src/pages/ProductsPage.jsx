import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ProductComparison } from '../components/ProductComparison'
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

function BrandSection({ brandName, brandProducts }) {
  const [visibleCount, setVisibleCount] = useState(8)
  return (
    <div className="brand-section" style={{ marginTop: '3vw', marginBottom: '3vw' }}>
      <h2 className="brand-section-title">Laptop {brandName}</h2>
      <ProductGrid
        products={brandProducts.slice(0, visibleCount)}
      />
      {visibleCount < brandProducts.length && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5vw' }}>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setVisibleCount(prev => prev + 4)}
            style={{padding: '0.8vw 2vw', fontSize: '1.1vw', color: 'black'}}
          >
            Show More
          </button>
        </div>
      )}
    </div>
  )
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

  const productsQuery = useQuery({
    queryKey: ['products', query],
    queryFn: () => fetchProducts(query),
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

  const isFiltered =
    query.brand != null
    || query.q != null
    || query.cpu != null
    || query.ram != null
    || query.storage != null
    || query.minPrice != null
    || query.maxPrice != null
    || query.inStock != null
    || query.page > 1
    || query.sortBy !== 'createdAt'
    || query.sortOrder !== 'desc'

  const groupedProducts = useMemo(() => {
    if (isFiltered) return {}
    return products.reduce((acc, product) => {
      const brand = product.brand || 'Other'
      if (!acc[brand]) acc[brand] = []
      acc[brand].push(product)
      return acc
    }, {})
  }, [products, isFiltered])

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
      {isFiltered ? (
        <ProductGrid
          products={products}
          meta={meta}
          isLoading={productsQuery.isLoading}
          isError={productsQuery.isError}
          error={productsQuery.error}
          isFetching={productsQuery.isFetching}
          onPageChange={(nextPage) => updateQuery({ page: nextPage })}
        />
      ) : (
        <>
          {productsQuery.isLoading && <p className="catalog-feedback">Loading products…</p>}
          {productsQuery.isError && <p className="catalog-feedback catalog-feedback--error">{productsQuery.error?.message || 'Failed to load products.'}</p>}
          {!productsQuery.isLoading && !productsQuery.isError && Object.entries(groupedProducts).length === 0 && (
            <p className="catalog-feedback">No products found.</p>
          )}
          {Object.entries(groupedProducts).map(([brandName, brandProducts]) => (
            <BrandSection
              key={brandName}
              brandName={brandName}
              brandProducts={brandProducts} />
          ))}
        </>
      )}

      <ProductComparison products={products} />
    </section>
  )
}