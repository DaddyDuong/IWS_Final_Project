import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductsPage } from '../pages/ProductsPage'

const { mockedGet } = vi.hoisted(() => ({
  mockedGet: vi.fn(),
}))

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get: mockedGet,
  },
}))

function renderProductsPage(initialEntry = '/products') {
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
        <Routes>
          <Route path="/products" element={<ProductsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProductsPage', () => {
  afterEach(() => {
    mockedGet.mockReset()
  })

  it('calls products endpoint with sanitized query params', async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 'product-1',
            sku: 'LAP-001',
            name: 'MacBook Air 13',
            brand: 'Apple',
            cpu: 'Apple M3',
            ramGb: 16,
            storageGb: 512,
            screenSize: '13.6',
            price: 32990000,
            stockQty: 12,
          },
        ],
        meta: {
          page: 2,
          limit: 12,
          total: 20,
          totalPages: 2,
        },
      },
    })

    renderProductsPage('/products?page=2&sortBy=price&sortOrder=asc&inStock=true')

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith('/products', {
        params: {
          page: 2,
          limit: 12,
          sortBy: 'price',
          sortOrder: 'asc',
          inStock: true,
        },
      })
    })

    expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /view details/i })).toBeInTheDocument()
  })
})
