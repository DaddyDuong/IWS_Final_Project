import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { useAuthStore } from '../stores/authStore'

const { mockedApiGet, mockedApiPost, mockedAddCartItem } = vi.hoisted(() => ({
  mockedApiGet: vi.fn(),
  mockedApiPost: vi.fn(),
  mockedAddCartItem: vi.fn(),
}))

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get: mockedApiGet,
    post: mockedApiPost,
  },
}))

vi.mock('../lib/customerApi', async () => {
  const actual = await vi.importActual('../lib/customerApi')
  return {
    ...actual,
    addCartItem: mockedAddCartItem,
  }
})

function createValidToken() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }))
  return `${header}.${payload}.signature`
}

function renderWithProviders(initialEntries, routes) {
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
        <Routes>{routes}</Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('auth and catalog actions', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
    mockedApiGet.mockReset()
    mockedApiPost.mockReset()
    mockedAddCartItem.mockReset()
  })

  it('logs in and redirects to intended page', async () => {
    const token = createValidToken()
    mockedApiPost.mockResolvedValueOnce({
      data: {
        data: {
          token,
        },
      },
    })

    renderWithProviders(
      [{ pathname: '/login', state: { from: '/checkout' } }],
      <>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/checkout" element={<h1>Checkout destination</h1>} />
      </>,
    )

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'strong-password' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/auth/login', {
        email: 'alice@example.com',
        password: 'strong-password',
      })
    })

    expect(await screen.findByRole('heading', { name: /checkout destination/i })).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBe(token)
  })

  it('registers a user then redirects to login', async () => {
    mockedApiPost.mockResolvedValueOnce({
      data: {
        data: { id: 'user-1' },
      },
    })

    renderWithProviders(
      ['/register'],
      <>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<h1>Sign in page</h1>} />
      </>,
    )

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Alice Nguyen' } })
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'strong-password' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/auth/register', {
        email: 'alice@example.com',
        password: 'strong-password',
        fullName: 'Alice Nguyen',
      })
    })

    expect(await screen.findByRole('heading', { name: /sign in page/i })).toBeInTheDocument()
  })

  it('submits forgot-password request and shows response message', async () => {
    mockedApiPost.mockResolvedValueOnce({
      data: {
        data: {
          message: 'Reset email sent',
        },
      },
    })

    renderWithProviders(
      ['/forgot-password'],
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />,
    )

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'alice@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'alice@example.com',
      })
    })

    expect(await screen.findByText(/reset email sent/i)).toBeInTheDocument()
  })

  it('renders demo reset token from forgot-password response', async () => {
    const mockedWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: mockedWriteText,
      },
    })

    mockedApiPost.mockResolvedValueOnce({
      data: {
        data: {
          message: 'Reset email sent',
          demoResetToken: 'demo-token-123',
        },
      },
    })

    renderWithProviders(
      ['/forgot-password'],
      <>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<h1>Reset destination</h1>} />
      </>,
    )

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'alice@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByLabelText(/demo reset token/i)).toHaveValue('demo-token-123')

    fireEvent.click(screen.getByRole('button', { name: /copy token/i }))

    await waitFor(() => {
      expect(mockedWriteText).toHaveBeenCalledWith('demo-token-123')
    })

    expect(screen.getByRole('link', { name: /continue to reset password/i })).toHaveAttribute(
      'href',
      '/reset-password?token=demo-token-123',
    )
  })

  it('submits reset-password request and shows success message', async () => {
    mockedApiPost.mockResolvedValueOnce({
      data: {
        data: {
          message: 'Password reset successfully',
        },
      },
    })

    renderWithProviders(
      ['/reset-password?token=demo-reset-token'],
      <Route path="/reset-password" element={<ResetPasswordPage />} />,
    )

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'new-strong-password' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'new-strong-password' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'demo-reset-token',
        newPassword: 'new-strong-password',
      })
    })

    expect(await screen.findByText(/password reset successfully/i)).toBeInTheDocument()
  })

  it('adds in-stock product to cart from detail page', async () => {
    useAuthStore.getState().setToken(createValidToken())

    mockedApiGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 'product-1',
          brand: 'Apple',
          name: 'MacBook Air 13',
          description: 'Lightweight and fast',
          cpu: 'M3',
          ramGb: 16,
          storageGb: 512,
          screenSize: '13.6',
          stockQty: 4,
          price: 32990000,
          imageUrl: 'https://example.com/laptop.png',
        },
      },
    })
    mockedAddCartItem.mockResolvedValueOnce({ id: 'item-1' })

    renderWithProviders(
      ['/products/product-1'],
      <Route path="/products/:id" element={<ProductDetailPage />} />,
    )

    fireEvent.click(await screen.findByRole('button', { name: /add to cart/i }))

    await waitFor(() => {
      expect(mockedAddCartItem).toHaveBeenCalledWith(
        { productId: 'product-1', quantity: 1 },
        expect.any(Object),
      )
    })
    expect(await screen.findByText(/added to your cart/i)).toBeInTheDocument()
  })
})
