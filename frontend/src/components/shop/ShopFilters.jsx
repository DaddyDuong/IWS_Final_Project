import styles from './ShopFilters.module.css'

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'price:asc', label: 'Price: low to high' },
  { value: 'price:desc', label: 'Price: high to low' },
  { value: 'name:asc', label: 'Name: A-Z' },
  { value: 'name:desc', label: 'Name: Z-A' },
]

export function ShopFilters({ query, onPatch }) {
  const selectedSort = `${query.sortBy}:${query.sortOrder}`

  return (
    <form className={styles.filters} onSubmit={(event) => event.preventDefault()} aria-label="Shop filters">
      <div className={styles.topRow}>
        <label className="field">
          <span className="fieldLabel">Search</span>
          <input
            type="search"
            value={query.q ?? ''}
            placeholder="Search products"
            onChange={(event) => onPatch({ q: event.target.value, page: 1 })}
          />
        </label>

        <label className="field">
          <span className="fieldLabel">Sort</span>
          <select
            value={selectedSort}
            onChange={(event) => {
              const [sortBy, sortOrder] = event.target.value.split(':')
              onPatch({ sortBy, sortOrder, page: 1 })
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="fieldLabel">Per page</span>
          <select
            value={query.limit}
            onChange={(event) => onPatch({ limit: event.target.value, page: 1 })}
          >
            <option value="6">6</option>
            <option value="12">12</option>
            <option value="18">18</option>
          </select>
        </label>
      </div>

      <div className={styles.grid}>
        <label className="field">
          <span className="fieldLabel">Brand</span>
          <input value={query.brand ?? ''} placeholder="Apple, ASUS, Lenovo..." onChange={(event) => onPatch({ brand: event.target.value, page: 1 })} />
        </label>

        <label className="field">
          <span className="fieldLabel">CPU</span>
          <input value={query.cpu ?? ''} placeholder="Intel Core i7" onChange={(event) => onPatch({ cpu: event.target.value, page: 1 })} />
        </label>

        <label className="field">
          <span className="fieldLabel">RAM (GB)</span>
          <input type="number" min="0" value={query.ram ?? ''} onChange={(event) => onPatch({ ram: event.target.value, page: 1 })} />
        </label>

        <label className="field">
          <span className="fieldLabel">Storage (GB)</span>
          <input type="number" min="0" value={query.storage ?? ''} onChange={(event) => onPatch({ storage: event.target.value, page: 1 })} />
        </label>

        <label className="field">
          <span className="fieldLabel">Min price</span>
          <input type="number" min="0" value={query.minPrice ?? ''} onChange={(event) => onPatch({ minPrice: event.target.value, page: 1 })} />
        </label>

        <label className="field">
          <span className="fieldLabel">Max price</span>
          <input type="number" min="0" value={query.maxPrice ?? ''} onChange={(event) => onPatch({ maxPrice: event.target.value, page: 1 })} />
        </label>
      </div>

      <div className={styles.footer}>
        <label className={styles.stockToggle}>
          <input
            type="checkbox"
            checked={query.inStock ?? false}
            onChange={(event) => onPatch({ inStock: event.target.checked ? 'true' : undefined, page: 1 })}
          />
          <span>In-stock only</span>
        </label>

        <button type="button" className="secondaryButton" onClick={() => onPatch({
          q: undefined,
          brand: undefined,
          cpu: undefined,
          ram: undefined,
          storage: undefined,
          minPrice: undefined,
          maxPrice: undefined,
          inStock: undefined,
          page: 1,
        })}>
          Reset filters
        </button>
      </div>
    </form>
  )
}
