const sortOptions = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'price:asc', label: 'Price: low to high' },
  { value: 'price:desc', label: 'Price: high to low' },
  { value: 'name:asc', label: 'Name: A to Z' },
  { value: 'name:desc', label: 'Name: Z to A' },
]

const perPageOptions = [12, 24, 48]

export function ProductFilters({ query, onQueryChange }) {
  const selectedSort = `${query.sortBy}:${query.sortOrder}`
  const inStockValue =
    query.inStock === true ? 'true' : query.inStock === false ? 'false' : 'all'

  function updateField(key, value, resetPage = true) {
    onQueryChange({
      [key]: value,
      page: resetPage ? 1 : query.page,
    })
  }

  function handleSortChange(event) {
    const [sortBy, sortOrder] = event.target.value.split(':')
    onQueryChange({
      sortBy,
      sortOrder,
      page: 1,
    })
  }

  function clearFilters() {
    onQueryChange({
      q: undefined,
      brand: undefined,
      cpu: undefined,
      ram: undefined,
      storage: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 12,
      page: 1,
    })
  }

  return (
    <form className="product-filters" onSubmit={(event) => event.preventDefault()}>
      <div className="filter-row filter-row--search">
        <label className="filter-field" htmlFor="product-q">
          Search
          <input
            id="product-q"
            name="q"
            type="search"
            value={query.q || ''}
            placeholder="Name, CPU, or keyword"
            onChange={(event) => updateField('q', event.target.value)}
          />
        </label>
      </div>

      <div className="filter-row">
        <label className="filter-field" htmlFor="product-brand">
          Brand
          <input
            id="product-brand"
            name="brand"
            type="text"
            value={query.brand || ''}
            placeholder="Apple, ASUS, Dell"
            onChange={(event) => updateField('brand', event.target.value)}
          />
        </label>

        <label className="filter-field" htmlFor="product-cpu">
          CPU
          <input
            id="product-cpu"
            name="cpu"
            type="text"
            value={query.cpu || ''}
            placeholder="M3, Ryzen 7"
            onChange={(event) => updateField('cpu', event.target.value)}
          />
        </label>

        <label className="filter-field" htmlFor="product-instock">
          Availability
          <select
            id="product-instock"
            name="inStock"
            value={inStockValue}
            onChange={(event) => {
              const value = event.target.value
              updateField('inStock', value === 'all' ? undefined : value === 'true')
            }}
          >
            <option value="all">All stock states</option>
            <option value="true">In stock</option>
            <option value="false">Out of stock</option>
          </select>
        </label>
      </div>

      <div className="filter-row">
        <label className="filter-field" htmlFor="product-ram">
          RAM (GB)
          <input
            id="product-ram"
            name="ram"
            type="number"
            min="1"
            value={query.ram || ''}
            onChange={(event) => updateField('ram', event.target.value)}
          />
        </label>

        <label className="filter-field" htmlFor="product-storage">
          Storage (GB)
          <input
            id="product-storage"
            name="storage"
            type="number"
            min="1"
            value={query.storage || ''}
            onChange={(event) => updateField('storage', event.target.value)}
          />
        </label>

        <label className="filter-field" htmlFor="product-min-price">
          Min price
          <input
            id="product-min-price"
            name="minPrice"
            type="number"
            min="0"
            value={query.minPrice || ''}
            onChange={(event) => updateField('minPrice', event.target.value)}
          />
        </label>

        <label className="filter-field" htmlFor="product-max-price">
          Max price
          <input
            id="product-max-price"
            name="maxPrice"
            type="number"
            min="0"
            value={query.maxPrice || ''}
            onChange={(event) => updateField('maxPrice', event.target.value)}
          />
        </label>
      </div>

      <div className="filter-row filter-row--footer">
        <label className="filter-field" htmlFor="product-sort">
          Sort by
          <select id="product-sort" name="sort" value={selectedSort} onChange={handleSortChange}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field" htmlFor="product-limit">
          Per page
          <select
            id="product-limit"
            name="limit"
            value={query.limit}
            onChange={(event) => updateField('limit', event.target.value)}
          >
            {perPageOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="button button--secondary" onClick={clearFilters}>
          Reset filters
        </button>
      </div>
    </form>
  )
}
