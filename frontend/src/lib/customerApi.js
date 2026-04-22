import { apiClient } from './apiClient'

function getPayloadData(response) {
  return response?.data?.data
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

export async function fetchOrders() {
  const response = await apiClient.get('/orders')
  const payload = getPayloadData(response)
  return Array.isArray(payload) ? payload : []
}

export async function fetchOrderById(id) {
  const response = await apiClient.get(`/orders/${id}`)
  return getPayloadData(response) ?? null
}

export async function cancelOrder(id) {
  const response = await apiClient.patch(`/orders/${id}/cancel`)
  return getPayloadData(response) ?? null
}
