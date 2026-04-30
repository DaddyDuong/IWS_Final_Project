import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OrdersPage } from '../pages/OrdersPage'

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

function renderOrdersPage(initialEntry = '/profile/orders') {
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
          <Route path="/profile/orders" element={<OrdersPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OrdersPage query controls', () => {
  afterEach(() => {
    mockedFetchOrders.mockReset()
  })

  it('requests orders with normalized query params from URL', async () => {
    mockedFetchOrders.mockResolvedValueOnce({
      items: [
        {
          id: 'order-1',
          status: 'pending',
          placedAt: '2026-02-01T00:00:00.000Z',
          total: 1200000,
          items: [],
        },
      ],
      meta: {
        page: 2,
        limit: 5,
        total: 7,
        totalPages: 2,
      },
    })

    renderOrdersPage('/profile/orders?page=2&limit=5&sortBy=total&sortOrder=asc&status=pending')

    await waitFor(() => {
      expect(mockedFetchOrders).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        sortBy: 'total',
        sortOrder: 'asc',
        status: 'pending',
      })
    })

    expect(await screen.findByText(/order #order-1/i)).toBeInTheDocument()
    expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument()
  })

  it('requests next page when pagination next is clicked', async () => {
    mockedFetchOrders
      .mockResolvedValueOnce({
        items: [
          {
            id: 'order-1',
            status: 'pending',
            placedAt: '2026-02-01T00:00:00.000Z',
            total: 1200000,
            items: [],
          },
        ],
        meta: {
          page: 1,
          limit: 5,
          total: 10,
          totalPages: 2,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'order-2',
            status: 'processing',
            placedAt: '2026-02-02T00:00:00.000Z',
            total: 2200000,
            items: [],
          },
        ],
        meta: {
          page: 2,
          limit: 5,
          total: 10,
          totalPages: 2,
        },
      })

    renderOrdersPage()

    fireEvent.click(await screen.findByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(mockedFetchOrders).toHaveBeenLastCalledWith({
        page: 2,
        limit: 5,
        sortBy: 'placedAt',
        sortOrder: 'desc',
      })
    })

    expect(await screen.findByText(/order #order-2/i)).toBeInTheDocument()
  })
})
