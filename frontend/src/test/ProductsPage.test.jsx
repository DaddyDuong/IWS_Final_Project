import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
          {
            id: 'product-2',
            sku: 'LAP-002',
            name: 'ROG Zephyrus G14',
            brand: 'ASUS',
            cpu: 'Ryzen 9',
            ramGb: 32,
            storageGb: 1024,
            screenSize: '14',
            price: 52990000,
            stockQty: 4,
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
    expect(await screen.findAllByRole('link', { name: /view details/i })).toHaveLength(6)
    expect(await screen.findByRole('heading', { name: /compare visible laptops/i })).toBeInTheDocument()
  })

  it('requests the next page when pagination next button is clicked', async () => {
    mockedGet
      .mockResolvedValueOnce({
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
            page: 1,
            limit: 12,
            total: 30,
            totalPages: 3,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'product-2',
              sku: 'LAP-002',
              name: 'MacBook Pro 14',
              brand: 'Apple',
              cpu: 'Apple M3 Pro',
              ramGb: 18,
              storageGb: 512,
              screenSize: '14.2',
              price: 45990000,
              stockQty: 6,
            },
          ],
          meta: {
            page: 2,
            limit: 12,
            total: 30,
            totalPages: 3,
          },
        },
      })

    renderProductsPage('/products?page=1')

    expect(await screen.findByRole('button', { name: /next/i })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(mockedGet).toHaveBeenLastCalledWith('/products', {
        params: {
          page: 2,
          limit: 12,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      })
    })

    expect(await screen.findByText(/page 2 of 3/i)).toBeInTheDocument()
  })

  it('shows an inline fallback instead of broken placeholder product imagery', async () => {
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
            imageUrl: 'https://example.com/laptop.png',
          },
        ],
        meta: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1,
        },
      },
    })

    renderProductsPage()

    expect(await screen.findByText(/image unavailable/i)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /macbook air 13/i })).not.toBeInTheDocument()
  })
})
