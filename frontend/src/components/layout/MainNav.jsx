import { Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useCartQuery } from '../../hooks/useDomainData'
import styles from './MainNav.module.css'

function navClassName({ isActive }) {
  return isActive ? `${styles.navLink} ${styles.isActive}` : styles.navLink
}

function utilityClassName({ isActive }) {
  return isActive
    ? `${styles.navLink} ${styles.navLinkUtility} ${styles.isActive}`
    : `${styles.navLink} ${styles.navLinkUtility}`
}

export function MainNav() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const { data } = useCartQuery({}, { enabled: Boolean(token) })
  const itemCount = (data?.items ?? []).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className={styles.header}>
      <div className={styles.utilityBar}>
        <nav aria-label="Utility">
          <h2 className={styles.utilityTitle}>
            Nova <span className={styles.utilityTitleLight}>Laptop Studio</span>
          </h2>

          <ul className={`${styles.navLinks} ${styles.navLinksAccount}`}>
            <li className={styles.utilityMenu}>
              <Link to={token ? '/account' : '/auth'} className={`${styles.navLink} ${styles.navLinkUtility}`}>Account</Link>

              <div className={styles.utilityMenuDropdown} role="menu" aria-label="Account panel">
                {token ? (
                  <>
                    <Link to="/account" className={styles.utilityMenuItem} role="menuitem">My account</Link>
                    <Link to="/account/orders" className={styles.utilityMenuItem} role="menuitem">My orders</Link>
                    <Link to="/account/addresses" className={styles.utilityMenuItem} role="menuitem">My addresses</Link>
                    {user?.role === 'manager' ? (
                      <Link to="/manager/studio" className={styles.utilityMenuItem} role="menuitem">Manager studio</Link>
                    ) : null}
                  </>
                ) : (
                  <div className={styles.utilitySigninPanel}>
                    <h3>Sign in to your account</h3>
                    <p className={styles.utilitySigninPanelLabel}>Benefits include:</p>
                    <ul className={styles.utilitySigninPanelList}>
                      <li>Faster checkout</li>
                      <li>Order tracking</li>
                      <li>Saved addresses</li>
                    </ul>
                    <Link to="/auth" className={`${styles.utilitySigninPanelAction} ${styles.utilitySigninPanelActionPrimary}`}>Sign in</Link>
                    <Link to="/auth" className={`${styles.utilitySigninPanelAction} ${styles.utilitySigninPanelActionSecondary}`}>Create account</Link>
                  </div>
                )}
              </div>
            </li>

            <li>
              <Link to="/contact" className={`${styles.navLink} ${styles.navLinkUtility}`}>
                Contact Us
              </Link>
            </li>

            <li className={styles.navLinkLangGroup}>
              <Link to="?lang=vn" className={`${styles.navLink} ${styles.navLinkLang}`}>VN/EN</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className={styles.mainBar}>
        <nav aria-label="Primary">
          <ul className={styles.navLinks}>
            <li>
              <NavLink to="/" className={navClassName} end>Home</NavLink>
            </li>
            <li>
              <NavLink to="/shop" className={navClassName}>Shop</NavLink>
            </li>
            <li>
              <NavLink to="/cart" className={utilityClassName}>
                Cart
                {itemCount > 0 ? <span className={styles.badge}>{itemCount}</span> : null}
              </NavLink>
            </li>
            <li>
              {token ? (
                <NavLink to="/account" className={utilityClassName}>Account</NavLink>
              ) : (
                <NavLink to="/auth" className={utilityClassName}>Sign in</NavLink>
              )}
            </li>
            {user?.role === 'manager' ? (
              <li>
                <NavLink to="/manager/studio" className={navClassName}>Studio</NavLink>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
    </header>
  )
}
