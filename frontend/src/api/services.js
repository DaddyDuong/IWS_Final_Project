import { httpClient } from './httpClient'

function extractData(response) {
  return response?.data?.data ?? null
}

function extractMeta(response) {
  return response?.data?.meta ?? {
    page: 1,
    limit: 0,
    total: 0,
    totalPages: 0,
  }
}

function sanitizeRegisterPayload(payload) {
  const normalized = { ...payload }

  if (typeof normalized.phone === 'string') {
    const phone = normalized.phone.trim()

    if (phone) {
      normalized.phone = phone
    } else {
      delete normalized.phone
    }
  }

  return normalized
}

function withDefaultListLimit(query = {}, limit = 100) {
  return {
    ...query,
    limit: query.limit ?? limit,
  }
}

export async function login(payload) {
  const response = await httpClient.post('/auth/login', payload)
  return extractData(response)
}

export async function register(payload) {
  const response = await httpClient.post('/auth/register', sanitizeRegisterPayload(payload))
  return extractData(response)
}

export async function forgotPassword(payload) {
  const response = await httpClient.post('/auth/forgot-password', payload)
  return extractData(response)
}

export async function resetPassword(payload) {
  const response = await httpClient.post('/auth/reset-password', payload)
  return extractData(response)
}

export async function fetchMe() {
  const response = await httpClient.get('/users/me')
  return extractData(response)
}

export async function fetchProducts(query) {
  const response = await httpClient.get('/products', { params: query })
  return {
    items: Array.isArray(extractData(response)) ? extractData(response) : [],
    meta: extractMeta(response),
  }
}

export async function fetchProductById(id) {
  const response = await httpClient.get(`/products/${id}`)
  return extractData(response)
}

export async function fetchReviews(productId, query) {
  const response = await httpClient.get(`/products/${productId}/reviews`, { params: query })
  return {
    items: Array.isArray(extractData(response)) ? extractData(response) : [],
    meta: extractMeta(response),
  }
}

export async function createReview(productId, payload) {
  const response = await httpClient.post(`/products/${productId}/reviews`, payload)
  return extractData(response)
}

export async function updateReview(reviewId, payload) {
  const response = await httpClient.patch(`/reviews/${reviewId}`, payload)
  return extractData(response)
}

export async function deleteReview(reviewId) {
  const response = await httpClient.delete(`/reviews/${reviewId}`)
  return extractData(response)
}

export async function fetchCart(query = {}) {
  const response = await httpClient.get('/cart', { params: withDefaultListLimit(query) })
  const payload = extractData(response)

  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    meta: extractMeta(response),
  }
}

export async function addCartItem(payload) {
  const response = await httpClient.post('/cart/items', payload)
  return extractData(response)
}

export async function updateCartItem(id, payload) {
  const response = await httpClient.patch(`/cart/items/${id}`, payload)
  return extractData(response)
}

export async function removeCartItem(id) {
  const response = await httpClient.delete(`/cart/items/${id}`)
  return extractData(response)
}

export async function fetchAddresses(query = {}) {
  const response = await httpClient.get('/addresses', { params: withDefaultListLimit(query) })
  return {
    items: Array.isArray(extractData(response)) ? extractData(response) : [],
    meta: extractMeta(response),
  }
}

export async function createAddress(payload) {
  const response = await httpClient.post('/addresses', payload)
  return extractData(response)
}

export async function updateAddress(id, payload) {
  const response = await httpClient.patch(`/addresses/${id}`, payload)
  return extractData(response)
}

export async function deleteAddress(id) {
  const response = await httpClient.delete(`/addresses/${id}`)
  return extractData(response)
}

export async function checkout(addressId) {
  const response = await httpClient.post('/orders/checkout', { addressId })
  return extractData(response)
}

export async function fetchOrders(query) {
  const response = await httpClient.get('/orders', { params: query })
  return {
    items: Array.isArray(extractData(response)) ? extractData(response) : [],
    meta: extractMeta(response),
  }
}

export async function fetchOrderById(id) {
  const response = await httpClient.get(`/orders/${id}`)
  return extractData(response)
}

export async function cancelOrder(id) {
  const response = await httpClient.patch(`/orders/${id}/cancel`)
  return extractData(response)
}

export async function createInternalProduct(payload) {
  const response = await httpClient.post('/internal/products', payload)
  return extractData(response)
}

export async function updateInternalProduct(id, payload) {
  const response = await httpClient.patch(`/internal/products/${id}`, payload)
  return extractData(response)
}

export async function softDeleteInternalProduct(id) {
  const response = await httpClient.delete(`/internal/products/${id}`)
  return extractData(response)
}
