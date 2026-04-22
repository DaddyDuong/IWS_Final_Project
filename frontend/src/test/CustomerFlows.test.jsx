import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CartPage } from '../pages/CartPage'

const { mockedFetchCart, mockedRemoveCartItem, mockedUpdateCartItem } = vi.hoisted(() => ({
  mockedFetchCart: vi.fn(),
  mockedRemoveCartItem: vi.fn(),
  mockedUpdateCartItem: vi.fn(),
}))

vi.mock('../lib/customerApi', async () => {
  const actual = await vi.importActual('../lib/customerApi')
  return {
    ...actual,
    fetchCart: mockedFetchCart,
    removeCartItem: mockedRemoveCartItem,
    updateCartItem: mockedUpdateCartItem,
  }
})

function renderCartPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Customer flow interactions', () => {
  afterEach(() => {
    mockedFetchCart.mockReset()
    mockedRemoveCartItem.mockReset()
    mockedUpdateCartItem.mockReset()
  })

  it('removes an item from cart through mutation', async () => {
    mockedFetchCart
      .mockResolvedValueOnce([
        {
          id: 'cart-item-1',
          productId: 'product-1',
          quantity: 1,
          product: {
            id: 'product-1',
            name: 'MacBook Air 13',
            brand: 'Apple',
            price: 32990000,
            stockQty: 12,
            imageUrl: 'https://example.com/laptop.png',
          },
        },
      ])
      .mockResolvedValueOnce([])

    mockedRemoveCartItem.mockResolvedValueOnce({
      id: 'cart-item-1',
    })

    renderCartPage()

    expect(await screen.findByRole('heading', { name: /your cart/i })).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: /remove/i }))

    await waitFor(() => {
      expect(mockedRemoveCartItem).toHaveBeenCalledWith('cart-item-1', expect.any(Object))
    })

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument()
  })
})
