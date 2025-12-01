import type { ProductImage } from "@/types/product.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export interface CreateProductImageRequest {
  imageUrl: string;
  sortOrder?: number;
  isPrimary?: boolean;
  product: {
    id: number; // Product ID to associate with
  };
}

export interface UpdateProductImageRequest {
  imageUrl?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export const productImageApi = {
  /**
   * Get product images by product ID
   */
  getByProductId: async (productId: number): Promise<ProductImage[]> => {
    const response = await apiClient.get<ProductImage[]>(
      API_ENDPOINTS.PRODUCT_IMAGES,
      {
        params: { productId },
      }
    );
    return response.data;
  },

  /**
   * Get product image by ID
   */
  getById: async (id: number): Promise<ProductImage> => {
    const response = await apiClient.get<ProductImage>(
      `${API_ENDPOINTS.PRODUCT_IMAGES}/${id}`
    );
    return response.data;
  },

  /**
   * Create new product image
   */
  create: async (
    image: CreateProductImageRequest
  ): Promise<ProductImage> => {
    const response = await apiClient.post<ProductImage>(
      API_ENDPOINTS.PRODUCT_IMAGES,
      image
    );
    return response.data;
  },

  /**
   * Update product image by ID
   */
  update: async (
    id: number,
    image: UpdateProductImageRequest
  ): Promise<ProductImage> => {
    const response = await apiClient.put<ProductImage>(
      `${API_ENDPOINTS.PRODUCT_IMAGES}/${id}`,
      image
    );
    return response.data;
  },

  /**
   * Delete product image by ID (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.PRODUCT_IMAGES}/${id}`);
  },
};

