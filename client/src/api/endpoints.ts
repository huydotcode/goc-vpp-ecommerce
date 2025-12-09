export const API_ENDPOINTS = {
  // Authentication
  LOGIN: "/login",
  REGISTER: "/register",
  REFRESH: "/refresh",

  // Users
  USERS: "/users",
  USERS_ME: "/users/me",
  USERS_ADVANCED: "/users/advanced",
  USERS_FILTER: "/users/filter",

  // User Addresses
  USER_ADDRESSES: "/user-addresses",

  // Categories
  CATEGORIES: "/categories",
  CATEGORIES_ADVANCED: "/categories/advanced",
  CATEGORIES_FILTER: "/categories/filter",

  // Products
  PRODUCTS: "/products",
  PRODUCTS_ADVANCED: "/products/advanced",
  PRODUCTS_PAGE: "/products/page",
  PRODUCTS_BEST_SELLERS: "/products/best-sellers",
  PRODUCTS_SUGGESTIONS: "/products/suggestions",
  PRODUCTS_VECTOR_SUGGEST: "/products/vector-suggest",
  PRODUCTS_TRACK_VIEW: "/products", // Base path, sẽ append /{id}/view
  PRODUCTS_HISTORY_SUGGEST: "/products/history-suggest",

  // Promotions
  PROMOTIONS: "/promotions",
  PROMOTIONS_ADVANCED: "/promotions/advanced",
  PROMOTIONS_ACTIVE: "/promotions/active",

  // Upload
  UPLOADS: "/uploads",

  // Product Images
  PRODUCT_IMAGES: "/product-images",

  // Cart
  CART: "/cart",
  CART_ITEMS: "/cart/items",

  // Product Variants
  PRODUCT_VARIANTS: "/product-variants",
  PRODUCT_VARIANTS_ADVANCED: "/product-variants/advanced",

  // Orders
  ORDERS: "/orders",
  ORDERS_CHECKOUT: "/orders/checkout",

  // User profile
  USERS_ME_PASSWORD: "/users/me/password",
} as const;
