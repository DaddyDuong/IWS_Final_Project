import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { checkoutWithAddress, fetchAddresses, fetchCart } from '../lib/customerApi'
import { currencyFormatter, formatApiError } from '../lib/formatters'

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [feedback, setFeedback] = useState('')

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  })

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  })

  const checkoutMutation = useMutation({
    mutationFn: checkoutWithAddress,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      navigate(order?.id ? `/profile/orders/${order.id}` : '/profile/orders')
    },
    onError: (error) => {
      setFeedback(formatApiError(error, 'Checkout failed. Please try again.'))
    },
  })

  const addresses = addressesQuery.data || []
  const items = cartQuery.data || []
  const defaultAddressId = addresses.find((address) => address.isDefault)?.id || addresses[0]?.id || ''
  const effectiveSelectedAddressId =
    addresses.some((address) => address.id === selectedAddressId) ? selectedAddressId : defaultAddressId

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  function handleSubmit(event) {
    event.preventDefault()

    if (!effectiveSelectedAddressId) {
      setFeedback('Please choose a shipping address.')
      return
    }

    checkoutMutation.mutate(effectiveSelectedAddressId)
  }

  return (
    <section className="page page--customer" aria-labelledby="checkout-title">
      <p className="eyebrow">Checkout</p>
      <p className="step-label">Step 2 of 2</p>
      <h1 id="checkout-title">Checkout</h1>

      {feedback ? (
        <p className="catalog-feedback catalog-feedback--error" role="alert" aria-live="assertive">
          {feedback}
        </p>
      ) : null}

      {cartQuery.isLoading || addressesQuery.isLoading ? (
        <p role="status" aria-live="polite">
          Preparing your checkout...
        </p>
      ) : null}

      {cartQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(cartQuery.error, 'Unable to load cart items.')}
        </p>
      ) : null}

      {addressesQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(addressesQuery.error, 'Unable to load saved addresses.')}
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

      {items.length > 0 ? (
        <form className="checkout-grid" onSubmit={handleSubmit}>
          <section className="checkout-card" aria-label="Shipping address">
            <h2>Shipping address</h2>

            {addresses.length === 0 ? (
              <div className="catalog-feedback">
                <p>No saved addresses yet.</p>
                <Link className="button button--secondary" to="/profile/addresses">
                  Add address
                </Link>
              </div>
            ) : (
              <div className="address-options">
                {addresses.map((address) => (
                  <label key={address.id} className="address-option">
                    <input
                      type="radio"
                      name="addressId"
                      value={address.id}
                      checked={effectiveSelectedAddressId === address.id}
                      onChange={(event) => setSelectedAddressId(event.target.value)}
                    />
                    <span>
                      <strong>{address.receiver}</strong>
                      <span>{address.phone}</span>
                      <span>
                        {address.line1}, {address.ward}, {address.district}, {address.city}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <aside className="checkout-card checkout-card--summary" aria-label="Order summary">
            <h2>Order summary</h2>
            <p>{totalItems} item(s)</p>
            <p>Shipping fee: Free</p>
            <p>
              Total: <strong>{currencyFormatter.format(subtotal)}</strong>
            </p>
            <button
              type="submit"
              className="button button--primary"
              disabled={checkoutMutation.isPending || items.length === 0 || addresses.length === 0}
            >
              Place order
            </button>
          </aside>
        </form>
      ) : null}
    </section>
  )
}
