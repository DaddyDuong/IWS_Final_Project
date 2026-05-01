import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertBox } from '../components/shared/AlertBox'
import { Pagination } from '../components/shared/Pagination'
import { StateBlock } from '../components/shared/StateBlock'
import { useManagerCatalogQuery, useManagerProductMutations } from '../hooks/useDomainData'
import {
  normalizeCatalogQuery,
  patchCatalogSearchParams,
  toCatalogSearchParams,
} from '../utils/query/catalogQuery'
import { formatMoney } from '../utils/format'
import styles from './ManagerStudioPage.module.css'

const EMPTY_PRODUCT = {
  sku: '',
  name: '',
  brand: '',
  cpu: '',
  ramGb: '',
  storageGb: '',
  screenSize: '',
  price: '',
  stockQty: '',
  description: '',
  imageUrl: '',
}

function buildProductPayload(form) {
  return {
    sku: form.sku,
    name: form.name,
    brand: form.brand,
    cpu: form.cpu,
    ramGb: Number(form.ramGb),
    storageGb: Number(form.storageGb),
    screenSize: form.screenSize,
    price: Number(form.price),
    stockQty: Number(form.stockQty),
    description: form.description,
    imageUrl: form.imageUrl,
  }
}

export function ManagerStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => normalizeCatalogQuery(searchParams), [searchParams])

  const managerQuery = useManagerCatalogQuery(query)
  const { createMutation, updateMutation, removeMutation } = useManagerProductMutations()

  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_PRODUCT)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const canonical = toCatalogSearchParams(query)
    if (canonical.toString() !== searchParams.toString()) {
      setSearchParams(canonical, { replace: true })
    }
  }, [query, searchParams, setSearchParams])

  const products = managerQuery.data?.items ?? []
  const meta = managerQuery.data?.meta ?? { page: 1, totalPages: 0 }

  function updateQuery(patch) {
    const next = patchCatalogSearchParams(searchParams, patch)
    setSearchParams(next, { replace: true })
  }

  function updateForm(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setFeedback(null)

    await createMutation.mutateAsync(buildProductPayload(form), {
      onSuccess: () => {
        setForm(EMPTY_PRODUCT)
        setFeedback({ variant: 'success', title: 'Product created', message: 'New product is now available in the catalog.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Create failed', message: 'Please review the form and try again.' })
      },
    })
  }

  async function handleSaveEdit(id) {
    setFeedback(null)

    await updateMutation.mutateAsync({ id, payload: buildProductPayload(editingForm) }, {
      onSuccess: () => {
        setEditingId(null)
        setFeedback({ variant: 'success', title: 'Product updated', message: 'Product changes were saved.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Update failed', message: 'Unable to save product changes.' })
      },
    })
  }

  async function handleSoftDelete(id) {
    const confirmed = window.confirm('Soft-delete this product?')
    if (!confirmed) {
      return
    }

    setFeedback(null)

    await removeMutation.mutateAsync(id, {
      onSuccess: () => {
        setFeedback({ variant: 'success', title: 'Product soft-deleted', message: 'Product was marked as deleted.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Delete failed', message: 'Unable to soft-delete product right now.' })
      },
    })
  }

  return (
    <section className={styles.pageSection}>
      <header className="pageHeader">
        <h1 className="pageTitle">Internal product management</h1>
        <p className="pageSubtitle">Create, update, and soft-delete products for the storefront catalog.</p>
      </header>

      {feedback ? (
        <AlertBox
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      ) : null}

      <section className="panel">
        <div className="fieldGrid">
          <label className="field">
            <span className="fieldLabel">Sort by</span>
            <select
              value={`${query.sortBy}:${query.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(':')
                updateQuery({ sortBy, sortOrder, page: 1 })
              }}
            >
              <option value="createdAt:desc">Created: newest first</option>
              <option value="createdAt:asc">Created: oldest first</option>
              <option value="price:asc">Price: low to high</option>
              <option value="price:desc">Price: high to low</option>
              <option value="name:asc">Name: A-Z</option>
            </select>
          </label>

          <label className="field">
            <span className="fieldLabel">Per page</span>
            <select value={query.limit} onChange={(event) => updateQuery({ limit: event.target.value, page: 1 })}>
              <option value="6">6</option>
              <option value="12">12</option>
              <option value="24">24</option>
            </select>
          </label>

          <label className="field">
            <span className="fieldLabel">Search products</span>
            <input type="search" value={query.q ?? ''} onChange={(event) => updateQuery({ q: event.target.value, page: 1 })} />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2 className={styles.sectionTitle}>Create product</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <div className="fieldGrid">
            <label className="field"><span className="fieldLabel">SKU</span><input value={form.sku} required onChange={(event) => updateForm('sku', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">Name</span><input value={form.name} required onChange={(event) => updateForm('name', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">Brand</span><input value={form.brand} required onChange={(event) => updateForm('brand', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">CPU</span><input value={form.cpu} required onChange={(event) => updateForm('cpu', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">RAM (GB)</span><input type="number" min="1" value={form.ramGb} required onChange={(event) => updateForm('ramGb', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">Storage (GB)</span><input type="number" min="1" value={form.storageGb} required onChange={(event) => updateForm('storageGb', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">Screen size</span><input value={form.screenSize} required onChange={(event) => updateForm('screenSize', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">Price</span><input type="number" min="0" value={form.price} required onChange={(event) => updateForm('price', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">Stock</span><input type="number" min="0" value={form.stockQty} required onChange={(event) => updateForm('stockQty', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">Description</span><textarea value={form.description} required onChange={(event) => updateForm('description', event.target.value)} /></label>
            <label className="field"><span className="fieldLabel">Image URL</span><input type="url" value={form.imageUrl} required onChange={(event) => updateForm('imageUrl', event.target.value)} /></label>
          </div>

          <div className="inlineActions">
            <button type="submit" className="primaryButton" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create product'}
            </button>
            <button type="button" className="secondaryButton" onClick={() => setForm(EMPTY_PRODUCT)}>Clear</button>
          </div>
        </form>
      </section>

      <StateBlock
        isLoading={managerQuery.isLoading}
        isError={managerQuery.isError}
        error={managerQuery.error}
        isEmpty={!products.length}
        emptyTitle="No products found"
        emptyMessage="Try changing your search or filters."
        loadingText="Loading product list..."
      >
        <section className={styles.list}>
          {products.map((product) => {
            const isEditing = editingId === product.id

            if (isEditing) {
              return (
                <article key={product.id} className={`${styles.productCard} ${styles.editing}`.trim()}>
                  <div className="fieldGrid">
                    <label className="field"><span className="fieldLabel">SKU</span><input value={editingForm.sku} onChange={(event) => setEditingForm((previous) => ({ ...previous, sku: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">Name</span><input value={editingForm.name} onChange={(event) => setEditingForm((previous) => ({ ...previous, name: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">Brand</span><input value={editingForm.brand} onChange={(event) => setEditingForm((previous) => ({ ...previous, brand: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">CPU</span><input value={editingForm.cpu} onChange={(event) => setEditingForm((previous) => ({ ...previous, cpu: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">RAM</span><input type="number" value={editingForm.ramGb} onChange={(event) => setEditingForm((previous) => ({ ...previous, ramGb: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">Storage</span><input type="number" value={editingForm.storageGb} onChange={(event) => setEditingForm((previous) => ({ ...previous, storageGb: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">Screen size</span><input value={editingForm.screenSize} onChange={(event) => setEditingForm((previous) => ({ ...previous, screenSize: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">Price</span><input type="number" value={editingForm.price} onChange={(event) => setEditingForm((previous) => ({ ...previous, price: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">Stock</span><input type="number" value={editingForm.stockQty} onChange={(event) => setEditingForm((previous) => ({ ...previous, stockQty: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">Description</span><textarea value={editingForm.description} onChange={(event) => setEditingForm((previous) => ({ ...previous, description: event.target.value }))} /></label>
                    <label className="field"><span className="fieldLabel">Image URL</span><input type="url" value={editingForm.imageUrl} onChange={(event) => setEditingForm((previous) => ({ ...previous, imageUrl: event.target.value }))} /></label>
                  </div>

                  <div className="inlineActions">
                    <button type="button" className="primaryButton" onClick={() => handleSaveEdit(product.id)}>Save changes</button>
                    <button type="button" className="secondaryButton" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </article>
              )
            }

            return (
              <article key={product.id} className={styles.productCard}>
                <img src={product.imageUrl} alt={product.name} />
                <div>
                  <p className={styles.productName}>{product.name}</p>
                  <p className="mutedText">SKU: {product.sku}</p>
                  <p className="mutedText">{product.cpu} · {product.ramGb}GB · {product.storageGb}GB SSD · {product.screenSize}"</p>
                </div>
                <p className={styles.price}>{formatMoney(product.price)}</p>
                <p className="mutedText">Stock: {product.stockQty}</p>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className="secondaryButton"
                    onClick={() => {
                      setEditingId(product.id)
                      setEditingForm({ ...product })
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="ghostDangerButton" onClick={() => handleSoftDelete(product.id)}>
                    Soft delete
                  </button>
                </div>
              </article>
            )
          })}
        </section>

        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={(page) => updateQuery({ page })} />
      </StateBlock>
    </section>
  )
}
