import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { fetchProfile } from '../lib/customerApi'

const primaryLinks = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/cart', label: 'Cart' },
  { to: '/profile', label: 'Account' },
]

export function AppLayout() {
  const navigate = useNavigate()
  const token = useAuthStore(state => state.token)
  const clearAuth = useAuthStore(state => state.clearAuth)
  const [username, setUsername] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (token) {
      fetchProfile()
        .then(profile => {
          setUsername(profile?.fullName || null)
        })
        .catch(err => console.error('Failed to fetch profile:', err))
    } else {
      setUsername(null)
    }
  }, [token])

  const handleSignOut = () => {
    clearAuth()
    setMobileMenuOpen(false)
    navigate('/login')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="app-shell">
      <header className="app-nav-wrap">

        {/* TOP UTILITY BAR */}
        <div className="utility-bar">
          <nav aria-label="Utility navigation">
            <Link to="/" className="utility-title" onClick={closeMobileMenu}>
              IWS KHOA <span className="utility-title--light">Technology</span>
            </Link>
            <ul className="nav-links nav-links--account">
              <li className="utility-menu">
                <NavLink
                  to={username ? '/profile' : '/login'}
                  className="nav-link nav-link--utility nav-link--menu"
                  onClick={closeMobileMenu}
                >
                  {username ? username : 'Sign in'}
                </NavLink>
                <div className="utility-menu__dropdown" role="menu" aria-label="Sign in options">
                  <div className="utility-signin-panel">
                    <h3>Welcome to IWS KHOA</h3>
                    <p className="utility-signin-panel__label">My Account</p>
                    <ul className="utility-signin-panel__list">
                      <li>Place orders quickly and easily</li>
                      <li>View orders & track products infor</li>
                      <li>Create & access a list of products</li>
                    </ul>
                    {username ? (
                      <>
                        <NavLink
                          to="/profile"
                          onClick={closeMobileMenu}
                          className={({ isActive }) =>
                            `utility-signin-panel__action utility-signin-panel__action--primary ${isActive ? 'is-active' : ''}`
                          }
                        >
                          Account
                        </NavLink>
                        <button
                          onClick={handleSignOut}
                          className="utility-signin-panel__action utility-signin-panel__action--secondary utility-signout-button"
                          style={{ cursor: 'pointer' }}
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <NavLink
                          to="/login"
                          onClick={closeMobileMenu}
                          className={({ isActive }) =>
                            `utility-signin-panel__action utility-signin-panel__action--primary ${isActive ? 'is-active' : ''}`
                          }
                        >
                          Sign In
                        </NavLink>
                        <NavLink
                          to="/register"
                          onClick={closeMobileMenu}
                          className={({ isActive }) =>
                            `utility-signin-panel__action utility-signin-panel__action--secondary ${isActive ? 'is-active' : ''}`
                          }
                        >
                          Create an Account
                        </NavLink>
                      </>
                    )}
                  </div>
                </div>
              </li>
              <li>
                <a className="nav-link nav-link--utility" href="mailto:support@iwskhoa.local">
                  Contact Us
                </a>
              </li>
              <li>
                <span className="nav-link nav-link--utility nav-link--lang">
                  VN/EN
                </span>
              </li>
            </ul>
          </nav>
        </div>

        {/* BOTTOM PRIMARY NAV BAR */}
        <nav className={`app-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <ul className="nav-links nav-links--primary">
            {primaryLinks.map((item) => {
              if (item.label === 'Products') {
                return (
                  <li key={item.to} className="nav-item--dropdown">
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                      end={item.to === '/'}
                      onClick={closeMobileMenu}
                    >
                      {item.label}
                    </NavLink>
                    <div className="nav-dropdown-menu">
                      <NavLink to="/products?brand=dell" className="nav-dropdown-link" onClick={closeMobileMenu}>Laptop Dell</NavLink>
                      <NavLink to="/products?brand=acer" className="nav-dropdown-link" onClick={closeMobileMenu}>Laptop Acer</NavLink>
                      <NavLink to="/products?brand=asus" className="nav-dropdown-link" onClick={closeMobileMenu}>Laptop Asus</NavLink>
                      <NavLink to="/products?brand=gigabyte" className="nav-dropdown-link" onClick={closeMobileMenu}>Laptop Gigabyte</NavLink>
                      <NavLink to="/products?brand=hp" className="nav-dropdown-link" onClick={closeMobileMenu}>Laptop HP</NavLink>
                      <NavLink to="/products?brand=lenovo" className="nav-dropdown-link" onClick={closeMobileMenu}>Laptop Lenovo</NavLink>
                      <NavLink to="/products?brand=msi" className="nav-dropdown-link" onClick={closeMobileMenu}>Laptop MSI</NavLink>
                    </div>
                  </li>
                )
              }
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                    end={item.to === '/'}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
