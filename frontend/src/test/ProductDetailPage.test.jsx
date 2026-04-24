import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { useAuthStore } from '../stores/authStore'

const { mockedAddCartItem, mockedApiGet, mockedFetchProductReviews, mockedFetchProfile } = vi.hoisted(
  () => ({
    mockedAddCartItem: vi.fn(),
    mockedApiGet: vi.fn(),
    mockedFetchProductReviews: vi.fn(),
    mockedFetchProfile: vi.fn(),
  }),
)

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get: mockedApiGet,
  },
}))

vi.mock('../lib/customerApi', async () => {
  const actual = await vi.importActual('../lib/customerApi')
  return {
    ...actual,
    addCartItem: mockedAddCartItem,
    fetchProductReviews: mockedFetchProductReviews,
    fetchProfile: mockedFetchProfile,
  }
})

function createValidToken() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }))
  return `${header}.${payload}.signature`
}

function mockProductDetail() {
  mockedApiGet.mockResolvedValueOnce({
    data: {
      data: {
        id: 'product-1',
        brand: 'Apple',
        name: 'MacBook Air 13',
        description: 'Lightweight and fast',
        cpu: 'M3',
        ramGb: 16,
        storageGb: 512,
        screenSize: '13.6',
        stockQty: 4,
        price: 32990000,
        imageUrl: 'https://example.com/laptop.png',
      },
    },
  })
}

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderProductDetail({ queryClient = createTestQueryClient(), routes = null } = {}) {
  const routeTree = routes || <Route path="/products/:id" element={<ProductDetailPage />} />

  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/products/product-1']}>
        <Routes>{routeTree}</Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return { ...view, queryClient }
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
    mockedAddCartItem.mockReset()
    mockedApiGet.mockReset()
    mockedFetchProductReviews.mockReset()
    mockedFetchProfile.mockReset()
  })

  it('renders the product purchase panel with reviews', async () => {
    mockProductDetail()
    mockedFetchProductReviews.mockResolvedValueOnce([])

    renderProductDetail()

    expect(await screen.findByRole('heading', { name: /macbook air 13/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/purchase panel/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /reviews/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
  })

  it('redirects unauthenticated shoppers to login when adding to cart', async () => {
    mockProductDetail()
    mockedFetchProductReviews.mockResolvedValueOnce([])

    renderProductDetail({
      routes: (
        <>
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<h1>Sign in required</h1>} />
        </>
      ),
    })

    fireEvent.click(await screen.findByRole('button', { name: /add to cart/i }))

    expect(await screen.findByRole('heading', { name: /sign in required/i })).toBeInTheDocument()
    expect(mockedAddCartItem).not.toHaveBeenCalled()
  })

  it('invalidates the cart query after authenticated add-to-cart succeeds', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockProductDetail()
    mockedFetchProductReviews.mockResolvedValueOnce([])
    mockedFetchProfile.mockResolvedValueOnce({ id: 'user-1' })
    mockedAddCartItem.mockResolvedValueOnce({ id: 'cart-item-1' })
    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderProductDetail({ queryClient })

    fireEvent.click(await screen.findByRole('button', { name: /add to cart/i }))

    await waitFor(() => {
      expect(mockedAddCartItem).toHaveBeenCalledWith(
        { productId: 'product-1', quantity: 1 },
        expect.any(Object),
      )
    })
    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['cart'] })
    })
  })
})
