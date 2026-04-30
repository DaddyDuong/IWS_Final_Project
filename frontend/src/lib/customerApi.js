import { apiClient } from './apiClient'

function getPayloadData(response) {
  return response?.data?.data
}

function getListMeta(response, fallbackCount = 0) {
  const meta = response?.data?.meta

  if (!meta) {
    return {
      page: 1,
      limit: fallbackCount,
      total: fallbackCount,
      totalPages: fallbackCount > 0 ? 1 : 0,
    }
  }

  return meta
}

export async function fetchProfile() {
  const response = await apiClient.get('/users/me')
  return getPayloadData(response) ?? null
}

export async function fetchCart() {
  const response = await apiClient.get('/cart')
  return getPayloadData(response)?.items ?? []
}

export async function addCartItem({ productId, quantity }) {
  const response = await apiClient.post('/cart/items', { productId, quantity })
  return getPayloadData(response) ?? null
}

export async function updateCartItem({ id, quantity }) {
  const response = await apiClient.patch(`/cart/items/${id}`, { quantity })
  return getPayloadData(response) ?? null
}

export async function removeCartItem(id) {
  const response = await apiClient.delete(`/cart/items/${id}`)
  return getPayloadData(response) ?? null
}

export async function fetchAddresses() {
  const response = await apiClient.get('/addresses')
  const payload = getPayloadData(response)
  return Array.isArray(payload) ? payload : []
}

export async function createAddress(payload) {
  const response = await apiClient.post('/addresses', payload)
  return getPayloadData(response) ?? null
}

export async function updateAddress({ id, payload }) {
  const response = await apiClient.patch(`/addresses/${id}`, payload)
  return getPayloadData(response) ?? null
}

export async function deleteAddress(id) {
  const response = await apiClient.delete(`/addresses/${id}`)
  return getPayloadData(response) ?? null
}

export async function checkoutWithAddress(addressId) {
  const response = await apiClient.post('/orders/checkout', { addressId })
  return getPayloadData(response) ?? null
}

export async function fetchOrders(query = {}) {
  const response = await apiClient.get('/orders', {
    params: query,
  })
  const payload = getPayloadData(response)
  const items = Array.isArray(payload) ? payload : []
  return {
    items,
    meta: getListMeta(response, items.length),
  }
}

export async function fetchOrderById(id) {
  const response = await apiClient.get(`/orders/${id}`)
  return getPayloadData(response) ?? null
}

export async function cancelOrder(id) {
  const response = await apiClient.patch(`/orders/${id}/cancel`)
  return getPayloadData(response) ?? null
}

export async function fetchProductReviews(productId, query = {}) {
  const response = await apiClient.get(`/products/${productId}/reviews`, {
    params: query,
  })
  const payload = getPayloadData(response)
  const items = Array.isArray(payload) ? payload : []
  return {
    items,
    meta: getListMeta(response, items.length),
  }
}

export async function createProductReview({ productId, payload }) {
  const response = await apiClient.post(`/products/${productId}/reviews`, payload)
  return getPayloadData(response) ?? null
}

export async function updateProductReview({ id, payload }) {
  const response = await apiClient.patch(`/reviews/${id}`, payload)
  return getPayloadData(response) ?? null
}

export async function deleteProductReview(id) {
  const response = await apiClient.delete(`/reviews/${id}`)
  return getPayloadData(response) ?? null
}

export async function fetchManagerCatalog(query = {}) {
  const response = await apiClient.get('/products', {
    params: query,
  })

  const payload = getPayloadData(response)
  const items = Array.isArray(payload) ? payload : []
  return {
    items,
    meta: getListMeta(response, items.length),
  }
}

export async function createInternalProduct(payload) {
  const response = await apiClient.post('/internal/products', payload)
  return getPayloadData(response) ?? null
}

export async function updateInternalProduct({ id, payload }) {
  const response = await apiClient.patch(`/internal/products/${id}`, payload)
  return getPayloadData(response) ?? null
}

export async function deleteInternalProduct(id) {
  const response = await apiClient.delete(`/internal/products/${id}`)
  return getPayloadData(response) ?? null
}
