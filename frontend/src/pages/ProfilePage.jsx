import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { fetchProfile, fetchOrders, fetchAddresses, fetchCart, updateCartItem } from '../lib/customerApi'
import { formatApiError } from '../lib/formatters'
import { useAuthStore } from '../stores/authStore'

const sidebarLinks = [
  { label: 'Account Details', active: true },
  { label: 'Order History', active: false },
  { label: 'Saved Address', active: false },
  { label: 'Current Cart', active: false },
]

const orders = [
  {
    name: 'Lumina Zenith Pro 16"',
    details: 'Order #LMT-908341 | 16GB RAM | 1TB SSD | Graphite',
    price: '$2,499.00',
    status: 'Shipped',
    action: 'Track Order',
  },
  {
    name: 'Workstation Essential Kit',
    details: 'Order #LMT-901552 | Keyboard + Mouse + Sleeve Bundle',
    price: '$349.00',
    status: 'Delivered',
    action: 'Invoice',
  },
  {
    name: 'Lumina Ultra-Dock 4.0',
    details: 'Order #LMT-914009 | Dual 4K Output | Thunderbolt',
    price: '$299.00',
    status: 'Processing',
    action: null,
  },
  {
    name: 'Lumina Arc Mechanical Keyboard',
    details: 'Order #LMT-910440 | Low-profile switches | White',
    price: '$159.00',
    status: 'Processing',
    action: null,
  },
  {
    name: 'Lumina Precision Pen 3',
    details: 'Order #LMT-906118 | Tilt support | Magnetic charging',
    price: '$89.00',
    status: 'Delivered',
    action: 'Invoice',
  },
  {
    name: 'Lumina Noise Shield Headphones',
    details: 'Order #LMT-899201 | Adaptive ANC | 40-hour battery',
    price: '$249.00',
    status: 'Shipped',
    action: 'Track Order',
  },
]

export function ProfilePage() {
  const [activeSection, setActiveSection] = useState('profile-details')
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const queryClient = useQueryClient()

  const updateCartMutation = useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  })

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  })

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  })

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  })

  const handleSignOut = () => {
    clearAuth()
    navigate('/login')
  }

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity > 0) {
      updateCartMutation.mutate({ id: itemId, quantity: newQuantity })
    }
  }

  const profile = profileQuery.data
  const fullName = profile?.fullName || profile?.name || 'Customer'
  const email = profile?.email || 'Not provided'
  const phone = profile?.phone || 'Not provided'
  const preferredLanguage = profile?.preferredLanguage || 'English (United States)'

  const orders = ordersQuery.data || []
  const addresses = addressesQuery.data || []
  const cartItems = cartQuery.data || []
  
  // Get default address (marked as isDefault) or first address
  const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0]
  // Get newest address (sorted by createdAt, most recent first)
  const newestAddress = addresses.length > 1 
    ? [...addresses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null

  const cartTotal = cartItems
    .reduce((sum, item) => sum + (Number(item.product?.price || 0) * (item.quantity || 1)), 0)
    .toLocaleString('en-US')

  return (
    <section className="profile-dashboard" aria-labelledby="profile-title">
      <div className="profile-dashboard__layout">
        <aside className="profile-sidebar" aria-label="Account navigation">
          <p className="profile-sidebar__title">Account</p>
          <p className="profile-sidebar__subtitle">Manage your preferences</p>

          <ul className="profile-sidebar__nav">
            {sidebarLinks.map((item, index) => {
              const sectionIds = ['profile-details', 'profile-orders', 'profile-addresses', 'profile-cart']
              const sectionId = sectionIds[index]
              const isActive = activeSection === sectionId
              return (
                <li key={item.label}>
                  <button 
                    className={`profile-nav-item ${isActive ? 'is-active' : ''}`} 
                    type="button"
                    onClick={() => handleNavClick(sectionId)}
                  >
                    <span className="profile-nav-item__icon" aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="profile-sidebar__signout-wrap">
            <button className="profile-nav-item profile-nav-item--signout" type="button" onClick={handleSignOut}>
              <span className="profile-nav-item__icon" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="profile-main" id="profile-title">
          <section className="profile-header-row">
            <article className="profile-card--welcome">
              <p className="profile-card__eyebrow">Premium Member</p>
              <h1>Welcome back, {fullName}.</h1>
            </article>
          </section>

          <section className="profile-card" id="profile-details">
            <header className="profile-card__header">
              <h2>Profile Details</h2>
              <a href="#">Edit Profile</a>
            </header>

            {profileQuery.isLoading ? <p>Loading profile details...</p> : null}
            {profileQuery.isError ? (
              <p className="catalog-feedback catalog-feedback--error">
                {formatApiError(profileQuery.error, 'Unable to load profile details right now.')}
              </p>
            ) : null}

            <dl className="profile-details-grid">
              <div>
                <dt>Full Name</dt>
                <dd>{fullName}</dd>
              </div>
              <div>
                <dt>Email Address</dt>
                <dd>{email}</dd>
              </div>
              <div>
                <dt>Phone Number</dt>
                <dd>{phone}</dd>
              </div>
              <div>
                <dt>Preferred Language</dt>
                <dd>{preferredLanguage}</dd>
              </div>
            </dl>
          </section>

          <section className="profile-card profile-card--orders" id="profile-orders">
            <header className="profile-card__header">
              <h2>Recent Order History</h2>
              <Link className="profile-button" to="/profile/orders">VIEW ALL ORDER</Link>
            </header>

            {ordersQuery.isLoading ? <p>Loading orders...</p> : null}
            {ordersQuery.isError ? (
              <p className="catalog-feedback catalog-feedback--error">
                {formatApiError(ordersQuery.error, 'Unable to load orders right now.')}
              </p>
            ) : null}

            {orders.length === 0 ? (
              <div className="profile-notification-box">
                <p>No Recent Order Founded!</p>
              </div>
            ) : (
              <ul className="profile-order-list">
                {orders.slice(0, 6).map((order) => {
                  const totalPrice = order.total || 0
                  const statusLabel = order.status || 'Processing'
                  return (
                    <li className="profile-order-item" key={order.id}>
                      <div>
                        <p className="profile-order-item__name">Order #{order.id?.slice(-8)}</p>
                        <p className="profile-order-item__meta">{order.items?.length || 0} item(s) • Created {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="profile-order-item__right">
                        <p className="profile-order-item__price">{Math.round(totalPrice).toLocaleString('en-US')} VND</p>
                        <p className={`profile-order-status profile-order-status--${statusLabel.toLowerCase()}`}>
                          {statusLabel}
                        </p>
                        <Link to={`/profile/orders/${order.id}`}>Details</Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="profile-bottom-grid">
            <article className="profile-card" id="profile-addresses">
              <header className="profile-card__header">
                <h2>Default Address</h2>
                <Link to="/profile/addresses">Manage Addresses</Link>
              </header>
              {addressesQuery.isLoading ? <p>Loading addresses...</p> : null}
              {addressesQuery.isError ? (
                <p className="catalog-feedback catalog-feedback--error">
                  {formatApiError(addressesQuery.error, 'Unable to load addresses right now.')}
                </p>
              ) : null}
              
              <div className="profile-addresses-grid">
                {defaultAddress ? (
                  <address className="profile-address-box">
                    <span className="profile-address-label">Default Address</span>
                    <strong>{defaultAddress.receiver || 'Your Name'}</strong>
                    <span>{defaultAddress.line1}, {defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.city}</span>
                    <p className="profile-address__phone">{defaultAddress.phone}</p>
                  </address>
                ) : (
                  <div className="profile-address-box profile-address-box--empty">
                    <span className="profile-address-label">Default Address</span>
                    <p>No default address. <Link to="/profile/addresses">Add one now</Link>.</p>
                  </div>
                )}
                
                {newestAddress ? (
                  <address className="profile-address-box">
                    <span className="profile-address-label">Recently Added</span>
                    <strong>{newestAddress.receiver || 'Your Name'}</strong>
                    <span>{newestAddress.line1}, {newestAddress.ward}, {newestAddress.district}, {newestAddress.city}</span>
                    <p className="profile-address__phone">{newestAddress.phone}</p>
                  </address>
                ) : null}
              </div>
            </article>

            <article className="profile-card profile-card--cart" id="profile-cart">
              <header className="profile-card__header">
                <h2>Current Cart</h2>
                <span className="profile-cart-icon" aria-hidden="true" />
              </header>
              {cartQuery.isLoading ? <p>Loading cart...</p> : null}
              {cartQuery.isError ? (
                <p className="catalog-feedback catalog-feedback--error">
                  {formatApiError(cartQuery.error, 'Unable to load cart right now.')}
                </p>
              ) : null}
              {cartItems.length > 0 ? (
                <div className="profile-card__content">
                  <ul className="profile-mini-cart-list">
                    {cartItems.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        <span className="profile-mini-cart-item__image" aria-hidden="true" />
                        <div>
                          <p>{item.product?.name || item.name || 'Product'}</p>
                          <small>{Number(item.product?.price || 0).toLocaleString('en-US')} VND × {item.quantity || 1}</small>
                        </div>
                        <div className="profile-cart-item-quantity">
                          <button 
                            className="profile-cart-qty-btn profile-cart-qty-btn--down"
                            onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                            type="button"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="profile-cart-qty-display">{item.quantity || 1}</span>
                          <button 
                            className="profile-cart-qty-btn profile-cart-qty-btn--up"
                            onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                            type="button"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="profile-cart-total">
                    <span>Total</span>
                    <strong>{cartTotal} VND</strong>
                  </div>
                  <Link className="profile-button profile-button--full" to="/checkout">
                    Proceed to Checkout
                  </Link>
                </div>
              ) : (
                <p>Your cart is empty. <Link to="/products">Start shopping</Link>.</p>
              )}
            </article>
          </section>
        </main>
      </div>
    </section>
  )
}
