import { Link } from 'react-router-dom'

export function ProductsPage() {
  return (
    <section className="page" aria-labelledby="products-title">
      <p className="eyebrow">Catalog foundation</p>
      <h1 id="products-title">Products</h1>
      <p>
        Product listing UI will be implemented in later tasks. The route and layout are
        in place.
      </p>
      <Link className="inline-link" to="/cart">
        Continue to cart when ready
      </Link>
    </section>
  )
}
