import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'
import { useAuthStore } from '../stores/authStore'

const {
  mockedFetchAddresses,
  mockedFetchCart,
  mockedFetchOrderById,
  mockedFetchOrders,
  mockedFetchProfile,
} = vi.hoisted(() => ({
  mockedFetchAddresses: vi.fn(),
  mockedFetchCart: vi.fn(),
  mockedFetchOrderById: vi.fn(),
  mockedFetchOrders: vi.fn(),
  mockedFetchProfile: vi.fn(),
}))

vi.mock('../lib/customerApi', async () => {
  const actual = await vi.importActual('../lib/customerApi')
  return {
    ...actual,
    fetchAddresses: mockedFetchAddresses,
    fetchCart: mockedFetchCart,
    fetchOrderById: mockedFetchOrderById,
    fetchOrders: mockedFetchOrders,
    fetchProfile: mockedFetchProfile,
  }
})

function createValidToken() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }))
  return `${header}.${payload}.signature`
}

function renderApp(initialEntries) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App routing shell', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
    mockedFetchAddresses.mockReset()
    mockedFetchCart.mockReset()
    mockedFetchOrderById.mockReset()
    mockedFetchOrders.mockReset()
    mockedFetchProfile.mockReset()
  })

  it('renders redesigned home route content with app navigation', () => {
    renderApp(['/'])
    const primaryNav = screen.getByRole('navigation', { name: /primary navigation/i })

    expect(screen.getByRole('heading', { name: /find the laptop that fits your next move/i })).toBeInTheDocument()
    expect(within(primaryNav).getByRole('link', { name: /^products$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /shop the catalog/i })).toBeInTheDocument()
    expect(screen.getByText(/browse focused devices/i)).toBeInTheDocument()
  })

  it('renders login page at /login', () => {
    renderApp(['/login'])

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('redirects protected routes to login when unauthenticated', () => {
    renderApp(['/profile/orders'])

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByText(/sign in to continue to your account/i)).toBeInTheDocument()
  })

  it('preserves full intended URL when redirecting to login', () => {
    renderApp(['/profile/orders?tab=open#recent'])

    expect(screen.getByText(/from \/profile\/orders\?tab=open#recent\./i)).toBeInTheDocument()
  })

  it('renders order history route when authenticated', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchOrders.mockResolvedValueOnce([])

    renderApp(['/profile/orders'])

    expect(await screen.findByRole('heading', { name: /order history/i })).toBeInTheDocument()
    expect(mockedFetchOrders).toHaveBeenCalled()
  })

  it('renders cart route when authenticated', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchCart.mockResolvedValueOnce([])

    renderApp(['/cart'])

    expect(await screen.findByRole('heading', { name: /your cart/i })).toBeInTheDocument()
    expect(await screen.findByText(/step 1 of 2/i)).toBeInTheDocument()
    expect(mockedFetchCart).toHaveBeenCalled()
  })

  it('renders checkout route when authenticated', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchCart.mockResolvedValueOnce([])
    mockedFetchAddresses.mockResolvedValueOnce([])

    renderApp(['/checkout'])

    expect(await screen.findByRole('heading', { name: /checkout/i })).toBeInTheDocument()
    expect(await screen.findByText(/step 2 of 2/i)).toBeInTheDocument()
    expect(mockedFetchCart).toHaveBeenCalled()
    expect(mockedFetchAddresses).toHaveBeenCalled()
  })

  it('renders profile route when authenticated', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchProfile.mockResolvedValueOnce({
      id: 'user-1',
      fullName: 'Taylor Customer',
      email: 'taylor@example.com',
      phone: '0900000000',
    })

    renderApp(['/profile'])

    expect(await screen.findByRole('heading', { name: /your profile/i })).toBeInTheDocument()
    expect(mockedFetchProfile).toHaveBeenCalled()
  })

  it('renders order detail route when authenticated', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchOrderById.mockResolvedValueOnce({
      id: 'order-12345678',
      status: 'pending',
      placedAt: '2026-04-22T06:00:00.000Z',
      subtotal: 32990000,
      shippingFee: 0,
      total: 32990000,
      address: {
        receiver: 'Taylor Customer',
        phone: '0900000000',
        line1: '1 Infinite Loop',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh City',
      },
      items: [
        {
          id: 'item-1',
          quantity: 1,
          lineTotal: 32990000,
          product: {
            id: 'product-1',
            name: 'MacBook Air 13',
            imageUrl: 'https://example.com/laptop.png',
          },
        },
      ],
    })

    renderApp(['/profile/orders/order-12345678'])

    expect(await screen.findByRole('heading', { name: /order #order-12/i })).toBeInTheDocument()
    expect(mockedFetchOrderById).toHaveBeenCalledWith('order-12345678')
  })

  it('renders addresses route when authenticated', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchAddresses.mockResolvedValueOnce([])

    renderApp(['/profile/addresses'])

    expect(await screen.findByRole('heading', { name: /saved addresses/i })).toBeInTheDocument()
    expect(mockedFetchAddresses).toHaveBeenCalled()
  })
})
