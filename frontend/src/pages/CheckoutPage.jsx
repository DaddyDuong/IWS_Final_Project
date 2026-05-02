import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { currencyFormatter, formatApiError } from '../lib/formatters'
import { checkoutWithAddress, fetchAddresses, fetchCart, removeCartItem, addCartItem } from '../lib/customerApi'
import styles from './CheckoutPage.module.css'

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  })

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const addMutation = useMutation({
    mutationFn: addCartItem,
    onSuccess: () => {
      setDeletedItem(null)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
  })

  const [deletedItem, setDeletedItem] = useState(null)
  const [undoTimeoutId, setUndoTimeoutId] = useState(null)

  const handleRemove = (item) => {
    removeMutation.mutate(item.id, {
      onSuccess: () => {
        setDeletedItem(item)
        if (undoTimeoutId) clearTimeout(undoTimeoutId)
        const timeoutId = setTimeout(() => {
          setDeletedItem(null)
        }, 7000)
        setUndoTimeoutId(timeoutId)
      }
    })
  }

  const handleUndo = () => {
    if (deletedItem && deletedItem.product) {
      addMutation.mutate({ productId: deletedItem.product.id, quantity: deletedItem.quantity || 1 })
    }
  }

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  })

  const items = cartQuery.data || []
  const addresses = addressesQuery.data || []

  const defaultAddressId = useMemo(
    () => addresses.find((address) => address.isDefault)?.id || addresses[0]?.id || '',
    [addresses],
  )

  useEffect(() => {
    if (!selectedAddressId && defaultAddressId) {
      setSelectedAddressId(defaultAddressId)
    }
  }, [defaultAddressId, selectedAddressId])

  const effectiveSelectedAddressId =
    addresses.some((address) => address.id === selectedAddressId) ? selectedAddressId : defaultAddressId

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const shippingFee = 0
  const grandTotal = subtotal + shippingFee

  const checkoutMutation = useMutation({
    mutationFn: checkoutWithAddress,
    onSuccess: async (order) => {
      setFeedback({ message: 'Order placed successfully.', type: 'success' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ])
      navigate(`/profile/orders/${order.id}`)
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to place this order right now.'),
        type: 'error',
      })
    },
  })

  function handleSubmit(event) {
    event.preventDefault()

    if (!effectiveSelectedAddressId) {
      setFeedback({ message: 'Please choose a shipping address.', type: 'error' })
      return
    }

    checkoutMutation.mutate(effectiveSelectedAddressId)
  }

  return (
    <section className={styles.checkoutContainer} aria-labelledby="checkout-title">
      <h1 id="checkout-title" className="visually-hidden" style={{display: 'none'}}>Checkout</h1>

      {feedback.message ? (
        <p
          className={`catalog-feedback ${feedback.type === 'error' ? 'catalog-feedback--error' : 'catalog-feedback--success'}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
        >
          {feedback.message}
        </p>
      ) : null}

      {cartQuery.isLoading || addressesQuery.isLoading ? <p>Loading checkout...</p> : null}

      {cartQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(cartQuery.error, 'Unable to load cart right now.')}
        </p>
      ) : null}

      {addressesQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(addressesQuery.error, 'Unable to load addresses right now.')}
        </p>
      ) : null}

      {!cartQuery.isLoading && !cartQuery.isError && items.length === 0 ? (
        <div className="catalog-feedback">
          <p>Your cart is empty. Add items before checkout.</p>
          <div className="cta-row">
            <Link className="button button--secondary" to="/products">
              Browse products
            </Link>
          </div>
        </div>
      ) : null}

      {!cartQuery.isLoading && !cartQuery.isError && items.length > 0 ? (
        <form className={styles.checkoutGrid} onSubmit={handleSubmit}>
          {/* LEFT COLUMN */}
          <div className={styles.leftColumn}>
            {/* Choose Shipping Address */}
            <section aria-label="Shipping address">
              <div className={styles.addressHeader}>
                <h2>Choose Shipping Address</h2>
                <Link to="/profile/addresses" className={styles.addNewAddressBtn}>
                  + Add New Address
                </Link>
              </div>

              {!addressesQuery.isLoading && !addressesQuery.isError && addresses.length === 0 ? (
                <div className="catalog-feedback">
                  <p>No saved addresses yet.</p>
                </div>
              ) : null}

              {!addressesQuery.isLoading && !addressesQuery.isError && addresses.length > 0 ? (
                <div className={styles.addressOptions}>
                  {addresses.map((address) => {
                    const isSelected = effectiveSelectedAddressId === address.id
                    const isDefault = address.isDefault
                    return (
                      <label key={address.id} className={`${styles.addressCard} ${isSelected ? styles.selected : styles.unselected}`}>
                        <input
                          type="radio"
                          name="addressId"
                          value={address.id}
                          checked={isSelected}
                          disabled={checkoutMutation.isPending}
                          onChange={(event) => setSelectedAddressId(event.target.value)}
                          style={{ display: 'none' }}
                        />
                        {isSelected && <span className={styles.defaultBadge}>{isDefault ? 'DEFAULT' : 'SELECTED'}</span>}
                        <div className={styles.addressName}>{address.receiver}</div>
                        <div className={styles.addressDetails}>
                          {address.line1}, {address.ward}, {address.district}, {address.city}
                        </div>
                        <div className={styles.addressPhone}>
                          📞 {address.phone}
                        </div>
                      </label>
                    )
                  })}
                </div>
              ) : null}
            </section>

            {/* Review Items */}
            <section className={styles.reviewItemsSection} aria-label="Review Items">
              <h2 className={styles.sectionTitle}>Review Items</h2>
              <div className={styles.itemsList}>
                {items.map((item) => (
                  <div key={item.id} className={styles.itemCard}>
                    <img src={item.product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'} alt={item.product.name} className={styles.itemImage} />
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemName}>{item.product.name}</h3>
                      <p className={styles.itemSpecs}>{item.product.brand || 'No specs'}</p>
                      <div className={styles.itemMeta}>
                        <span className={styles.qtyTag}>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className={styles.itemRight}>
                      <div className={styles.itemPrice}>
                        {currencyFormatter.format(item.product.price * item.quantity)}
                      </div>
                      <button 
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => handleRemove(item)}
                        disabled={removeMutation.isPending}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className={styles.rightColumn} aria-label="Order summary">
            {/* Order Summary Card */}
            <div className={styles.summaryCard}>
              <h2>Order Summary</h2>
              
              <div className={styles.summaryRow}>
                <span>Items ({totalItems} items)</span>
                <strong>{currencyFormatter.format(subtotal)}</strong>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Shipping Fee</span>
                <span className={styles.freeBadge}>FREE</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Tax</span>
                <span>Included</span>
              </div>
              
              <hr className={styles.summaryDivider} />
              
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total Price</span>
                <span className={styles.totalValue}>{currencyFormatter.format(grandTotal)}</span>
              </div>
              
              <button
                type="submit"
                className={styles.placeOrderBtn}
                disabled={
                  items.length === 0 ||
                  addresses.length === 0 ||
                  checkoutMutation.isPending ||
                  cartQuery.isLoading ||
                  addressesQuery.isLoading
                }
              >
                {checkoutMutation.isPending ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>

            {/* Buyer's Protection Card */}
            <div className={styles.protectionCard}>
              <div className={styles.protectionIcon}>✨</div>
              <div className={styles.protectionContent}>
                <h3>Buyer's Protection</h3>
                <p>Your purchase is covered by our 2-year premium warranty and tech concierge service.</p>
              </div>
            </div>
          </aside>
        </form>
      ) : null}

      {deletedItem && (
        <div 
          className="undo-notification"
          onClick={handleUndo}
          style={{
            opacity: addMutation.isPending ? 0.7 : 1,
            pointerEvents: addMutation.isPending ? 'none' : 'auto'
          }}
        >
          {addMutation.isPending ? 'Restoring...' : 'Undo your behavior'}
        </div>
      )}
    </section>
  )
}
