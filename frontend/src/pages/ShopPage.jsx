import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShopFilters } from '../components/shop/ShopFilters'
import { ProductCard } from '../components/shop/ProductCard'
import { ComparisonStrip } from '../components/shop/ComparisonStrip'
import { Pagination } from '../components/shared/Pagination'
import { StateBlock } from '../components/shared/StateBlock'
import { AlertBox } from '../components/shared/AlertBox'
import { useCatalogQuery } from '../hooks/useDomainData'
import {
  normalizeCatalogQuery,
  patchCatalogSearchParams,
  toCatalogSearchParams,
} from '../utils/query/catalogQuery'
import styles from './ShopPage.module.css'

const MAX_COMPARE = 4

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [compareItems, setCompareItems] = useState([])
  const [feedback, setFeedback] = useState(null)

  const query = useMemo(() => normalizeCatalogQuery(searchParams), [searchParams])

  useEffect(() => {
    const canonical = toCatalogSearchParams(query)

    if (canonical.toString() !== searchParams.toString()) {
      setSearchParams(canonical, { replace: true })
    }
  }, [query, searchParams, setSearchParams])

  const catalogQuery = useCatalogQuery(query)
  const products = catalogQuery.data?.items ?? []
  const meta = catalogQuery.data?.meta ?? {
    page: query.page,
    totalPages: 0,
    total: 0,
  }

  function updateQuery(patch) {
    const params = patchCatalogSearchParams(searchParams, patch)
    setSearchParams(params, { replace: true })
  }

  function toggleCompare(product) {
    setFeedback(null)

    setCompareItems((previous) => {
      const exists = previous.some((item) => item.id === product.id)

      if (exists) {
        return previous.filter((item) => item.id !== product.id)
      }

      if (previous.length >= MAX_COMPARE) {
        setFeedback({
          variant: 'error',
          title: 'Comparison full',
          message: `You can compare up to ${MAX_COMPARE} products at once.`,
        })
        return previous
      }

      return [...previous, product]
    })
  }

  return (
    <section className={styles.pageSection}>
      <header className="pageHeader">
        <h1 className="pageTitle">Shop</h1>
        <p className="pageSubtitle">Compare premium notebooks with filters, sorting, and pagination.</p>
      </header>

      {feedback ? (
        <AlertBox
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      ) : null}

      <ShopFilters query={query} onPatch={updateQuery} />

      <StateBlock
        isLoading={catalogQuery.isLoading}
        isError={catalogQuery.isError}
        error={catalogQuery.error}
        isEmpty={!products.length}
        emptyTitle="No products found"
        emptyMessage="Try broadening your filters or reset the search inputs."
        loadingText="Loading product catalog..."
      >
        <section className={styles.grid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              compared={compareItems.some((item) => item.id === product.id)}
              onToggleCompare={toggleCompare}
            />
          ))}
        </section>

        <div className={styles.paginationWrap}>
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={(page) => updateQuery({ page })} />
        </div>
      </StateBlock>

      <ComparisonStrip
        products={compareItems}
        onRemove={(id) => setCompareItems((previous) => previous.filter((item) => item.id !== id))}
        onClear={() => setCompareItems([])}
      />
    </section>
  )
}
