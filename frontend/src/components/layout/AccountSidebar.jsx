import { NavLink } from 'react-router-dom'
import styles from './AccountSidebar.module.css'

function navClassName({ isActive }) {
  return isActive ? `${styles.link} ${styles.active}` : styles.link
}

export function AccountSidebar({ isManager = false }) {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav} aria-label="Account navigation">
        <NavLink to="/account" end className={navClassName}>Your profile</NavLink>
        <NavLink to="/account/orders" className={navClassName}>Order history</NavLink>
        <NavLink to="/account/addresses" className={navClassName}>Saved addresses</NavLink>
        <NavLink to="/cart" className={navClassName}>Current cart</NavLink>
        {isManager ? <NavLink to="/manager/studio" className={navClassName}>Manager products</NavLink> : null}
      </nav>
      <section className={styles.helpCard}>
        <h4>Need help?</h4>
        <p>Our support team is available 24/7.</p>
        <a href="mailto:support@novalaptop.studio" className={styles.helpLink}>Contact support</a>
      </section>
    </aside>
  )
}
