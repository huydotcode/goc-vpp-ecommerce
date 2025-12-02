# 📋 Kế Hoạch Triển Khai Client React - Từ A đến Z

## 📌 Tổng Quan

Kế hoạch triển khai client React để tích hợp với Spring Boot Backend API. Dự án sử dụng:

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Ant Design 5** (UI components)
- **Tailwind CSS 4** (styling)
- **React Router 7** (routing)
- **Axios** (HTTP client)

---

## 🎯 Mục Tiêu

Xây dựng một ứng dụng quản lý hoàn chỉnh với các module:

1. ✅ Authentication & Authorization
2. ✅ User Management
3. ✅ Category Management
4. ✅ Product Management
5. ✅ Promotion Management
6. ✅ File Upload (Cloudinary)

---

## 📦 Phase 1: Setup & Configuration (Hoàn thành cơ bản)

### ✅ 1.1 Dependencies đã cài đặt

- [x] React 19.2.0
- [x] TypeScript 5.9.3
- [x] Vite 7.2.2
- [x] Ant Design 5.28.1
- [x] Tailwind CSS 4.1.17
- [x] React Router DOM 7.9.5
- [x] Axios 1.13.2
- [x] @ant-design/icons 6.1.0

## 🔧 Phase 2: Core Infrastructure

### ✅ 2.1 API Client Setup (Đã có)

- [x] `src/api/client.ts` - Axios instance với interceptors
- [x] Request interceptor: Thêm JWT token
- [x] Response interceptor: Xử lý 401 (unauthorized)

### ✅ 2.2 Types & Interfaces

- [x] `src/types/common.types.ts` - ✅ Đã có và đầy đủ
- [x] `src/types/auth.types.ts` - LoginRequest, LoginResponse
- [x] `src/types/user.types.ts` - User, UserFilters, CreateUserRequest, UpdateUserRequest, Role enum
- [x] `src/types/category.types.ts` - Category, CategoryFilters, CreateCategoryRequest, UpdateCategoryRequest
- [x] `src/types/product.types.ts` - Product, ProductFilters, ProductImage, CreateProductRequest, UpdateProductRequest
- [x] `src/types/promotion.types.ts` - Promotion, PromotionRequest, PromotionResponse, PromotionFilters, enums
- [x] `src/types/upload.types.ts` - UploadRequest, UploadResponse, ResourceType

### ✅ 2.3 API Services

- [x] `src/api/auth.api.ts` - ✅ Đã có
- [x] `src/api/user.api.ts` - CRUD operations cho Users (getUsersAdvanced, getUserById, createUser, updateUser, deleteUser)
- [x] `src/api/category.api.ts` - CRUD operations cho Categories (getCategoriesAdvanced, getCategoryById, createCategory, updateCategory, deleteCategory)
- [x] `src/api/product.api.ts` - CRUD operations cho Products (getProductsAdvanced, getProductById, createProduct, updateProduct, deleteProduct)
- [x] `src/api/promotion.api.ts` - CRUD operations cho Promotions (getPromotionsAdvanced, getActivePromotions, getPromotionById, createPromotion, updatePromotion)
- [x] `src/api/upload.api.ts` - File upload to Cloudinary (upload với FormData)

### 🔄 2.4 Utilities

- [ ] `src/utils/constants.ts` - API endpoints, constants
- [ ] `src/utils/storage.ts` - localStorage helpers (getToken, setToken, removeToken)
- [ ] `src/utils/format.ts` - Date formatting, number formatting
- [ ] `src/utils/validation.ts` - Form validation helpers
- [ ] `src/utils/error.ts` - Error handling utilities

### 🔄 2.5 Contexts

- [x] `src/contexts/AuthContext.tsx` - ✅ Đã có (cần kiểm tra)
- [ ] Có thể thêm `AppContext` cho global state nếu cần

### 🔄 2.6 Custom Hooks

- [ ] `src/hooks/useAuth.ts` - ✅ Đã có (cần kiểm tra)
- [ ] `src/hooks/usePagination.ts` - Hook cho pagination logic
- [ ] `src/hooks/useTable.ts` - Hook cho table operations (sort, filter)
- [ ] `src/hooks/useApi.ts` - Generic hook cho API calls với loading/error states
- [ ] `src/hooks/useDebounce.ts` - Debounce cho search input

---

## 🎨 Phase 3: Common Components

### 🔄 3.1 Layout Components

- [ ] `src/components/layout/AppLayout.tsx` - Main layout với sidebar
- [ ] `src/components/layout/Header.tsx` - Top header với user menu
- [ ] `src/components/layout/Sidebar.tsx` - Navigation sidebar
- [ ] `src/components/layout/Footer.tsx` - Footer (optional)

### 🔄 3.2 Common/Shared Components

- [ ] `src/components/common/DataTable.tsx` - Reusable table với pagination, sort
- [ ] `src/components/common/Pagination.tsx` - Pagination component (nếu không dùng Ant Design)
- [ ] `src/components/common/FilterBar.tsx` - Filter bar component
- [ ] `src/components/common/SearchInput.tsx` - Search input với debounce
- [ ] `src/components/common/ImageUpload.tsx` - Image upload component
- [ ] `src/components/common/ImagePreview.tsx` - Image preview modal
- [ ] `src/components/common/Loading.tsx` - Loading spinner/overlay
- [ ] `src/components/common/ErrorBoundary.tsx` - Error boundary component
- [ ] `src/components/common/EmptyState.tsx` - Empty state component
- [ ] `src/components/common/ConfirmModal.tsx` - Confirmation modal

### 🔄 3.3 Auth Components

- [ ] `src/components/auth/Login.tsx` - Login form component
- [ ] `src/components/auth/ProtectedRoute.tsx` - Route protection wrapper
- [ ] `src/components/auth/LogoutButton.tsx` - Logout button component

---

## 📄 Phase 4: Feature Modules

### 🔄 4.1 Authentication Module

- [ ] `src/pages/LoginPage.tsx` - Login page
- [ ] Tích hợp với AuthContext
- [ ] Form validation
- [ ] Error handling
- [ ] Redirect sau khi login thành công

### 🔄 4.2 Dashboard Module

- [ ] `src/pages/DashboardPage.tsx` - Dashboard với statistics
- [ ] Cards hiển thị số liệu (users, products, categories, promotions)
- [ ] Charts (nếu cần)

### 🔄 4.3 User Management Module

- [ ] `src/pages/UsersPage.tsx` - Main users page
- [ ] `src/components/users/UserList.tsx` - User list table
- [ ] `src/components/users/UserForm.tsx` - Create/Edit user form
- [ ] `src/components/users/UserDetail.tsx` - User detail modal/drawer
- [ ] `src/components/users/UserFilters.tsx` - Filter component
- [ ] Features:
  - [ ] List users với pagination, sort, filter
  - [ ] Create new user
  - [ ] Edit user (inline hoặc modal)
  - [ ] Delete user (soft delete)
  - [ ] View user details
  - [ ] Upload avatar
  - [ ] Filter by role, username, email, isActive
  - [ ] Search functionality

### 🔄 4.4 Category Management Module

- [ ] `src/pages/CategoriesPage.tsx` - Main categories page
- [ ] `src/components/categories/CategoryList.tsx` - Category list table
- [ ] `src/components/categories/CategoryForm.tsx` - Create/Edit category form
- [ ] `src/components/categories/CategoryDetail.tsx` - Category detail modal/drawer
- [ ] `src/components/categories/CategoryFilters.tsx` - Filter component
- [ ] Features:
  - [ ] List categories với pagination, sort, filter
  - [ ] Create new category
  - [ ] Edit category
  - [ ] Delete category (soft delete)
  - [ ] View category details
  - [ ] Upload thumbnail
  - [ ] Filter by name, isActive
  - [ ] Search functionality

### 🔄 4.5 Product Management Module

- [ ] `src/pages/ProductsPage.tsx` - Main products page
- [ ] `src/components/products/ProductList.tsx` - Product list table
- [ ] `src/components/products/ProductForm.tsx` - Create/Edit product form
- [ ] `src/components/products/ProductDetail.tsx` - Product detail modal/drawer
- [ ] `src/components/products/ProductFilters.tsx` - Filter component
- [ ] `src/components/products/ProductImageManager.tsx` - Manage product images
- [ ] Features:
  - [ ] List products với pagination, sort, filter
  - [ ] Create new product
  - [ ] Edit product
  - [ ] Delete product (soft delete)
  - [ ] View product details
  - [ ] Upload product images
  - [ ] Manage product categories (many-to-many)
  - [ ] Filter by name, SKU, brand, category, isFeatured, isActive
  - [ ] Search functionality

### 🔄 4.6 Promotion Management Module

- [ ] `src/pages/PromotionsPage.tsx` - Main promotions page
- [ ] `src/components/promotions/PromotionList.tsx` - Promotion list table
- [ ] `src/components/promotions/PromotionForm.tsx` - Create/Edit promotion form
- [ ] `src/components/promotions/PromotionDetail.tsx` - Promotion detail modal/drawer
- [ ] `src/components/promotions/PromotionFilters.tsx` - Filter component
- [ ] Features:
  - [ ] List promotions với pagination, sort, filter
  - [ ] Create new promotion
  - [ ] Edit promotion
  - [ ] View promotion details
  - [ ] Get active promotions
  - [ ] Filter by name, isActive
  - [ ] Search functionality

---

## 🛣️ Phase 5: Routing & Navigation

### 🔄 5.1 Router Configuration

- [ ] `src/router.tsx` - React Router configuration
- [ ] Public routes: `/login`
- [ ] Protected routes: `/dashboard`, `/users`, `/categories`, `/products`, `/promotions`
- [ ] Redirect logic: `/` → `/dashboard`
- [ ] 404 Not Found page

### 🔄 5.2 Navigation

- [ ] Sidebar menu items
- [ ] Active route highlighting
- [ ] Breadcrumbs (optional)

---

## 🎨 Phase 6: Styling & UI/UX

### 🔄 6.1 Ant Design Theme

- [ ] Customize Ant Design theme (colors, fonts)
- [ ] Dark mode support (optional)

### 🔄 6.2 Tailwind CSS

- [ ] Custom utility classes
- [ ] Responsive design
- [ ] Mobile-friendly layout

### 🔄 6.3 Global Styles

- [ ] `src/styles/index.css` - Global styles
- [ ] Reset CSS
- [ ] Custom CSS variables

---

## 🧪 Phase 7: Testing & Quality

### 🔄 7.1 Error Handling

- [ ] Global error handler
- [ ] API error messages
- [ ] Form validation errors
- [ ] Network error handling

### 🔄 7.2 Loading States

- [ ] Loading indicators cho API calls
- [ ] Skeleton loaders
- [ ] Optimistic updates (nếu cần)

### 🔄 7.3 Code Quality

- [ ] ESLint rules compliance
- [ ] Prettier formatting
- [ ] TypeScript strict mode
- [ ] Code comments & documentation

---

## 🚀 Phase 8: Optimization & Polish

### 🔄 8.1 Performance

- [ ] Code splitting (lazy loading routes)
- [ ] Image optimization
- [ ] Memoization (React.memo, useMemo, useCallback)
- [ ] Virtual scrolling cho large lists (nếu cần)

### 🔄 8.2 User Experience

- [ ] Toast notifications (Ant Design message/notification)
- [ ] Confirmation dialogs
- [ ] Success/Error feedback
- [ ] Form auto-save (nếu cần)

### 🔄 8.3 Accessibility

- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support

---

## 📝 Phase 9: Documentation

### 🔄 9.1 Code Documentation

- [ ] JSDoc comments cho functions
- [ ] README.md cho từng module
- [ ] API documentation comments

### 🔄 9.2 User Documentation

- [ ] User guide (nếu cần)
- [ ] Feature documentation

---

## 🔐 Phase 10: Security

### 🔄 10.1 Security Best Practices

- [ ] JWT token storage (localStorage vs sessionStorage)
- [ ] Token refresh mechanism (nếu backend hỗ trợ)
- [ ] XSS prevention
- [ ] CSRF protection (nếu cần)

---

## 📊 Implementation Priority

### 🔴 High Priority (Must Have)

1. ✅ API Client & Types
2. ✅ AuthContext & Authentication
3. 🔄 Protected Routes
4. 🔄 User Management Module
5. 🔄 Category Management Module
6. 🔄 Product Management Module
7. 🔄 Common Components (DataTable, Forms)

### 🟡 Medium Priority (Should Have)

1. 🔄 Promotion Management Module
2. 🔄 File Upload Component
3. 🔄 Dashboard
4. 🔄 Error Handling & Loading States
5. 🔄 Filter & Search Components

### 🟢 Low Priority (Nice to Have)

1. 🔄 Dark Mode
2. 🔄 Advanced Charts
3. 🔄 Export functionality
4. 🔄 Print functionality
5. 🔄 Advanced filtering

---

## 📅 Estimated Timeline

| Phase     | Tasks                 | Estimated Time  |
| --------- | --------------------- | --------------- |
| Phase 1   | Setup & Configuration | 1-2 hours       |
| Phase 2   | Core Infrastructure   | 4-6 hours       |
| Phase 3   | Common Components     | 6-8 hours       |
| Phase 4   | Feature Modules       | 20-30 hours     |
| Phase 5   | Routing & Navigation  | 2-3 hours       |
| Phase 6   | Styling & UI/UX       | 4-6 hours       |
| Phase 7   | Testing & Quality     | 4-6 hours       |
| Phase 8   | Optimization & Polish | 4-6 hours       |
| Phase 9   | Documentation         | 2-3 hours       |
| Phase 10  | Security              | 2-3 hours       |
| **Total** |                       | **50-70 hours** |

---

## ✅ Checklist Template

Sử dụng checklist này để track progress:

```markdown
### Module: [Module Name]

- [ ] Types/Interfaces defined
- [ ] API service created
- [ ] Components created
- [ ] Page created
- [ ] Routing configured
- [ ] CRUD operations working
- [ ] Filter/Search working
- [ ] Pagination working
- [ ] Error handling
- [ ] Loading states
- [ ] Testing completed
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error

**Solution**: Đảm bảo backend CORS config cho phép origin của client

### Issue 2: JWT Token Expired

**Solution**: Implement token refresh hoặc auto logout

### Issue 3: Image Upload Fails

**Solution**: Kiểm tra Cloudinary config và file size limits

### Issue 4: Pagination Not Working

**Solution**: Kiểm tra API response format và metadata structure

---

## 📚 Resources

- [React Router v7 Docs](https://reactrouter.com/)
- [Ant Design Components](https://ant.design/components/overview/)
- [Axios Documentation](https://axios-http.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)

---

## 🎯 Next Steps

1. **Bắt đầu với Phase 2**: Hoàn thiện Types & API Services
2. **Tiếp tục Phase 3**: Xây dựng Common Components
3. **Triển khai Phase 4**: Bắt đầu với User Management (module đơn giản nhất)
4. **Iterate**: Làm từng module một, test kỹ trước khi chuyển sang module tiếp theo

---

**Last Updated**: 2025-11-28
**Status**: 🟡 In Progress
