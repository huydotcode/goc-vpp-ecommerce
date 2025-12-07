import type { JSX } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import CategoryAdminMain from "./components/admin/category/main-protable";
import ProductAdminMain from "./components/admin/product/main-protable";
import PromotionAdminMain from "./components/admin/promotion/main-protable";
import UserAdminMain from "./components/admin/user/main-protable";
import AdminLayout from "./components/layout/admin/AdminLayout";
import UserLayout from "./components/layout/user/UserLayout";
import UserAccountLayout from "./components/layout/user/UserAccountLayout";
import { AuthProvider } from "./contexts/AuthContext";
import Admin from "./pages/Admin";
import AdminPermissionsPage from "./pages/AdminPermissions";
import AdminProfilePage from "./pages/AdminProfile";
import AdminOrderDetailPage from "./pages/AdminOrderDetail";
import AdminOrdersPage from "./pages/AdminOrders";
import CartPage from "./pages/Cart";
import CartVnPayMock from "./pages/CartVnPayMock";
import CheckoutPage from "./pages/Checkout";
import GoogleCallback from "./pages/GoogleCallback";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OrdersPage from "./pages/Orders";
import ProductDetailPage from "./pages/ProductDetail";
import RegisterPage from "./pages/Register";
import UserProfilePage from "./pages/UserProfile";
import VnPayResult from "./pages/VnPayResult";
import PayOSResult from "./pages/PayOSResult";
import Forbidden from "./pages/errors/Forbidden";
import NotFound from "./pages/errors/NotFound";
import Unauthorized from "./pages/errors/Unauthorized";

function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/google/callback" element={<GoogleCallback />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Admin />} />
        <Route path="users" element={<UserAdminMain />} />
        <Route path="categories" element={<CategoryAdminMain />} />
        <Route path="products" element={<ProductAdminMain />} />
        <Route path="promotions" element={<PromotionAdminMain />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="permissions" element={<AdminPermissionsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      {/* User routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowGuest={true}>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="cart-vnpay" element={<CartVnPayMock />} />
        <Route path="vnpay-result" element={<VnPayResult />} />
        <Route path="payos-result" element={<PayOSResult />} />
        <Route
          path="user"
          element={
            <ProtectedRoute>
              <UserAccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserProfilePage />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="orders" element={<OrdersPage />} />
        </Route>
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Error routes */}
      <Route path="/401" element={<Unauthorized />} />
      <Route path="/403" element={<Forbidden />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
