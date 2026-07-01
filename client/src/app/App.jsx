import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { ProtectedRoute } from '../routes/ProtectedRoute.jsx';
import { AccountPage } from '../pages/AccountPage.jsx';
import { AdminDashboardPage } from '../pages/AdminDashboardPage.jsx';
import { AdminGalleryPage } from '../pages/AdminGalleryPage.jsx';
import { AdminCurrencyPage } from '../pages/AdminCurrencyPage.jsx';
import { AdminProductFormPage } from '../pages/AdminProductFormPage.jsx';
import { AdminOrdersPage } from '../pages/AdminOrdersPage.jsx';
import { AdminProductsPage } from '../pages/AdminProductsPage.jsx';
import { AdminUsersPage } from '../pages/AdminUsersPage.jsx';
import { CartPage } from '../pages/CartPage.jsx';
import { CheckoutPage } from '../pages/CheckoutPage.jsx';
import { HomePage } from '../pages/HomePage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { OrderDetailPage } from '../pages/OrderDetailPage.jsx';
import { ProductDetailPage } from '../pages/ProductDetailPage.jsx';
import { ProductsPage } from '../pages/ProductsPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { ScrollToTop } from '../components/ScrollToTop.jsx';
import { OrderRealtimeSync } from '../components/OrderRealtimeSync.jsx';

export const App = () => (
  <>
    <ScrollToTop />
    <OrderRealtimeSync />
    <Routes>
      <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/:slugOrId" element={<ProductDetailPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route
        path="admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/products"
        element={
          <ProtectedRoute adminOnly>
            <AdminProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/products/new"
        element={
          <ProtectedRoute adminOnly>
            <AdminProductFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/products/:id/edit"
        element={
          <ProtectedRoute adminOnly>
            <AdminProductFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/currency"
        element={
          <ProtectedRoute adminOnly>
            <AdminCurrencyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/orders"
        element={
          <ProtectedRoute adminOnly>
            <AdminOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/users"
        element={
          <ProtectedRoute adminOnly>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/gallery"
        element={
          <ProtectedRoute adminOnly>
            <AdminGalleryPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
  </>
);
