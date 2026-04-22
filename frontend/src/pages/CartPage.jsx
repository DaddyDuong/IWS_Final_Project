import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchCart, removeCartItem, updateCartItem } from '../lib/customerApi'
import { currencyFormatter, formatApiError } from '../lib/formatters'

export function CartPage() {
  const queryClient = useQueryClient()
  const [draftQuantities, setDraftQuantities] = useState({})
  const [feedback, setFeedback] = useState('')

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  })

  const updateItemMutation = useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      setFeedback('Cart item updated.')
      setDraftQuantities({})
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error) => {
      setFeedback(formatApiError(error, 'Unable to update this cart item.'))
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      setFeedback('Item removed from cart.')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error) => {
      setFeedback(formatApiError(error, 'Unable to remove this cart item.'))
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
    const nextQuantity = Number.parseInt(draftQuantities[itemId] || '0', 10)

    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      setFeedback('Quantity must be at least 1.')
      return
    }

    updateItemMutation.mutate({ id: itemId, quantity: nextQuantity })
  }

  return (
    <section className="page page--customer" aria-labelledby="cart-title">
      <p className="eyebrow">Cart</p>
      <h1 id="cart-title">Your cart</h1>

      {feedback ? <p className="catalog-feedback">{feedback}</p> : null}

      {cartQuery.isLoading ? <p>Loading cart...</p> : null}

      {cartQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(cartQuery.error, 'Unable to load your cart right now.')}
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

      {items.length > 0 ? (
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
                    max={item.product.stockQty}
                    value={draftQuantities[item.id] ?? String(item.quantity)}
                    onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                  />
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleUpdate(item.id)}
                    disabled={updateItemMutation.isPending || removeItemMutation.isPending}
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => removeItemMutation.mutate(item.id)}
                    disabled={removeItemMutation.isPending || updateItemMutation.isPending}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {items.length > 0 ? (
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
