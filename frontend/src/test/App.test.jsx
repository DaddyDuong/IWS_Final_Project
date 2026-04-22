import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App.jsx'
import { useAuthStore } from '../stores/authStore'

describe('App routing shell', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  it('renders home route content with app navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /discover your next laptop/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^products$/i })).toBeInTheDocument()
  })

  it('renders login page at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('redirects protected routes to login when unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={['/profile/orders']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByText(/sign in to continue to your account/i)).toBeInTheDocument()
  })

  it('preserves full intended URL when redirecting to login', () => {
    render(
      <MemoryRouter initialEntries={['/profile/orders?tab=open#recent']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText(/from \/profile\/orders\?tab=open#recent\./i)).toBeInTheDocument()
  })
})
