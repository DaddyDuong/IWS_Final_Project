export const queryKeys = {
  me: ['me'],
  catalog: (query) => ['catalog', query],
  product: (id) => ['product', id],
  reviews: (productId, query) => ['reviews', productId, query],
  cart: (query) => ['cart', query],
  addresses: (query) => ['addresses', query],
  orders: (query) => ['orders', query],
  order: (id) => ['order', id],
  managerCatalog: (query) => ['manager-catalog', query],
}
