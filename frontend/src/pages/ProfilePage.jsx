import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchProfile } from '../lib/customerApi'
import { formatApiError } from '../lib/formatters'

const profileQuickLinks = [
  {
    to: '/profile/orders',
    title: 'Order history',
    description: 'Review order status and track each purchase.',
  },
  {
    to: '/profile/addresses',
    title: 'Saved addresses',
    description: 'Manage your shipping details for faster checkout.',
  },
  {
    to: '/cart',
    title: 'Current cart',
    description: 'Update items and quantities before you checkout.',
  },
]

export function ProfilePage() {
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  })

  return (
    <section className="page page--customer account-page" aria-labelledby="profile-title">
      <p className="eyebrow">Account</p>
      <h1 id="profile-title">Your profile</h1>

      {profileQuery.isLoading ? <p>Loading your profile...</p> : null}

      {profileQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(profileQuery.error, 'Unable to load profile details right now.')}
        </p>
      ) : null}

      {profileQuery.data ? (
        <div className="profile-grid">
          <article className="customer-card account-card">
            <h2>Account details</h2>
            <dl className="profile-details">
              <dt>Name</dt>
              <dd>{profileQuery.data.fullName}</dd>

              <dt>Email</dt>
              <dd>{profileQuery.data.email}</dd>

              <dt>Phone</dt>
              <dd>{profileQuery.data.phone || 'Not set'}</dd>
            </dl>
          </article>

          <div className="profile-grid__links">
            {profileQuickLinks.map((item) => (
              <Link key={item.to} className="customer-card account-card customer-link-card" to={item.to}>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
