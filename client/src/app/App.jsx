import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "../components/layout/Header";
import PageLoader from "../components/PageLoader";
import ProtectedRoute from "../routes/ProtectedRoute";

const StorePage = lazy(() => import("../pages/user/StorePage"));
const ProductDetailPage = lazy(() => import("../pages/user/ProductDetailPage"));
const CartPage = lazy(() => import("../pages/user/CartPage"));
const WishlistPage = lazy(() => import("../pages/user/WishlistPage"));
const OrdersPage = lazy(() => import("../pages/user/OrdersPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const App = () => (
  <>
    <Header />
    <Suspense fallback={<PageLoader label="Loading page..." />}>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </>
);

export default App;
