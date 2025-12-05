export const API_ENDPOINTS = {
  // Authentication
  LOGIN: "/login",
  REFRESH: "/refresh",

  // Users
  USERS: "/users",
  USERS_ADVANCED: "/users/advanced",
  USERS_FILTER: "/users/filter",

  // Categories
  CATEGORIES: "/categories",
  CATEGORIES_ADVANCED: "/categories/advanced",
  CATEGORIES_FILTER: "/categories/filter",

  // Products
  PRODUCTS: "/products",
  PRODUCTS_ADVANCED: "/products/advanced",
  PRODUCTS_PAGE: "/products/page",
  PRODUCTS_BEST_SELLERS: "/products/best-sellers",

  // Promotions
  PROMOTIONS: "/promotions",
  PROMOTIONS_ADVANCED: "/promotions/advanced",
  PROMOTIONS_ACTIVE: "/promotions/active",

  // Upload
  UPLOADS: "/uploads",

  // Product Images
  PRODUCT_IMAGES: "/product-images",
} as const;
