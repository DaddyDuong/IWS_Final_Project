import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchCart, removeCartItem, updateCartItem } from '../lib/customerApi'
import { currencyFormatter, formatApiError } from '../lib/formatters'

export function CartPage() {
  const queryClient = useQueryClient()
  const [draftQuantities, setDraftQuantities] = useState({})
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  })

  const updateMutation = useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      setFeedback({ message: 'Cart item updated.', type: 'success' })
      setDraftQuantities({})
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to update this cart item.'),
        type: 'error',
      })
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      setFeedback({ message: 'Item removed from cart.', type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to remove this cart item.'),
        type: 'error',
      })
    },
  })

  const items = cartQuery.data || []

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  function handleQuantityChange(itemId, nextValue) {
    setDraftQuantities((current) => ({
      ...current,
      [itemId]: nextValue,
    }))
  }

  function handleUpdate(itemId) {
    const item = items.find((entry) => entry.id === itemId)
    const fallbackQuantity = item?.quantity ?? 1
    const nextQuantity = Number.parseInt(draftQuantities[itemId] ?? String(fallbackQuantity), 10)

    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      setFeedback({ message: 'Quantity must be at least 1.', type: 'error' })
      return
    }

    if (item && nextQuantity === item.quantity) {
      setFeedback({ message: 'Quantity is unchanged.', type: 'success' })
      return
    }

    updateMutation.mutate({ id: itemId, quantity: nextQuantity })
  }

  function handleRemove(itemId) {
    removeMutation.mutate(itemId)
  }

  return (
    <section className="page page--customer" aria-labelledby="cart-title">
      <p className="eyebrow">Cart</p>
      <p className="step-label">Step 1 of 2</p>
      <h1 id="cart-title">Your cart</h1>

      {feedback.message ? (
        <p
          className={`catalog-feedback ${feedback.type === 'error' ? 'catalog-feedback--error' : 'catalog-feedback--success'}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
        >
          {feedback.message}
        </p>
      ) : null}

      {cartQuery.isLoading ? <p>Loading cart...</p> : null}

      {cartQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(cartQuery.error, 'Unable to load cart right now.')}
        </p>
      ) : null}

      {!cartQuery.isLoading && !cartQuery.isError && items.length === 0 ? (
        <div className="catalog-feedback">
          <p>Your cart is empty.</p>
          <div className="cta-row">
            <Link className="button button--secondary" to="/products">
              Browse products
            </Link>
          </div>
        </div>
      ) : null}

      {!cartQuery.isLoading && !cartQuery.isError && items.length > 0 ? (
        <div className="cart-list">
          {items.map((item) => (
            <article key={item.id} className="cart-item">
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className="cart-item__image"
                width="180"
                height="135"
              />

              <div className="cart-item__content">
                <div>
                  <h2>{item.product.name}</h2>
                  <p className="product-specs">{item.product.brand}</p>
                  <p>{currencyFormatter.format(item.product.price)}</p>
                </div>

                <div className="cart-item__actions">
                  <label htmlFor={`quantity-${item.id}`}>Quantity</label>
                  <input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="1"
                    max={999}
                    value={draftQuantities[item.id] ?? String(item.quantity)}
                    onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                  />
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleUpdate(item.id)}
                    disabled={updateMutation.isPending || removeMutation.isPending}
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleRemove(item.id)}
                    disabled={updateMutation.isPending || removeMutation.isPending}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!cartQuery.isLoading && !cartQuery.isError && items.length > 0 ? (
        <div className="checkout-summary">
          <p>Subtotal</p>
          <strong>{currencyFormatter.format(subtotal)}</strong>
          <Link className="button button--primary" to="/checkout">
            Continue to checkout
          </Link>
        </div>
      ) : null}
    </section>
  )
}
