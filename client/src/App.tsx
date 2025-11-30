import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import ClientLayout from './components/layout/ClientLayout';
import Login from './pages/Login';
import GoogleCallback from './pages/GoogleCallback';
import Admin from './pages/Admin';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
import Unauthorized from './pages/Unauthorized';
import UserAdminMain from './components/admin/user/main-protable';
import CategoryAdminMain from './components/admin/category/main-protable';
import ProductAdminMain from './components/admin/product/main-protable';
import PromotionAdminMain from './components/admin/promotion/main-protable';
import './styles/index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { userRole, isLoading, loadUserInfo } = useAuth();
  
  const RoleBasedRedirect = () => {
    console.log('[AppRoutes] RoleBasedRedirect - isLoading:', isLoading, 'userRole:', userRole);
    
    // Đợi load user info xong
    if (isLoading) {
      console.log('[AppRoutes] Still loading, showing loading screen');
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Đang tải...</div>;
    }
    
    // Nếu chưa có role, có thể là chưa login hoặc lỗi load user info
    if (!userRole) {
      console.log('[AppRoutes] No userRole, checking token...');
      // Nếu có token nhưng không load được user info, thử load lại
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('[AppRoutes] Token exists but no role, trying to reload user info...');
        // Thử load lại user info một lần nữa
        loadUserInfo().catch((error) => {
          console.error('[AppRoutes] Failed to reload user info:', error);
        });
        // Đợi một chút rồi redirect
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Đang tải thông tin người dùng...</div>;
      }
      // Không có token, redirect về login
      console.log('[AppRoutes] No token, redirecting to login');
      return <Navigate to="/login" replace />;
    }
    
    console.log('[AppRoutes] UserRole:', userRole, '- Redirecting...');
    if (userRole === 'ADMIN' || userRole === 'EMPLOYEE') {
      return <Navigate to="/admin" replace />;
    }
    
    return <Navigate to="/home" replace />;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/google/callback" element={<GoogleCallback />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
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
