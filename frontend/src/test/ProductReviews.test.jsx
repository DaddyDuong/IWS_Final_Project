import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductReviews } from '../components/ProductReviews'
import { useAuthStore } from '../stores/authStore'

const {
  mockedCreateProductReview,
  mockedDeleteProductReview,
  mockedFetchProductReviews,
  mockedFetchProfile,
  mockedUpdateProductReview,
} = vi.hoisted(() => ({
  mockedCreateProductReview: vi.fn(),
  mockedDeleteProductReview: vi.fn(),
  mockedFetchProductReviews: vi.fn(),
  mockedFetchProfile: vi.fn(),
  mockedUpdateProductReview: vi.fn(),
}))

vi.mock('../lib/customerApi', async () => {
  const actual = await vi.importActual('../lib/customerApi')
  return {
    ...actual,
    createProductReview: mockedCreateProductReview,
    deleteProductReview: mockedDeleteProductReview,
    fetchProductReviews: mockedFetchProductReviews,
    fetchProfile: mockedFetchProfile,
    updateProductReview: mockedUpdateProductReview,
  }
})

function createValidToken() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }))
  return `${header}.${payload}.signature`
}

function renderReviews() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductReviews productId="product-1" />
    </QueryClientProvider>,
  )
}

describe('ProductReviews', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
    mockedCreateProductReview.mockReset()
    mockedDeleteProductReview.mockReset()
    mockedFetchProductReviews.mockReset()
    mockedFetchProfile.mockReset()
    mockedUpdateProductReview.mockReset()
    if (vi.isMockFunction(globalThis.confirm)) {
      globalThis.confirm.mockRestore()
    }
  })

  it('renders existing reviews and prompts guests to sign in', async () => {
    mockedFetchProductReviews.mockResolvedValue([
      {
        id: 'review-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Excellent for development work.',
        user: { fullName: 'Taylor Customer' },
      },
    ])

    renderReviews()

    expect(await screen.findByText(/excellent for development work/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in to write a review/i)).toBeInTheDocument()
  })

  it('creates a review for authenticated users', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchProfile.mockResolvedValue({ id: 'user-1' })
    mockedFetchProductReviews.mockResolvedValue([])
    mockedCreateProductReview.mockResolvedValueOnce({ id: 'review-2' })

    renderReviews()

    fireEvent.change(await screen.findByLabelText(/rating/i), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText(/review comment/i), {
      target: { value: 'Strong battery and screen.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(mockedCreateProductReview).toHaveBeenCalledWith({
        productId: 'product-1',
        payload: { rating: 4, comment: 'Strong battery and screen.' },
      })
    })
  })

  it('hides owner controls for reviews written by other users', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchProfile.mockResolvedValue({ id: 'user-2' })
    mockedFetchProductReviews.mockResolvedValue([
      {
        id: 'review-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Excellent for development work.',
        user: { fullName: 'Taylor Customer' },
      },
    ])

    renderReviews()

    expect(await screen.findByText(/excellent for development work/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('confirms before deleting an owned review', async () => {
    useAuthStore.getState().setToken(createValidToken())
    mockedFetchProfile.mockResolvedValue({ id: 'user-1' })
    mockedFetchProductReviews.mockResolvedValue([
      {
        id: 'review-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Excellent for development work.',
        user: { fullName: 'Taylor Customer' },
      },
    ])
    mockedDeleteProductReview.mockResolvedValueOnce(null)
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)

    renderReviews()

    fireEvent.click(await screen.findByRole('button', { name: /delete/i }))

    expect(confirmSpy).toHaveBeenCalledWith('Delete this review?')

    expect(mockedDeleteProductReview).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(mockedDeleteProductReview).toHaveBeenCalledWith('review-1')
    })
  })
})
