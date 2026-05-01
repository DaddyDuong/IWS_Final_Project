import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AccountSidebar } from '../components/layout/AccountSidebar'
import { StateBlock } from '../components/shared/StateBlock'
import { useMeQuery, useOrdersQuery } from '../hooks/useDomainData'
import { useAuthStore } from '../stores/authStore'
import { formatDateTime, formatMoney, toSlugLabel } from '../utils/format'
import styles from './AccountPage.module.css'

const quickLinks = [
  { to: '/account/orders', label: 'Order history', description: 'Track current and previous orders.' },
  { to: '/account/addresses', label: 'Saved addresses', description: 'Manage shipping destinations.' },
  { to: '/cart', label: 'Current cart', description: 'Review items and continue checkout.' },
]

export function AccountPage() {
  const setUser = useAuthStore((state) => state.setUser)
  const profileQuery = useMeQuery()
  const ordersQuery = useOrdersQuery(
    { page: 1, limit: 3, sortBy: 'placedAt', sortOrder: 'desc' },
    { enabled: Boolean(profileQuery.data) },
  )

  const profile = profileQuery.data
  const safeProfile = profile ?? {
    fullName: '',
    email: '',
    role: 'customer',
    createdAt: null,
  }

  useEffect(() => {
    if (profile) {
      setUser(profile)
    }
  }, [profile, setUser])

  const recentOrders = ordersQuery.data?.items ?? []

  return (
    <section className={styles.layout}>
      <AccountSidebar isManager={profile?.role === 'manager'} />

      <div className={styles.content}>
        <StateBlock
          isLoading={profileQuery.isLoading}
          isError={profileQuery.isError}
          error={profileQuery.error}
          isEmpty={!profile}
          emptyTitle="Profile unavailable"
          emptyMessage="Please refresh and sign in again."
          loadingText="Loading your account..."
        >
          <section className="panel">
            <header className={styles.profileHeader}>
              <div>
                <h1>{safeProfile.fullName}</h1>
                <p className="pageSubtitle">{safeProfile.email}</p>
                <p className="mutedText">Role: {toSlugLabel(safeProfile.role)}</p>
              </div>
              <span className="badge badgeSuccess">Member since {formatDateTime(safeProfile.createdAt)}</span>
            </header>
          </section>

          <section className="panel">
            <h2 className={styles.sectionTitle}>Quick access</h2>
            <div className={styles.quickGrid}>
              {quickLinks.map((link) => (
                <article key={link.to} className={styles.quickCard}>
                  <h3>{link.label}</h3>
                  <p>{link.description}</p>
                  <Link to={link.to}>Open →</Link>
                </article>
              ))}
              {safeProfile.role === 'manager' ? (
                <article className={styles.quickCard}>
                  <h3>Manager products</h3>
                  <p>Create, edit, and soft-delete catalog products.</p>
                  <Link to="/manager/studio">Open studio →</Link>
                </article>
              ) : null}
            </div>
          </section>

          <section className="panel">
            <div className={styles.recentHeader}>
              <h2 className={styles.sectionTitle}>Recent activity</h2>
              <Link to="/account/orders">View all orders</Link>
            </div>
            <StateBlock
              isLoading={ordersQuery.isLoading}
              isError={ordersQuery.isError}
              error={ordersQuery.error}
              isEmpty={!recentOrders.length}
              emptyTitle="No orders yet"
              emptyMessage="Start shopping to see your order history here."
              loadingText="Loading recent orders..."
            >
              <div className={styles.ordersList}>
                {recentOrders.map((order) => (
                  <article key={order.id} className={styles.orderRow}>
                    <div>
                      <p className={styles.orderId}>Order #{order.id.slice(0, 8)}</p>
                      <p className="mutedText">{formatDateTime(order.placedAt)}</p>
                    </div>
                    <span className="badge">{toSlugLabel(order.status)}</span>
                    <p className={styles.total}>{formatMoney(order.total)}</p>
                    <Link to={`/account/orders/${order.id}`}>Details</Link>
                  </article>
                ))}
              </div>
            </StateBlock>
          </section>
        </StateBlock>
      </div>
    </section>
  )
}
