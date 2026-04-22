import { apiClient } from './apiClient'

export async function fetchProfile() {
  const response = await apiClient.get('/users/me')
  return response.data.data
}

export async function fetchCart() {
  const response = await apiClient.get('/cart')
  return response.data.data.items || []
}

export async function updateCartItem({ id, quantity }) {
  const response = await apiClient.patch(`/cart/items/${id}`, { quantity })
  return response.data.data
}

export async function removeCartItem(id) {
  const response = await apiClient.delete(`/cart/items/${id}`)
  return response.data.data
}

export async function fetchAddresses() {
  const response = await apiClient.get('/addresses')
  return response.data.data || []
}

export async function createAddress(payload) {
  const response = await apiClient.post('/addresses', payload)
  return response.data.data
}

export async function updateAddress({ id, payload }) {
  const response = await apiClient.patch(`/addresses/${id}`, payload)
  return response.data.data
}

export async function deleteAddress(id) {
  const response = await apiClient.delete(`/addresses/${id}`)
  return response.data.data
}

export async function checkoutWithAddress(addressId) {
  const response = await apiClient.post('/orders/checkout', { addressId })
  return response.data.data
}

export async function fetchOrders() {
  const response = await apiClient.get('/orders')
  return response.data.data || []
}

export async function fetchOrderById(id) {
  const response = await apiClient.get(`/orders/${id}`)
  return response.data.data
}

export async function cancelOrder(id) {
  const response = await apiClient.patch(`/orders/${id}/cancel`)
  return response.data.data
}
