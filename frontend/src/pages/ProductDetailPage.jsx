import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { ProductReviews } from '../components/ProductReviews'
import { ProductImage } from '../components/ProductImage'
import { ProductCard } from '../components/ProductGrid'
import { addCartItem } from '../lib/customerApi'
import { formatApiError } from '../lib/formatters'
import { useAuthStore } from '../stores/authStore'

const decimalFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'decimal',
  maximumFractionDigits: 0,
})

async function fetchProductById(productId) {
  const response = await apiClient.get(`/products/${productId}`)
  return response.data.data
}

export function ProductDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { id } = useParams()
  const token = useAuthStore((state) => state.token)
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })
  const [selectedImageIdx, setSelectedImageIdx] = useState(1)

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: Boolean(id),
  })

  const addToCartMutation = useMutation({
    mutationFn: addCartItem,
    onSuccess: () => {
      setFeedback({ message: 'Added to your cart.', type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to add this item to your cart.'),
        type: 'error',
      })
    },
  })

  function handleAddToCart() {
    const product = productQuery.data

    if (!product || product.stockQty < 1) {
      return
    }

    if (!token) {
      navigate('/login', { replace: true, state: { from: location } })
      return
    }

    addToCartMutation.mutate({ productId: product.id, quantity: 1 })
  }

  const recommendedQuery = useQuery({
    queryKey: ['products-recommended'],
    queryFn: () => apiClient.get('/products', { params: { limit: 20 } }).then(res => res.data.data),
  })

  const recommendedProducts = useMemo(() => {
    if (!recommendedQuery.data) return []
    const shuffled = [...recommendedQuery.data].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 4)
  }, [recommendedQuery.data])

  if (productQuery.isLoading) {
    return (
      <section className="page page--detail" aria-labelledby="product-detail-title">
        <h1 id="product-detail-title">Product details</h1>
        <p>Loading product…</p>
      </section>
    )
  }

  if (productQuery.isError) {
    const status = productQuery.error?.response?.status

    if (status === 404) {
      return (
        <section className="page page--detail" aria-labelledby="product-detail-title">
          <h1 id="product-detail-title">Product details</h1>
          <p>Product not found.</p>
          <Link className="inline-link" to="/products">
            Back to catalog
          </Link>
        </section>
      )
    }

    return (
      <section className="page page--detail" aria-labelledby="product-detail-title">
        <h1 id="product-detail-title">Product details</h1>
        <p>Unable to load this product right now.</p>
        <Link className="inline-link" to="/products">
          Back to catalog
        </Link>
      </section>
    )
  }

  const product = productQuery.data

  return (
    <main className="pt-24 pb-12 px-6 lg:px-12 max-w-[1600px] mx-auto bg-background text-on-surface">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-on-surface-variant text-sm mb-10 overflow-x-auto whitespace-nowrap">
        <Link className="hover:text-primary transition-colors" to="/">Home</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link className="hover:text-primary transition-colors" to="/products">Laptops</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="font-medium text-on-surface">{product.name}</span>
      </nav>

      {/* Product Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-24">
        {/* Gallery (Left) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
            <img 
              className="w-full h-full object-contain transition-all duration-300" 
              alt={product.name} 
              src={product.imageUrl} 
              style={{ filter: `brightness(${1 - (selectedImageIdx - 1) * 0.1})` }}
            />
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedImageIdx(idx)}
                className={`aspect-square bg-surface-container-low rounded-lg transition-all cursor-pointer overflow-hidden border-2 ${idx === selectedImageIdx ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent hover:bg-surface-container-high'}`}
              >
                <img className="w-full h-full object-cover" alt={`Thumbnail ${idx}`} src={product.imageUrl} style={{ filter: `brightness(${1 - (idx - 1) * 0.1})` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Details (Right) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="mb-4">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">New Arrival</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-on-primary-fixed tracking-tighter mb-4 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center text-tertiary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
            </div>
            <span className="text-on-surface-variant text-sm border-l border-outline-variant/30 pl-4">0 Reviews</span>
          </div>
          <div className="text-5xl lg:text-6xl font-black text-primary mb-10 tracking-tighter transition-all duration-300 hover:scale-105 hover:text-blue-600 inline-block cursor-default origin-left">
            {decimalFormatter.format(product.price)} VND
          </div>

          {/* Selectors */}
          <div className="space-y-8 mb-12">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Memory (RAM)</label>
              <div className="flex gap-3">
                <button className="px-6 py-3 rounded-xl border-2 border-primary text-primary font-bold bg-primary/5 hover:bg-primary/10 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default">{product.ram || `${product.ramGb}GB LPDDR5`}</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Storage (HDD/SDD)</label>
              <div className="flex gap-3">
                <button className="px-6 py-3 rounded-xl border-2 border-primary text-primary font-bold bg-primary/5 hover:bg-primary/10 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default">{product.storage || `${product.storageGb}GB NVMe`}</button>
              </div>
            </div>
          </div>

          {feedback.message && (
            <p className={`mb-4 text-sm font-semibold ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {feedback.message}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            <button
              className="flex-1 bg-primary text-on-primary py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/20 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
              disabled={product.stockQty < 1 || addToCartMutation.isPending}
              onClick={handleAddToCart}
            >
              <span className="material-symbols-outlined">shopping_bag</span>
              {product.stockQty < 1 ? 'Out of stock' : addToCartMutation.isPending ? 'Adding…' : 'Add to Cart'}
            </button>
            <Link className="flex-1 border-2 border-primary text-primary py-4 rounded-xl font-bold text-lg hover:bg-primary/5 transition-all flex justify-center items-center" to="/products">
              Back to Catalog
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-6 py-6 border-t border-outline-variant/10">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium uppercase tracking-wider">
              <span className="material-symbols-outlined text-secondary">local_shipping</span>
              Free Shipping
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium uppercase tracking-wider">
              <span className="material-symbols-outlined text-secondary">verified_user</span>
              2 Year Warranty
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specs */}
      <section className="mb-24">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tighter mb-10">Technical Specifications</h2>
        <div className="bg-surface-container-low rounded-2xl overflow-hidden p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {[
              { label: 'Processor (CPU)', value: product.cpu },
              { label: 'Display (Screen)', value: product.screen || (product.screenSize ? `${product.screenSize} inch` : null) },
              { label: 'Graphics', value: product.graphic },
              { label: 'Battery', value: product.battery },
              { label: 'Weight', value: product.weight },
              { label: 'Dimensions', value: product.dimensions },
              { label: 'Operating System', value: product.os },
              { label: 'Ports', value: product.port },
              { label: 'Connectivity', value: product.connectivity },
              { label: 'Keyboard', value: product.keyboard },
            ]
              .map((spec, i) => (
                <div key={i} className="bg-surface-container-lowest p-6 flex flex-col gap-1">
                  <span className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">{spec.label}</span>
                  <span className="text-lg font-semibold text-primary">{spec.value || '—'}</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      <ProductReviews productId={product.id} />

      {/* Related Products */}
      {recommendedProducts.length > 0 && (
        <section>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tighter mb-10">You May Also Need</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((p) => (
              <div key={p.id} className="group bg-surface-container-lowest p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="aspect-square bg-surface-container-low rounded-xl mb-6 overflow-hidden flex items-center justify-center p-4">
                  <img className="group-hover:scale-110 transition-transform duration-500 w-full h-full object-contain" alt={p.name} src={p.imageUrl} />
                </div>
                <h3 className="font-bold text-on-surface mb-2">{p.name}</h3>
                <div className="text-primary font-bold mb-auto">{decimalFormatter.format(p.price)} VND</div>
                <button
                  className="mt-4 w-full py-2 text-xs font-bold uppercase tracking-widest text-primary border border-primary/20 rounded-lg group-hover:bg-primary group-hover:text-on-primary transition-all"
                  onClick={() => navigate(`/products/${p.id}`)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
