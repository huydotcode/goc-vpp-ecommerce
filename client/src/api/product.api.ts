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
};
