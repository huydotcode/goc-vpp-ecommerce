import type { PaginatedResponse } from "@/types/common.types";
import type {
  Product,
  ProductFilters,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/types/product.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export const productApi = {
  /**
   * Get products with pagination, sorting, and filtering
   */
  getProductsAdvanced: async (
    filters: ProductFilters
  ): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>(
      API_ENDPOINTS.PRODUCTS_ADVANCED,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get best seller / top products
   */
  getBestSellers: async (params: {
    size?: number;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>(
      API_ENDPOINTS.PRODUCTS_BEST_SELLERS,
      { params }
    );
    return response.data;
  },

  /**
   * Get products with simple pagination
   */
  getProductsPage: async (params: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>(
      API_ENDPOINTS.PRODUCTS_PAGE,
      { params }
    );
    return response.data;
  },

  /**
   * Get product by ID (with images)
   */
  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(
      `${API_ENDPOINTS.PRODUCTS}/${id}`
    );
    return response.data;
  },

  /**
   * Create new product
   */
  createProduct: async (product: CreateProductRequest): Promise<Product> => {
    const response = await apiClient.post<Product>(
      API_ENDPOINTS.PRODUCTS,
      product
    );
    return response.data;
  },

  /**
   * Update product by ID
   */
  updateProduct: async (
    id: number,
    product: UpdateProductRequest
  ): Promise<Product> => {
    const response = await apiClient.put<Product>(
      `${API_ENDPOINTS.PRODUCTS}/${id}`,
      product
    );
    return response.data;
  },

  /**
   * Delete product by ID (soft delete)
   */
  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  },

  /**
   * Gợi ý sản phẩm (dùng cho Home / quick search)
   */
  getSuggestions: async (params: {
    q?: string;
    categoryId?: number;
    limit?: number;
  }): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS_SUGGESTIONS,
      { params }
    );
    return response.data;
  },

  /**
   * Gợi ý sản phẩm bằng vector (Gemini + ChromaDB)
   */
  getVectorSuggestions: async (params: {
    q: string;
    categoryId?: number;
    limit?: number;
  }): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS_VECTOR_SUGGEST,
      { params }
    );
    return response.data;
  },

  /**
   * Track sản phẩm người dùng đã xem/click
   */
  trackProductView: async (productId: number): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.PRODUCTS}/${productId}/view`);
  },

  /**
   * Gợi ý sản phẩm dựa trên lịch sử click/view
   */
  getHistoryBasedSuggestions: async (params: {
    categoryId?: number;
    limit?: number;
  }): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS_HISTORY_SUGGEST,
      { params }
    );
    return response.data;
  },
};
