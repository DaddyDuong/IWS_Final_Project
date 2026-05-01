import { Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useCartQuery } from '../../hooks/useDomainData'
import styles from './MainNav.module.css'

function activeClassName({ isActive }) {
  return isActive ? `${styles.link} ${styles.active}` : styles.link
}

export function MainNav() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const { data } = useCartQuery({}, { enabled: Boolean(token) })
  const itemCount = (data?.items ?? []).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className={styles.header}>
      <div className={styles.brandRow}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark}>N</span>
          <span>Nova Laptop Studio</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <NavLink to="/" className={activeClassName} end>Home</NavLink>
          <NavLink to="/shop" className={activeClassName}>Shop</NavLink>
          <NavLink to="/cart" className={activeClassName}>Cart</NavLink>
          <NavLink to="/account" className={activeClassName}>Account</NavLink>
          {user?.role === 'manager' ? (
            <NavLink to="/manager/studio" className={activeClassName}>Studio</NavLink>
          ) : null}
        </nav>

        <div className={styles.actions}>
          <Link to="/cart" className={styles.iconButton} aria-label="Open cart">
            🛒
            {itemCount > 0 ? <span className={styles.badge}>{itemCount}</span> : null}
          </Link>
          <Link to={token ? '/account' : '/auth'} className={styles.iconButton} aria-label="Account">
            👤
          </Link>
        </div>
      </div>
    </header>
  )
}
