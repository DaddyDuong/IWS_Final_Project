import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInternalProduct,
  deleteInternalProduct,
  fetchManagerCatalog,
  updateInternalProduct,
} from '../lib/customerApi'
import { currencyFormatter, formatApiError } from '../lib/formatters'

const initialCreateForm = {
  sku: '',
  name: '',
  brand: '',
  cpu: '',
  ramGb: '16',
  storageGb: '512',
  screenSize: '14',
  price: '0',
  stockQty: '0',
  description: '',
  imageUrl: 'https://example.com/laptop.jpg',
}

function toNonNegativeInteger(value) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}

function toPositiveInteger(value) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function toCreatePayload(form) {
  return {
    sku: form.sku.trim(),
    name: form.name.trim(),
    brand: form.brand.trim(),
    cpu: form.cpu.trim(),
    ramGb: toPositiveInteger(form.ramGb),
    storageGb: toPositiveInteger(form.storageGb),
    screenSize: form.screenSize.trim(),
    price: toNonNegativeInteger(form.price),
    stockQty: toNonNegativeInteger(form.stockQty),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
  }
}

function toUpdatePayload(form) {
  return {
    name: form.name.trim(),
    brand: form.brand.trim(),
    cpu: form.cpu.trim(),
    ramGb: toPositiveInteger(form.ramGb),
    storageGb: toPositiveInteger(form.storageGb),
    screenSize: form.screenSize.trim(),
    price: toNonNegativeInteger(form.price),
    stockQty: toNonNegativeInteger(form.stockQty),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
  }
}

export function ManagerProductsPage() {
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [createForm, setCreateForm] = useState(initialCreateForm)
  const [editingId, setEditingId] = useState('')
  const [editingForm, setEditingForm] = useState(initialCreateForm)

  const productsQuery = useQuery({
    queryKey: ['manager-products', query],
    queryFn: () => fetchManagerCatalog(query),
    placeholderData: (previousData) => previousData,
  })

  const products = productsQuery.data?.items || []
  const meta = productsQuery.data?.meta || {
    page: query.page,
    limit: query.limit,
    total: 0,
    totalPages: 0,
  }

  const createMutation = useMutation({
    mutationFn: createInternalProduct,
    onSuccess: () => {
      setFeedback({ message: 'Product created.', type: 'success' })
      setCreateForm(initialCreateForm)
      queryClient.invalidateQueries({ queryKey: ['manager-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to create product.'),
        type: 'error',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateInternalProduct,
    onSuccess: () => {
      setFeedback({ message: 'Product updated.', type: 'success' })
      setEditingId('')
      queryClient.invalidateQueries({ queryKey: ['manager-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to update product.'),
        type: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInternalProduct,
    onSuccess: () => {
      setFeedback({ message: 'Product soft-deleted.', type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['manager-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to delete product.'),
        type: 'error',
      })
    },
  })

  function updateCreateField(field, value) {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateEditingField(field, value) {
    setEditingForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleCreate(event) {
    event.preventDefault()
    createMutation.mutate(toCreatePayload(createForm))
  }

  function startEditing(product) {
    setEditingId(product.id)
    setEditingForm({
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      cpu: product.cpu,
      ramGb: String(product.ramGb),
      storageGb: String(product.storageGb),
      screenSize: product.screenSize,
      price: String(product.price),
      stockQty: String(product.stockQty),
      description: product.description,
      imageUrl: product.imageUrl,
    })
  }

  function handleSave(productId, event) {
    event.preventDefault()
    updateMutation.mutate({
      id: productId,
      payload: toUpdatePayload(editingForm),
    })
  }

  function handleDelete(productId) {
    if (!globalThis.confirm('Soft-delete this product?')) {
      return
    }

    deleteMutation.mutate(productId)
  }

  function updateQuery(patch) {
    setQuery((current) => ({
      ...current,
      ...patch,
    }))
  }

  const hasPrevious = meta.page > 1
  const hasNext = meta.page < meta.totalPages

  return (
    <section className="page page--customer account-page" aria-labelledby="manager-products-title">
      <p className="eyebrow">Manager</p>
      <h1 id="manager-products-title">Internal product management</h1>

      {feedback.message ? (
        <p
          className={`catalog-feedback ${feedback.type === 'error' ? 'catalog-feedback--error' : 'catalog-feedback--success'}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
        >
          {feedback.message}
        </p>
      ) : null}

      <form className="product-filters" onSubmit={(event) => event.preventDefault()} aria-label="Manager list controls">
        <div className="filter-row filter-row--footer">
          <label className="filter-field" htmlFor="manager-products-sort">
            Sort by
            <select
              id="manager-products-sort"
              value={`${query.sortBy}:${query.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(':')
                updateQuery({ sortBy, sortOrder, page: 1 })
              }}
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="price:desc">Highest price</option>
              <option value="price:asc">Lowest price</option>
              <option value="name:asc">Name A-Z</option>
              <option value="name:desc">Name Z-A</option>
            </select>
          </label>

          <label className="filter-field" htmlFor="manager-products-limit">
            Per page
            <select
              id="manager-products-limit"
              value={query.limit}
              onChange={(event) => updateQuery({ limit: Number(event.target.value), page: 1 })}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="40">40</option>
            </select>
          </label>
        </div>
      </form>

      <article className="customer-card account-card">
        <h2>Create product</h2>
        <form className="address-form" onSubmit={handleCreate}>
          <label htmlFor="manager-create-sku">SKU</label>
          <input
            id="manager-create-sku"
            value={createForm.sku}
            onChange={(event) => updateCreateField('sku', event.target.value)}
            required
          />

          <label htmlFor="manager-create-name">Name</label>
          <input
            id="manager-create-name"
            value={createForm.name}
            onChange={(event) => updateCreateField('name', event.target.value)}
            required
          />

          <label htmlFor="manager-create-brand">Brand</label>
          <input
            id="manager-create-brand"
            value={createForm.brand}
            onChange={(event) => updateCreateField('brand', event.target.value)}
            required
          />

          <label htmlFor="manager-create-cpu">CPU</label>
          <input
            id="manager-create-cpu"
            value={createForm.cpu}
            onChange={(event) => updateCreateField('cpu', event.target.value)}
            required
          />

          <label htmlFor="manager-create-ram">RAM (GB)</label>
          <input
            id="manager-create-ram"
            type="number"
            min="1"
            value={createForm.ramGb}
            onChange={(event) => updateCreateField('ramGb', event.target.value)}
            required
          />

          <label htmlFor="manager-create-storage">Storage (GB)</label>
          <input
            id="manager-create-storage"
            type="number"
            min="1"
            value={createForm.storageGb}
            onChange={(event) => updateCreateField('storageGb', event.target.value)}
            required
          />

          <label htmlFor="manager-create-screen">Screen size</label>
          <input
            id="manager-create-screen"
            value={createForm.screenSize}
            onChange={(event) => updateCreateField('screenSize', event.target.value)}
            required
          />

          <label htmlFor="manager-create-price">Price</label>
          <input
            id="manager-create-price"
            type="number"
            min="0"
            value={createForm.price}
            onChange={(event) => updateCreateField('price', event.target.value)}
            required
          />

          <label htmlFor="manager-create-stock">Stock</label>
          <input
            id="manager-create-stock"
            type="number"
            min="0"
            value={createForm.stockQty}
            onChange={(event) => updateCreateField('stockQty', event.target.value)}
            required
          />

          <label htmlFor="manager-create-description">Description</label>
          <input
            id="manager-create-description"
            value={createForm.description}
            onChange={(event) => updateCreateField('description', event.target.value)}
            required
          />

          <label htmlFor="manager-create-image">Image URL</label>
          <input
            id="manager-create-image"
            type="url"
            value={createForm.imageUrl}
            onChange={(event) => updateCreateField('imageUrl', event.target.value)}
            required
          />

          <button type="submit" className="button button--primary" disabled={createMutation.isPending}>
            Create product
          </button>
        </form>
      </article>

      {productsQuery.isLoading ? <p>Loading products...</p> : null}

      {productsQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(productsQuery.error, 'Unable to load products.')}
        </p>
      ) : null}

      {products.length > 0 ? (
        <ul className="order-list">
          {products.map((product) => {
            const isEditing = editingId === product.id

            return (
              <li key={product.id}>
                <article className="customer-card account-card">
                  {!isEditing ? (
                    <>
                      <div className="order-row">
                        <h2>{product.name}</h2>
                        <span className="order-status">{product.stockQty} in stock</span>
                      </div>
                      <p>SKU: {product.sku}</p>
                      <p>{product.brand} - {product.cpu}</p>
                      <p>{currencyFormatter.format(product.price)}</p>
                      <div className="cta-row">
                        <button type="button" className="button button--secondary" onClick={() => startEditing(product)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button--secondary"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(product.id)}
                        >
                          Soft delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <form className="address-form" onSubmit={(event) => handleSave(product.id, event)}>
                      <label htmlFor={`manager-edit-name-${product.id}`}>Name</label>
                      <input
                        id={`manager-edit-name-${product.id}`}
                        value={editingForm.name}
                        onChange={(event) => updateEditingField('name', event.target.value)}
                        required
                      />

                      <label htmlFor={`manager-edit-brand-${product.id}`}>Brand</label>
                      <input
                        id={`manager-edit-brand-${product.id}`}
                        value={editingForm.brand}
                        onChange={(event) => updateEditingField('brand', event.target.value)}
                        required
                      />

                      <label htmlFor={`manager-edit-cpu-${product.id}`}>CPU</label>
                      <input
                        id={`manager-edit-cpu-${product.id}`}
                        value={editingForm.cpu}
                        onChange={(event) => updateEditingField('cpu', event.target.value)}
                        required
                      />

                      <label htmlFor={`manager-edit-price-${product.id}`}>Price</label>
                      <input
                        id={`manager-edit-price-${product.id}`}
                        type="number"
                        min="0"
                        value={editingForm.price}
                        onChange={(event) => updateEditingField('price', event.target.value)}
                        required
                      />

                      <label htmlFor={`manager-edit-stock-${product.id}`}>Stock</label>
                      <input
                        id={`manager-edit-stock-${product.id}`}
                        type="number"
                        min="0"
                        value={editingForm.stockQty}
                        onChange={(event) => updateEditingField('stockQty', event.target.value)}
                        required
                      />

                      <label htmlFor={`manager-edit-ram-${product.id}`}>RAM (GB)</label>
                      <input
                        id={`manager-edit-ram-${product.id}`}
                        type="number"
                        min="1"
                        value={editingForm.ramGb}
                        onChange={(event) => updateEditingField('ramGb', event.target.value)}
                        required
                      />

                      <label htmlFor={`manager-edit-storage-${product.id}`}>Storage (GB)</label>
                      <input
                        id={`manager-edit-storage-${product.id}`}
                        type="number"
                        min="1"
                        value={editingForm.storageGb}
                        onChange={(event) => updateEditingField('storageGb', event.target.value)}
                        required
                      />

                      <label htmlFor={`manager-edit-screen-${product.id}`}>Screen size</label>
                      <input
                        id={`manager-edit-screen-${product.id}`}
                        value={editingForm.screenSize}
                        onChange={(event) => updateEditingField('screenSize', event.target.value)}
                        required
                      />

                      <label htmlFor={`manager-edit-description-${product.id}`}>Description</label>
                      <input
                        id={`manager-edit-description-${product.id}`}
                        value={editingForm.description}
                        onChange={(event) => updateEditingField('description', event.target.value)}
                        required
                      />

                      <label htmlFor={`manager-edit-image-${product.id}`}>Image URL</label>
                      <input
                        id={`manager-edit-image-${product.id}`}
                        type="url"
                        value={editingForm.imageUrl}
                        onChange={(event) => updateEditingField('imageUrl', event.target.value)}
                        required
                      />

                      <div className="cta-row">
                        <button type="submit" className="button button--primary" disabled={updateMutation.isPending}>
                          Save changes
                        </button>
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => setEditingId('')}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              </li>
            )
          })}
        </ul>
      ) : null}

      {products.length > 0 ? (
        <div className="pagination-bar" aria-live="polite">
          <button
            type="button"
            className="button button--secondary"
            disabled={!hasPrevious || productsQuery.isFetching}
            onClick={() => updateQuery({ page: meta.page - 1 })}
          >
            Previous
          </button>
          <p>
            Page {meta.page} of {Math.max(meta.totalPages, 1)} ({meta.total} products)
            {productsQuery.isFetching ? ' - Updating…' : ''}
          </p>
          <button
            type="button"
            className="button button--secondary"
            disabled={!hasNext || productsQuery.isFetching}
            onClick={() => updateQuery({ page: meta.page + 1 })}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  )
}
