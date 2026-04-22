import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { PagePlaceholder } from './components/PagePlaceholder'
import { RequireAuth } from './components/RequireAuth'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProductsPage } from './pages/ProductsPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route path="profile" element={<PagePlaceholder title="Your profile" />} />
          <Route path="cart" element={<PagePlaceholder title="Your cart" />} />
          <Route path="checkout" element={<PagePlaceholder title="Checkout" />} />
          <Route path="profile/orders" element={<PagePlaceholder title="Order history" />} />
          <Route
            path="profile/orders/:id"
            element={<PagePlaceholder title="Order details" />}
          />
          <Route
            path="profile/addresses"
            element={<PagePlaceholder title="Saved addresses" />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
