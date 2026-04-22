import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'
import { useAuthStore } from '../stores/authStore'

const { mockedFetchOrders } = vi.hoisted(() => ({
  mockedFetchOrders: vi.fn(),
}))

vi.mock('../lib/customerApi', async () => {
  const actual = await vi.importActual('../lib/customerApi')
  return {
    ...actual,
    fetchOrders: mockedFetchOrders,
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
    mockedFetchOrders.mockReset()
  })

  it('renders home route content with app navigation', () => {
    renderApp(['/'])

    expect(screen.getByRole('heading', { name: /discover your next laptop/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^products$/i })).toBeInTheDocument()
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
})
