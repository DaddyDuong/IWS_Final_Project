import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { useAuthStore } from '../stores/authStore'

const { mockedFetchManagerCatalog, mockedFetchProfile } = vi.hoisted(() => ({
  mockedFetchManagerCatalog: vi.fn(),
  mockedFetchProfile: vi.fn(),
}))

vi.mock('../lib/customerApi', async () => {
  const actual = await vi.importActual('../lib/customerApi')
  return {
    ...actual,
    fetchManagerCatalog: mockedFetchManagerCatalog,
    fetchProfile: mockedFetchProfile,
  }
})

function createValidToken() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }))
  return `${header}.${payload}.signature`
}

function renderApp(initialEntry) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Manager route access', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchManagerCatalog.mockReset()
    mockedFetchProfile.mockReset()
  })

  afterEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  it('allows manager users to access manager products page', async () => {
    mockedFetchProfile.mockResolvedValue({
      id: 'manager-1',
      role: 'manager',
      fullName: 'Manager User',
      email: 'manager@laptop.local',
      phone: null,
    })
    mockedFetchManagerCatalog.mockResolvedValue({
      items: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    })

    renderApp('/manager/products')

    expect(await screen.findByRole('heading', { name: /internal product management/i })).toBeInTheDocument()
  })

  it('redirects non-manager users away from manager products page', async () => {
    mockedFetchProfile.mockResolvedValue({
      id: 'customer-1',
      role: 'customer',
      fullName: 'Customer User',
      email: 'customer@example.com',
      phone: null,
    })

    renderApp('/manager/products')

    expect(await screen.findByRole('heading', { name: /your profile/i })).toBeInTheDocument()
  })
})
