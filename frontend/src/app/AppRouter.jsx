import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { RequireAuth, RequireManager } from './guards'
import { HomePage } from '../pages/HomePage'
import { ShopPage } from '../pages/ShopPage'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { AuthPage } from '../pages/AuthPage'
import { RecoveryPage } from '../pages/RecoveryPage'
import { AccountPage } from '../pages/AccountPage'
import { CartPage } from '../pages/CartPage'
import { CheckoutPage } from '../pages/CheckoutPage'
import { OrdersPage } from '../pages/OrdersPage'
import { OrderDetailPage } from '../pages/OrderDetailPage'
import { AddressesPage } from '../pages/AddressesPage'
import { ManagerStudioPage } from '../pages/ManagerStudioPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:productId" element={<ProductDetailPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/recovery" element={<RecoveryPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account/orders" element={<OrdersPage />} />
          <Route path="/account/orders/:id" element={<OrderDetailPage />} />
          <Route path="/account/addresses" element={<AddressesPage />} />

          <Route element={<RequireManager />}>
            <Route path="/manager/studio" element={<ManagerStudioPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
