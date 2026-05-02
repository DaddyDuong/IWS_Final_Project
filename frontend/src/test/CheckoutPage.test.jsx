import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CheckoutPage } from '../pages/CheckoutPage'

const { mockedCheckoutWithAddress, mockedFetchAddresses, mockedFetchCart } = vi.hoisted(() => ({
  mockedCheckoutWithAddress: vi.fn(),
  mockedFetchAddresses: vi.fn(),
  mockedFetchCart: vi.fn(),
}))

vi.mock('../lib/customerApi', async () => {
  const actual = await vi.importActual('../lib/customerApi')
  return {
    ...actual,
    checkoutWithAddress: mockedCheckoutWithAddress,
    fetchAddresses: mockedFetchAddresses,
    fetchCart: mockedFetchCart,
  }
})

function renderCheckoutPage(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile/orders/:id" element={<h1>Order detail page</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CheckoutPage', () => {
  afterEach(() => {
    mockedCheckoutWithAddress.mockReset()
    mockedFetchAddresses.mockReset()
    mockedFetchCart.mockReset()
  })

  it('places an order and navigates to the order detail page', async () => {
    mockedFetchCart.mockResolvedValueOnce([
      {
        id: 'cart-item-1',
        quantity: 2,
        product: {
          id: 'product-1',
          name: 'MacBook Air 13',
          price: 32990000,
        },
      },
    ])
    mockedFetchAddresses.mockResolvedValueOnce([
      {
        id: 'address-1',
        receiver: 'Taylor Customer',
        phone: '0900000000',
        line1: '1 Infinite Loop',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        isDefault: true,
      },
    ])
    mockedCheckoutWithAddress.mockResolvedValueOnce({ id: 'order-123' })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderCheckoutPage(queryClient)

    fireEvent.click(await screen.findByRole('button', { name: /place order/i }))

    await waitFor(() => {
      expect(mockedCheckoutWithAddress).toHaveBeenCalledWith('address-1', expect.any(Object))
    })
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] })
    })
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders'] })
    })

    expect(await screen.findByRole('heading', { name: /order detail page/i })).toBeInTheDocument()
  })
})
