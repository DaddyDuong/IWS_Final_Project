import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OrderDetailPage } from '../pages/OrderDetailPage'

const { mockedCancelOrder, mockedFetchOrderById } = vi.hoisted(() => ({
  mockedCancelOrder: vi.fn(),
  mockedFetchOrderById: vi.fn(),
}))

vi.mock('../lib/customerApi', async () => {
  const actual = await vi.importActual('../lib/customerApi')
  return {
    ...actual,
    cancelOrder: mockedCancelOrder,
    fetchOrderById: mockedFetchOrderById,
  }
})

function renderOrderDetailPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/profile/orders/order-123']}>
        <Routes>
          <Route path="/profile/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OrderDetailPage', () => {
  afterEach(() => {
    mockedCancelOrder.mockReset()
    mockedFetchOrderById.mockReset()
    vi.unstubAllGlobals()
  })

  it('requires confirmation before canceling order', async () => {
    mockedFetchOrderById.mockResolvedValue({
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

    vi.stubGlobal('confirm', vi.fn(() => false))

    renderOrderDetailPage()

    fireEvent.click(await screen.findByRole('button', { name: /cancel order/i }))

    await waitFor(() => {
      expect(globalThis.confirm).toHaveBeenCalled()
    })

    expect(mockedCancelOrder).not.toHaveBeenCalled()
  })
})
