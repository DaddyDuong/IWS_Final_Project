import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProductComparison } from '../components/ProductComparison'

const products = [
  {
    id: 'product-1',
    name: 'MacBook Air 13',
    brand: 'Apple',
    cpu: 'Apple M3',
    ramGb: 16,
    storageGb: 512,
    price: 32990000,
    stockQty: 12,
  },
  {
    id: 'product-2',
    name: 'ROG Zephyrus G14',
    brand: 'ASUS',
    cpu: 'Ryzen 9',
    ramGb: 32,
    storageGb: 1024,
    price: 52990000,
    stockQty: 4,
  },
]

function renderComparison(value = products) {
  return render(
    <MemoryRouter>
      <ProductComparison products={value} />
    </MemoryRouter>,
  )
}

describe('ProductComparison', () => {
  it('compares visible products by specs and price', () => {
    renderComparison()

    expect(screen.getByRole('heading', { name: /compare visible laptops/i })).toBeInTheDocument()
    expect(screen.getByText(/macbook air 13/i)).toBeInTheDocument()
    expect(screen.getByText(/32gb ram/i)).toBeInTheDocument()
    expect(screen.getByText(/52\.990\.000/i)).toBeInTheDocument()
  })

  it('does not render when fewer than two products are available', () => {
    const { container } = renderComparison([products[0]])
    expect(container).toBeEmptyDOMElement()
  })
})
