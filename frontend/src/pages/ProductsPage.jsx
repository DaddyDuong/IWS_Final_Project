import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ProductComparison } from '../components/ProductComparison'
import { ProductFilters } from '../components/ProductFilters'
import { ProductGrid } from '../components/ProductGrid'
import { apiClient } from '../lib/apiClient'
import { mockProducts } from '../lib/mockData'
import {
  buildProductQuery,
  buildSearchParamsFromProductQuery,
  updateSearchParamsWithQuery,
} from '../lib/buildProductQuery'
const USE_MOCK_DATA = true;
async function fetchProducts(query) {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    let products = [...mockProducts];
    if (query.brand) {
      const brandLower = query.brand.toLowerCase();
      products = products.filter(p => p.brand.toLowerCase() === brandLower);
    }
    if (query.q) {
      const searchLower = query.q.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(searchLower) || p.brand.toLowerCase().includes(searchLower));
    }
    const limit = query.limit || 16;
    return {
      data: products,
      meta: {
        page: query.page || 1,
        limit: limit,
        total: products.length,
        totalPages: Math.ceil(products.length / limit)
      }
    };
  }

  const response = await apiClient.get('/products', {
    params: query,
  });
  return response.data;
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
  const isFiltered = query.brand != null || query.q != null || query.sort != null || query.useCase != null
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