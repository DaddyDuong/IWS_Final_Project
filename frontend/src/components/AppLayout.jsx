import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router-dom'
import { fetchProfile } from '../lib/customerApi'
import { useAuthStore } from '../stores/authStore'

const accountLinks = [
  { to: '/login', label: 'Sign in' },
  { to: '/register', label: 'Create account' },
]

export function AppLayout() {
  const token = useAuthStore((state) => state.token)
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
  })

  const primaryLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/cart', label: 'Cart' },
    { to: '/profile', label: 'Account' },
  ]

  if (profileQuery.data?.role === 'manager') {
    primaryLinks.push({ to: '/manager/products', label: 'Manager' })
  }

  return (
    <div className="app-shell">
      <header className="app-nav-wrap">
        <nav className="app-nav" aria-label="Primary navigation">
          <NavLink to="/" className="brand-mark" end>
            Laptop Retail
          </NavLink>

          <ul className="nav-links nav-links--primary">
            {primaryLinks.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                  end={item.to === '/'}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <ul className="nav-links nav-links--account">
            {accountLinks.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `nav-link nav-link--account ${isActive ? 'is-active' : ''}`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
