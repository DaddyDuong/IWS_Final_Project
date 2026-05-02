import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchCart, removeCartItem, addCartItem } from '../lib/customerApi'
import { formatApiError } from '../lib/formatters'

function formatVND(amount) {
  return amount.toLocaleString('en-US') + ' VND'
}

export function CartPage() {
  const queryClient = useQueryClient()

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

  const items = cartQuery.data || []

  const [quantities, setQuantities] = useState({})
  const [draftQuantities, setDraftQuantities] = useState({})
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

  useEffect(() => {
    if (cartQuery.data) {
      const initialQuantities = {}
      cartQuery.data.forEach(item => {
        initialQuantities[item.id] = Number(item.quantity || 1)
      })
      // Only set initial quantities if they haven't been set yet
      setQuantities(prev => Object.keys(prev).length === 0 ? initialQuantities : prev)
      setDraftQuantities(prev => Object.keys(prev).length === 0 ? initialQuantities : prev)
    }
  }, [cartQuery.data])

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = Number(item?.product?.price || 0)
    const quantity = quantities[item.id] !== undefined ? quantities[item.id] : Number(item?.quantity || 0)
    return sum + unitPrice * quantity
  }, 0)

  useEffect(() => {
    // Hide any footer elements while this page is mounted so the page content ends after main body
    const selectors = ['footer', '.site-footer', '.page-footer']
    const hidden = []
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        hidden.push({ el, prev: el.style.display })
        el.style.display = 'none'
      })
    })

    return () => {
      // restore previous display styles
      hidden.forEach(({ el, prev }) => {
        el.style.display = prev || ''
      })
    }
  }, [])

  return (
    <section className="page page--customer cart-screenshot" aria-labelledby="cart-title">
      <div className="container">
        <header className="cart-header">
          <h1 id="cart-title">Review Your Cart</h1>
          <p className="cart-tagline">Review the items below and continue to a secure checkout.</p>
        </header>

        <div className="cart-grid">
          <div className="cart-left-card">
            <div className="cart-card">
              {cartQuery.isLoading ? <p>Loading your selected items...</p> : null}
              {cartQuery.isError ? (
                <p className="catalog-feedback catalog-feedback--error">
                  {formatApiError(cartQuery.error, 'Unable to load your selected cart items.')}
                </p>
              ) : null}
              {!cartQuery.isLoading && !cartQuery.isError && items.length === 0 ? (
                <p className="catalog-feedback">You have not selected any items yet.</p>
              ) : null}

              {!cartQuery.isLoading && !cartQuery.isError && items.length > 0
                ? items.map((item, idx) => {
                    const product = item?.product || {}
                    const itemName = product?.name || 'Selected product'
                    const itemBrand = product?.brand || 'Brand'
                    const itemImage = product?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'
                    const itemPrice = Number(product?.price || 0)
                    const originalQuantity = Number(item?.quantity || 1)
                    const currentDraftQty = draftQuantities[item.id] !== undefined ? draftQuantities[item.id] : originalQuantity
                    const currentAppliedQty = quantities[item.id] !== undefined ? quantities[item.id] : originalQuantity

                    const handleIncrease = () => {
                      setDraftQuantities(prev => ({ ...prev, [item.id]: (prev[item.id] || originalQuantity) + 1 }))
                    }

                    const handleDecrease = () => {
                      setDraftQuantities(prev => ({ ...prev, [item.id]: Math.max(1, (prev[item.id] || originalQuantity) - 1) }))
                    }

                    const handleUpdate = () => {
                      setQuantities(prev => ({ ...prev, [item.id]: currentDraftQty }))
                    }

                    return (
                      <div key={item.id} className="cart-line">
                        <div className="cart-line__media">
                          <img src={itemImage} alt={itemName} />
                        </div>
                        <div className="cart-line__info">
                          <div>
                            <h2 className="cart-item__name">{itemName}</h2>
                            <div className="cart-item__brand">{itemBrand}</div>
                          </div>

                          <div className="cart-line__controls">
                            <div className="qty-control" role="group" aria-label="Quantity selector">
                              <button className="qty-btn" aria-label="Decrease" onClick={handleDecrease}>−</button>
                              <span className="qty-value">{currentDraftQty}</span>
                              <button className="qty-btn" aria-label="Increase" onClick={handleIncrease}>+</button>
                            </div>
                          </div>
                        </div>

                        <div className="cart-line__right">
                          <div className="cart-line__price">{formatVND(itemPrice * currentAppliedQty)}</div>
                          <div className="cart-line__links">
                            <span className="link-update" role="button" tabIndex={0} onClick={handleUpdate} style={{ cursor: 'pointer' }}>Update</span>
                            <button 
                              className="icon-trash" 
                              aria-label="Remove item" 
                              onClick={() => handleRemove(item)}
                              disabled={removeMutation.isPending}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                : null}
            </div>
          </div>

          <aside className="cart-right-card">
            <div className="summary-card">
              <h3 className="summary-title">Order Summary</h3>
              <div className="summary-row">
                <span>Items ({items.length})</span>
                <strong>{formatVND(subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <strong className="shipping-free">FREE</strong>
              </div>

              <hr className="summary-divider" />

              <div className="summary-total-label">TOTAL MONEY</div>
              <div className="summary-total-value">{formatVND(subtotal)}</div>

              <Link to="/checkout" className="button button--primary summary-cta">
                Continue to Checkout
              </Link>
            </div>
          </aside>
        </div>
      </div>

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
