import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addCartItem,
  cancelOrder,
  checkout,
  createAddress,
  createInternalProduct,
  createReview,
  deleteAddress,
  deleteReview,
  fetchAddresses,
  fetchCart,
  fetchMe,
  fetchOrderById,
  fetchOrders,
  fetchProductById,
  fetchProducts,
  fetchReviews,
  login,
  register,
  removeCartItem,
  softDeleteInternalProduct,
  updateAddress,
  updateCartItem,
  updateInternalProduct,
  updateReview,
} from '../api/services'
import { useAuthStore } from '../stores/authStore'
import { queryKeys } from './queryKeys'

export function useMeQuery() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled: Boolean(token),
    staleTime: 30_000,
  })
}

export function useCatalogQuery(query) {
  return useQuery({
    queryKey: queryKeys.catalog(query),
    queryFn: () => fetchProducts(query),
    placeholderData: (previousData) => previousData,
  })
}

export function useProductQuery(id) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => fetchProductById(id),
    enabled: Boolean(id),
  })
}

export function useReviewsQuery(productId, query) {
  return useQuery({
    queryKey: queryKeys.reviews(productId, query),
    queryFn: () => fetchReviews(productId, query),
    enabled: Boolean(productId),
  })
}

export function useCartQuery(query = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.cart(query),
    queryFn: () => fetchCart(query),
    ...options,
  })
}

export function useAddressesQuery(query = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.addresses(query),
    queryFn: () => fetchAddresses(query),
    ...options,
  })
}

export function useOrdersQuery(query, options = {}) {
  return useQuery({
    queryKey: queryKeys.orders(query),
    queryFn: () => fetchOrders(query),
    placeholderData: (previousData) => previousData,
    ...options,
  })
}

export function useOrderQuery(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => fetchOrderById(id),
    enabled: Boolean(id),
    ...options,
  })
}

export function useManagerCatalogQuery(query, options = {}) {
  return useQuery({
    queryKey: queryKeys.managerCatalog(query),
    queryFn: () => fetchProducts(query),
    placeholderData: (previousData) => previousData,
    ...options,
  })
}

export function useAuthMutations() {
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (payload) => {
      setSession(payload)
      queryClient.setQueryData(queryKeys.me, payload.user)
    },
  })

  const registerMutation = useMutation({
    mutationFn: register,
  })

  const logout = () => {
    clearSession()
    queryClient.clear()
  }

  return {
    loginMutation,
    registerMutation,
    logout,
  }
}

export function useCartMutations() {
  const queryClient = useQueryClient()

  const invalidateCart = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cart'] }),
      queryClient.invalidateQueries({ queryKey: ['catalog'] }),
    ])
  }

  return {
    addMutation: useMutation({
      mutationFn: addCartItem,
      onSuccess: invalidateCart,
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, quantity }) => updateCartItem(id, { quantity }),
      onSuccess: invalidateCart,
    }),
    removeMutation: useMutation({
      mutationFn: removeCartItem,
      onSuccess: invalidateCart,
    }),
  }
}

export function useReviewMutations(productId, query) {
  const queryClient = useQueryClient()

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.reviews(productId, query) })
  }

  return {
    createMutation: useMutation({
      mutationFn: (payload) => createReview(productId, payload),
      onSuccess: refresh,
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }) => updateReview(id, payload),
      onSuccess: refresh,
    }),
    deleteMutation: useMutation({
      mutationFn: deleteReview,
      onSuccess: refresh,
    }),
  }
}

export function useAddressMutations() {
  const queryClient = useQueryClient()

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['addresses'] })
  }

  return {
    createMutation: useMutation({
      mutationFn: createAddress,
      onSuccess: refresh,
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }) => updateAddress(id, payload),
      onSuccess: refresh,
    }),
    deleteMutation: useMutation({
      mutationFn: deleteAddress,
      onSuccess: refresh,
    }),
  }
}

export function useOrdersMutations(orderId) {
  const queryClient = useQueryClient()

  const refreshOrders = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
      queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      queryClient.invalidateQueries({ queryKey: ['cart'] }),
    ])
  }

  return {
    checkoutMutation: useMutation({
      mutationFn: checkout,
      onSuccess: refreshOrders,
    }),
    cancelMutation: useMutation({
      mutationFn: cancelOrder,
      onSuccess: refreshOrders,
    }),
  }
}

export function useManagerProductMutations() {
  const queryClient = useQueryClient()

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['manager-catalog'] })
  }

  return {
    createMutation: useMutation({
      mutationFn: createInternalProduct,
      onSuccess: refresh,
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }) => updateInternalProduct(id, payload),
      onSuccess: refresh,
    }),
    removeMutation: useMutation({
      mutationFn: softDeleteInternalProduct,
      onSuccess: refresh,
    }),
  }
}
