import { NavLink, Outlet } from 'react-router-dom'

const primaryLinks = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/profile', label: 'Profile' },
  { to: '/cart', label: 'Cart' },
]

const accountLinks = [
  { to: '/login', label: 'Sign in' },
  { to: '/register', label: 'Create account' },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-nav-wrap">
        <nav className="app-nav" aria-label="Primary navigation">
          <NavLink to="/" className="brand-mark">
            Laptop Retail
          </NavLink>

          <div className="nav-links" role="list">
            {primaryLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                end={item.to === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-links nav-links--account" role="list">
            {accountLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link nav-link--account ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
