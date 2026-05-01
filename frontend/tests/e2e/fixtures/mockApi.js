import { expect } from '@playwright/test'

function nowIso(offsetMinutes = 0) {
  const base = new Date('2026-04-30T10:00:00.000Z').getTime()
  return new Date(base + (offsetMinutes * 60_000)).toISOString()
}

function parseListQuery(url, defaults = { page: 1, limit: 10 }) {
  const pageRaw = Number(url.searchParams.get('page'))
  const limitRaw = Number(url.searchParams.get('limit'))

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : defaults.page
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : defaults.limit

  return { page, limit }
}

function toMeta(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  }
}

function paginate(items, page, limit) {
  const start = (page - 1) * limit
  return items.slice(start, start + limit)
}

function sortItems(items, sortBy, sortOrder) {
  const direction = sortOrder === 'asc' ? 1 : -1

  return [...items].sort((left, right) => {
    const a = left?.[sortBy]
    const b = right?.[sortBy]

    if (a === b) return 0
    if (a == null) return 1
    if (b == null) return -1

    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * direction
    }

    return String(a).localeCompare(String(b)) * direction
  })
}

function createMockDb() {
  const manager = {
    id: 'user-manager',
    email: 'manager@laptop.local',
    fullName: 'Store Manager',
    phone: '+1 (555) 0100',
    role: 'manager',
    createdAt: nowIso(-120000),
    updatedAt: nowIso(-120000),
  }

  const customer = {
    id: 'user-customer',
    email: 'john.doe@email.com',
    fullName: 'John Doe',
    phone: '+1 (555) 222-1010',
    role: 'customer',
    createdAt: nowIso(-90000),
    updatedAt: nowIso(-90000),
  }

  const products = [
    {
      id: 'prod-2', sku: 'RL-2026-002', name: 'Dell XPS 14 (9440)', brand: 'Dell', cpu: 'Intel Core Ultra 7 155H', ramGb: 16, storageGb: 512, screenSize: '14.5', price: 1999, stockQty: 8, description: 'Premium 14-inch productivity machine with modern industrial design.', imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-dell-xps-14-9440.png', createdAt: nowIso(-39000), updatedAt: nowIso(-1000), isDeleted: false,
    },
    {
      id: 'prod-4', sku: 'RL-2026-004', name: 'ThinkPad X1 Carbon Gen 12', brand: 'Lenovo', cpu: 'Intel Core Ultra 7 155U', ramGb: 16, storageGb: 512, screenSize: '14.0', price: 1749, stockQty: 7, description: 'Business-focused ultralight laptop with durable premium chassis.', imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-lenovo-thinkpad-x1-carbon-gen12.png', createdAt: nowIso(-37000), updatedAt: nowIso(-1000), isDeleted: false,
    },
    {
      id: 'prod-5', sku: 'RL-2026-005', name: 'HP Spectre x360 14 (2024)', brand: 'HP', cpu: 'Intel Core Ultra 7 155H', ramGb: 16, storageGb: 1024, screenSize: '14.0', price: 1599, stockQty: 9, description: 'Premium 2-in-1 laptop with convertible flexibility.', imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-hp-spectre-x360-14-2024.png', createdAt: nowIso(-36000), updatedAt: nowIso(-1000), isDeleted: false,
    },
    {
      id: 'prod-6', sku: 'RL-2026-006', name: 'Surface Laptop 7 (13.8")', brand: 'Microsoft', cpu: 'Snapdragon X Elite', ramGb: 16, storageGb: 512, screenSize: '13.8', price: 1399, stockQty: 10, description: 'Modern ultraportable laptop designed for all-day productivity.', imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-surface-laptop-7-13-8.png', createdAt: nowIso(-35000), updatedAt: nowIso(-1000), isDeleted: false,
    },
  ]

  const reviews = [
    {
      id: 'review-1', userId: customer.id, productId: 'prod-2', rating: 5, comment: 'Excellent performance and build quality.', createdAt: nowIso(-3000), updatedAt: nowIso(-3000),
      user: { id: customer.id, fullName: customer.fullName },
    },
    {
      id: 'review-2', userId: 'user-extra', productId: 'prod-2', rating: 4, comment: 'Great laptop for productivity.', createdAt: nowIso(-2800), updatedAt: nowIso(-2800),
      user: { id: 'user-extra', fullName: 'Samantha L.' },
    },
  ]

  const cartItems = [
    { id: 'cart-1', userId: customer.id, productId: 'prod-2', quantity: 1, createdAt: nowIso(-2000), updatedAt: nowIso(-2000) },
    { id: 'cart-2', userId: customer.id, productId: 'prod-4', quantity: 1, createdAt: nowIso(-1900), updatedAt: nowIso(-1900) },
  ]

  const addresses = [
    { id: 'addr-1', userId: customer.id, receiver: 'John Doe', phone: '+1 (555) 222-1010', line1: '123 Market Street', ward: 'Ward 4', district: 'Downtown', city: 'Austin', isDefault: true, createdAt: nowIso(-1500), updatedAt: nowIso(-1500) },
    { id: 'addr-2', userId: customer.id, receiver: 'John Doe', phone: '+1 (555) 222-1010', line1: '500 Tech Ridge Blvd', ward: 'Ward 8', district: 'Northside', city: 'Austin', isDefault: false, createdAt: nowIso(-1400), updatedAt: nowIso(-1400) },
  ]

  const orders = [
    {
      id: 'order-1',
      userId: customer.id,
      addressId: 'addr-1',
      status: 'delivered',
      subtotal: 3398,
      shippingFee: 0,
      total: 3398,
      placedAt: nowIso(-7000),
      createdAt: nowIso(-7000),
      updatedAt: nowIso(-6900),
      items: [
        { id: 'order-item-1', orderId: 'order-1', productId: 'prod-2', quantity: 1, unitPrice: 1999, lineTotal: 1999 },
        { id: 'order-item-2', orderId: 'order-1', productId: 'prod-6', quantity: 1, unitPrice: 1399, lineTotal: 1399 },
      ],
    },
    {
      id: 'order-2',
      userId: customer.id,
      addressId: 'addr-2',
      status: 'processing',
      subtotal: 1749,
      shippingFee: 0,
      total: 1749,
      placedAt: nowIso(-6000),
      createdAt: nowIso(-6000),
      updatedAt: nowIso(-5900),
      items: [
        { id: 'order-item-3', orderId: 'order-2', productId: 'prod-4', quantity: 1, unitPrice: 1749, lineTotal: 1749 },
      ],
    },
  ]

  return {
    users: { manager, customer },
    products,
    reviews,
    cartItems,
    addresses,
    orders,
    tokens: {
      manager: 'token-manager',
      customer: 'token-customer',
    },
  }
}

function buildOrderPayload(order, db) {
  const address = db.addresses.find((item) => item.id === order.addressId)

  const items = order.items.map((item) => {
    const product = db.products.find((entry) => entry.id === item.productId)

    return {
      id: item.id,
      productId: item.productId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        imageUrl: product.imageUrl,
      },
    }
  })

  return {
    id: order.id,
    userId: order.userId,
    addressId: order.addressId,
    status: order.status,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    placedAt: order.placedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    address,
    items,
  }
}

function isAuthorized(request, db) {
  const header = request.headers().authorization

  if (!header || !header.startsWith('Bearer ')) {
    return null
  }

  const token = header.slice('Bearer '.length)
  if (token === db.tokens.customer) return db.users.customer
  if (token === db.tokens.manager) return db.users.manager
  return null
}

function json(route, status, body) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function parseBody(request) {
  try {
    return request.postDataJSON() ?? {}
  } catch {
    return {}
  }
}

function filterProducts(products, url) {
  let list = products.filter((item) => !item.isDeleted)

  const q = url.searchParams.get('q')?.trim().toLowerCase()
  const brand = url.searchParams.get('brand')?.trim().toLowerCase()
  const cpu = url.searchParams.get('cpu')?.trim().toLowerCase()
  const ram = Number(url.searchParams.get('ram'))
  const storage = Number(url.searchParams.get('storage'))
  const minPriceParam = url.searchParams.get('minPrice')
  const maxPriceParam = url.searchParams.get('maxPrice')
  const minPrice = minPriceParam === null ? undefined : Number(minPriceParam)
  const maxPrice = maxPriceParam === null ? undefined : Number(maxPriceParam)
  const inStock = url.searchParams.get('inStock')

  if (q) {
    list = list.filter((item) => [item.name, item.brand, item.cpu, item.description].join(' ').toLowerCase().includes(q))
  }

  if (brand) {
    list = list.filter((item) => item.brand.toLowerCase().includes(brand))
  }

  if (cpu) {
    list = list.filter((item) => item.cpu.toLowerCase().includes(cpu))
  }

  if (Number.isFinite(ram) && ram > 0) {
    list = list.filter((item) => item.ramGb === ram)
  }

  if (Number.isFinite(storage) && storage > 0) {
    list = list.filter((item) => item.storageGb === storage)
  }

  if (minPriceParam !== null && Number.isFinite(minPrice)) {
    list = list.filter((item) => item.price >= minPrice)
  }

  if (maxPriceParam !== null && Number.isFinite(maxPrice)) {
    list = list.filter((item) => item.price <= maxPrice)
  }

  if (inStock === 'true') {
    list = list.filter((item) => item.stockQty > 0)
  }

  if (inStock === 'false') {
    list = list.filter((item) => item.stockQty <= 0)
  }

  const sortBy = url.searchParams.get('sortBy') || 'createdAt'
  const sortOrder = url.searchParams.get('sortOrder') || 'desc'
  return sortItems(list, sortBy, sortOrder)
}

function responseForScenario(pathname, scenario) {
  if (scenario !== 'error') {
    return null
  }

  if (
    pathname === '/products'
    || pathname.startsWith('/products/')
    || pathname === '/cart'
    || pathname === '/orders'
    || pathname === '/addresses'
  ) {
    return { status: 500, body: { success: false, message: 'Mocked server error' } }
  }

  return null
}

export async function installMockApi(page, options = {}) {
  const db = createMockDb()
  const globalScenario = options.scenario ?? 'success'

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const pathname = url.pathname.replace('/api/v1', '')
    const scenario = url.searchParams.get('__mockState') ?? globalScenario

    if (scenario === 'loading') {
      await new Promise((resolve) => setTimeout(resolve, 700))
    }

    const scenarioError = responseForScenario(pathname, scenario)
    if (scenarioError) {
      return json(route, scenarioError.status, scenarioError.body)
    }

    const user = isAuthorized(request, db)

    if (pathname === '/auth/login' && request.method() === 'POST') {
      const body = await parseBody(request)
      const sessionUser = body.email === db.users.manager.email ? db.users.manager : db.users.customer
      const token = sessionUser.role === 'manager' ? db.tokens.manager : db.tokens.customer

      return json(route, 200, {
        success: true,
        data: { token, user: sessionUser },
      })
    }

    if (pathname === '/auth/register' && request.method() === 'POST') {
      const body = await parseBody(request)
      const created = {
        id: `user-${Date.now()}`,
        email: body.email,
        fullName: body.fullName,
        phone: body.phone ?? '',
        role: 'customer',
        createdAt: nowIso(-50),
        updatedAt: nowIso(-50),
      }
      return json(route, 201, {
        success: true,
        data: { token: db.tokens.customer, user: created },
      })
    }

    if (pathname === '/auth/forgot-password' && request.method() === 'POST') {
      return json(route, 200, {
        success: true,
        data: {
          message: 'If an account with that email exists, password reset instructions have been sent.',
          demoResetToken: 'demo-reset-token',
        },
      })
    }

    if (pathname === '/auth/reset-password' && request.method() === 'POST') {
      return json(route, 200, {
        success: true,
        data: { message: 'Password reset successfully' },
      })
    }

    if (pathname === '/users/me' && request.method() === 'GET') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }
      return json(route, 200, { success: true, data: user })
    }

    if (pathname === '/products' && request.method() === 'GET') {
      let products = filterProducts(db.products, url)

      if (scenario === 'empty') {
        products = []
      }

      const { page: pageValue, limit } = parseListQuery(url, { page: 1, limit: 12 })
      const paged = paginate(products, pageValue, limit)

      return json(route, 200, {
        success: true,
        data: paged,
        meta: toMeta(products.length, pageValue, limit),
      })
    }

    if (pathname.startsWith('/products/') && pathname.endsWith('/reviews') && request.method() === 'GET') {
      const productId = pathname.split('/')[2]

      if (!db.products.some((product) => product.id === productId && !product.isDeleted)) {
        return json(route, 404, { success: false, message: 'Product not found' })
      }

      let list = db.reviews.filter((review) => review.productId === productId)

      if (scenario === 'empty') {
        list = []
      }

      const rating = Number(url.searchParams.get('rating'))
      if (Number.isFinite(rating) && rating >= 1) {
        list = list.filter((review) => review.rating === rating)
      }

      const sortBy = url.searchParams.get('sortBy') || 'createdAt'
      const sortOrder = url.searchParams.get('sortOrder') || 'desc'
      list = sortItems(list, sortBy, sortOrder)

      const { page: pageValue, limit } = parseListQuery(url, { page: 1, limit: 5 })
      const paged = paginate(list, pageValue, limit)

      return json(route, 200, {
        success: true,
        data: paged,
        meta: toMeta(list.length, pageValue, limit),
      })
    }

    if (pathname.startsWith('/products/') && pathname.endsWith('/reviews') && request.method() === 'POST') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const productId = pathname.split('/')[2]
      const body = await parseBody(request)

      const created = {
        id: `review-${Date.now()}`,
        userId: user.id,
        productId,
        rating: Number(body.rating),
        comment: body.comment,
        createdAt: nowIso(-10),
        updatedAt: nowIso(-10),
        user: {
          id: user.id,
          fullName: user.fullName,
        },
      }

      db.reviews.unshift(created)

      return json(route, 201, {
        success: true,
        data: created,
      })
    }

    if (pathname.startsWith('/products/') && request.method() === 'GET') {
      const productId = pathname.split('/')[2]
      const product = db.products.find((entry) => entry.id === productId && !entry.isDeleted)

      if (!product) {
        return json(route, 404, { success: false, message: 'Product not found' })
      }

      return json(route, 200, { success: true, data: product })
    }

    if (pathname.startsWith('/reviews/') && request.method() === 'PATCH') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const reviewId = pathname.split('/')[2]
      const body = await parseBody(request)
      const review = db.reviews.find((entry) => entry.id === reviewId && entry.userId === user.id)

      if (!review) {
        return json(route, 404, { success: false, message: 'Review not found' })
      }

      review.rating = Number(body.rating)
      review.comment = body.comment
      review.updatedAt = nowIso(-8)

      return json(route, 200, { success: true, data: review })
    }

    if (pathname.startsWith('/reviews/') && request.method() === 'DELETE') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const reviewId = pathname.split('/')[2]
      const index = db.reviews.findIndex((entry) => entry.id === reviewId && entry.userId === user.id)

      if (index === -1) {
        return json(route, 404, { success: false, message: 'Review not found' })
      }

      const [deleted] = db.reviews.splice(index, 1)
      return json(route, 200, { success: true, data: deleted })
    }

    if (pathname === '/cart' && request.method() === 'GET') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      let items = db.cartItems
        .filter((entry) => entry.userId === user.id)
        .map((entry) => {
          const product = db.products.find((item) => item.id === entry.productId)
          return {
            ...entry,
            product: {
              id: product.id,
              sku: product.sku,
              name: product.name,
              brand: product.brand,
              cpu: product.cpu,
              ramGb: product.ramGb,
              storageGb: product.storageGb,
              price: product.price,
              stockQty: product.stockQty,
              imageUrl: product.imageUrl,
            },
          }
        })

      if (scenario === 'empty') {
        items = []
      }

      const { page: pageValue, limit } = parseListQuery(url)
      return json(route, 200, {
        success: true,
        data: { items: paginate(items, pageValue, limit) },
        meta: toMeta(items.length, pageValue, limit),
      })
    }

    if (pathname === '/cart/items' && request.method() === 'POST') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const body = await parseBody(request)
      const existing = db.cartItems.find((entry) => entry.userId === user.id && entry.productId === body.productId)

      if (existing) {
        existing.quantity += Number(body.quantity)
        existing.updatedAt = nowIso(-3)
        return json(route, 200, { success: true, data: existing })
      }

      const created = {
        id: `cart-${Date.now()}`,
        userId: user.id,
        productId: body.productId,
        quantity: Number(body.quantity),
        createdAt: nowIso(-3),
        updatedAt: nowIso(-3),
      }

      db.cartItems.push(created)
      return json(route, 201, { success: true, data: created })
    }

    if (pathname.startsWith('/cart/items/') && request.method() === 'PATCH') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const cartId = pathname.split('/')[3]
      const body = await parseBody(request)
      const item = db.cartItems.find((entry) => entry.id === cartId && entry.userId === user.id)

      if (!item) {
        return json(route, 404, { success: false, message: 'Cart item not found' })
      }

      item.quantity = Number(body.quantity)
      item.updatedAt = nowIso(-2)
      return json(route, 200, { success: true, data: item })
    }

    if (pathname.startsWith('/cart/items/') && request.method() === 'DELETE') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const cartId = pathname.split('/')[3]
      const index = db.cartItems.findIndex((entry) => entry.id === cartId && entry.userId === user.id)

      if (index === -1) {
        return json(route, 404, { success: false, message: 'Cart item not found' })
      }

      const [removed] = db.cartItems.splice(index, 1)
      return json(route, 200, { success: true, data: removed })
    }

    if (pathname === '/addresses' && request.method() === 'GET') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      let list = db.addresses.filter((entry) => entry.userId === user.id)
      if (scenario === 'empty') {
        list = []
      }

      const { page: pageValue, limit } = parseListQuery(url)
      return json(route, 200, {
        success: true,
        data: paginate(list, pageValue, limit),
        meta: toMeta(list.length, pageValue, limit),
      })
    }

    if (pathname === '/addresses' && request.method() === 'POST') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const body = await parseBody(request)
      if (body.isDefault) {
        db.addresses
          .filter((entry) => entry.userId === user.id)
          .forEach((entry) => {
            entry.isDefault = false
          })
      }

      const created = {
        id: `addr-${Date.now()}`,
        userId: user.id,
        receiver: body.receiver,
        phone: body.phone,
        line1: body.line1,
        ward: body.ward,
        district: body.district,
        city: body.city,
        isDefault: Boolean(body.isDefault),
        createdAt: nowIso(-2),
        updatedAt: nowIso(-2),
      }

      db.addresses.unshift(created)
      return json(route, 201, { success: true, data: created })
    }

    if (pathname.startsWith('/addresses/') && request.method() === 'PATCH') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const id = pathname.split('/')[2]
      const body = await parseBody(request)
      const address = db.addresses.find((entry) => entry.id === id && entry.userId === user.id)

      if (!address) {
        return json(route, 404, { success: false, message: 'Address not found' })
      }

      if (body.isDefault) {
        db.addresses
          .filter((entry) => entry.userId === user.id)
          .forEach((entry) => {
            entry.isDefault = false
          })
      }

      Object.assign(address, body, { updatedAt: nowIso(-1) })
      return json(route, 200, { success: true, data: address })
    }

    if (pathname.startsWith('/addresses/') && request.method() === 'DELETE') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const id = pathname.split('/')[2]
      const index = db.addresses.findIndex((entry) => entry.id === id && entry.userId === user.id)

      if (index === -1) {
        return json(route, 404, { success: false, message: 'Address not found' })
      }

      const [removed] = db.addresses.splice(index, 1)
      return json(route, 200, { success: true, data: removed })
    }

    if (pathname === '/orders/checkout' && request.method() === 'POST') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const body = await parseBody(request)
      const userCart = db.cartItems.filter((entry) => entry.userId === user.id)

      if (!userCart.length) {
        return json(route, 409, { success: false, message: 'Cart is empty' })
      }

      const subtotal = userCart.reduce((sum, item) => {
        const product = db.products.find((entry) => entry.id === item.productId)
        return sum + (product.price * item.quantity)
      }, 0)

      const createdOrder = {
        id: `order-${Date.now()}`,
        userId: user.id,
        addressId: body.addressId,
        status: 'pending',
        subtotal,
        shippingFee: 0,
        total: subtotal,
        placedAt: nowIso(-1),
        createdAt: nowIso(-1),
        updatedAt: nowIso(-1),
        items: userCart.map((item, index) => {
          const product = db.products.find((entry) => entry.id === item.productId)
          return {
            id: `order-item-${Date.now()}-${index}`,
            orderId: `order-${Date.now()}`,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            lineTotal: product.price * item.quantity,
          }
        }),
      }

      db.orders.unshift(createdOrder)
      db.cartItems = db.cartItems.filter((entry) => entry.userId !== user.id)

      return json(route, 201, {
        success: true,
        data: buildOrderPayload(createdOrder, db),
      })
    }

    if (pathname === '/orders' && request.method() === 'GET') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      let list = db.orders
        .filter((entry) => entry.userId === user.id)
        .map((entry) => buildOrderPayload(entry, db))

      if (scenario === 'empty') {
        list = []
      }

      const status = url.searchParams.get('status')
      if (status) {
        list = list.filter((entry) => entry.status === status)
      }

      const minTotalParam = url.searchParams.get('minTotal')
      const maxTotalParam = url.searchParams.get('maxTotal')
      const minTotal = minTotalParam === null ? undefined : Number(minTotalParam)
      const maxTotal = maxTotalParam === null ? undefined : Number(maxTotalParam)

      if (minTotalParam !== null && Number.isFinite(minTotal)) {
        list = list.filter((entry) => entry.total >= minTotal)
      }
      if (maxTotalParam !== null && Number.isFinite(maxTotal)) {
        list = list.filter((entry) => entry.total <= maxTotal)
      }

      const sortBy = url.searchParams.get('sortBy') || 'placedAt'
      const sortOrder = url.searchParams.get('sortOrder') || 'desc'
      list = sortItems(list, sortBy, sortOrder)

      const { page: pageValue, limit } = parseListQuery(url, { page: 1, limit: 6 })
      const paged = paginate(list, pageValue, limit)

      return json(route, 200, {
        success: true,
        data: paged,
        meta: toMeta(list.length, pageValue, limit),
      })
    }

    if (pathname.startsWith('/orders/') && pathname.endsWith('/cancel') && request.method() === 'PATCH') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const id = pathname.split('/')[2]
      const order = db.orders.find((entry) => entry.id === id && entry.userId === user.id)
      if (!order) {
        return json(route, 404, { success: false, message: 'Order not found' })
      }

      if (!['pending', 'processing'].includes(order.status)) {
        return json(route, 409, { success: false, message: 'Order cannot be canceled' })
      }

      order.status = 'canceled'
      order.updatedAt = nowIso(0)

      return json(route, 200, {
        success: true,
        data: buildOrderPayload(order, db),
      })
    }

    if (pathname.startsWith('/orders/') && request.method() === 'GET') {
      if (!user) {
        return json(route, 401, { success: false, message: 'Unauthorized' })
      }

      const id = pathname.split('/')[2]
      const order = db.orders.find((entry) => entry.id === id && entry.userId === user.id)

      if (!order) {
        return json(route, 404, { success: false, message: 'Order not found' })
      }

      return json(route, 200, {
        success: true,
        data: buildOrderPayload(order, db),
      })
    }

    if (pathname === '/internal/products' && request.method() === 'POST') {
      if (!user || user.role !== 'manager') {
        return json(route, 403, { success: false, message: 'Forbidden' })
      }

      const body = await parseBody(request)
      const created = {
        ...body,
        id: `prod-${Date.now()}`,
        isDeleted: false,
        createdAt: nowIso(-1),
        updatedAt: nowIso(-1),
      }
      db.products.unshift(created)

      return json(route, 201, { success: true, data: created })
    }

    if (pathname.startsWith('/internal/products/') && request.method() === 'PATCH') {
      if (!user || user.role !== 'manager') {
        return json(route, 403, { success: false, message: 'Forbidden' })
      }

      const id = pathname.split('/')[3]
      const body = await parseBody(request)
      const product = db.products.find((entry) => entry.id === id && !entry.isDeleted)

      if (!product) {
        return json(route, 404, { success: false, message: 'Product not found' })
      }

      Object.assign(product, body, { updatedAt: nowIso(0) })
      return json(route, 200, { success: true, data: product })
    }

    if (pathname.startsWith('/internal/products/') && request.method() === 'DELETE') {
      if (!user || user.role !== 'manager') {
        return json(route, 403, { success: false, message: 'Forbidden' })
      }

      const id = pathname.split('/')[3]
      const product = db.products.find((entry) => entry.id === id && !entry.isDeleted)

      if (!product) {
        return json(route, 404, { success: false, message: 'Product not found' })
      }

      product.isDeleted = true
      product.updatedAt = nowIso(0)

      return json(route, 200, { success: true, data: product })
    }

    return json(route, 404, { success: false, message: `No mock route for ${pathname}` })
  })

  return db
}

export async function seedAuthSession(page, role = 'customer') {
  const user = role === 'manager'
    ? {
      id: 'user-manager',
      email: 'manager@laptop.local',
      fullName: 'Store Manager',
      phone: '+1 (555) 0100',
      role: 'manager',
      createdAt: nowIso(-120000),
      updatedAt: nowIso(-120000),
    }
    : {
      id: 'user-customer',
      email: 'john.doe@email.com',
      fullName: 'John Doe',
      phone: '+1 (555) 222-1010',
      role: 'customer',
      createdAt: nowIso(-90000),
      updatedAt: nowIso(-90000),
    }

  const token = role === 'manager' ? 'token-manager' : 'token-customer'

  await page.addInitScript(({ session }) => {
    localStorage.setItem('iws-v2-auth-session', JSON.stringify({
      state: session,
      version: 0,
    }))
  }, {
    session: {
      token,
      user,
    },
  })
}

export async function assertMainNavVisible(page) {
  await expect(page.getByText('Nova Laptop Studio')).toBeVisible()
}
