import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminLayout from "./components/layout/admin/AdminLayout";
import ClientLayout from "./components/layout/user/ClientLayout";
import Login from "./pages/Login";
import GoogleCallback from "./pages/GoogleCallback";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import NotFound from "./pages/errors/NotFound";
import Forbidden from "./pages/errors/Forbidden";
import Unauthorized from "./pages/errors/Unauthorized";
import UserAdminMain from "./components/admin/user/main-protable";
import CategoryAdminMain from "./components/admin/category/main-protable";
import ProductAdminMain from "./components/admin/product/main-protable";
import PromotionAdminMain from "./components/admin/promotion/main-protable";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import "./styles/index.css";
import type { JSX } from "react";

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
      <Route path="/login" element={<Login />} />
      <Route path="/google/callback" element={<GoogleCallback />} />
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
        <Route path="permissions" element={<div>Permissions Page</div>} />
        <Route path="profile" element={<div>Profile Page</div>} />
      </Route>
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
      </Route>
      <Route path="/401" element={<Unauthorized />} />
      <Route path="/403" element={<Forbidden />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
