import { productApi } from "@/api/product.api";
import { uploadApi } from "@/api/upload.api";
import type {
  Product,
  ProductFilters,
  ProductSuggestionParams,
  ProductVectorSuggestionParams,
  CreateProductRequest,
  UpdateProductRequest,
  ProductImage,
} from "@/types/product.types";
import type { PaginatedResponse } from "@/types/common.types";
import type { UploadResponse } from "@/types/upload.types";

// Re-export types để backward compatibility
export type {
  Product as ProductDTO,
  ProductImage as ProductImageDTO,
  CreateProductRequest,
  UpdateProductRequest,
};

export const productService = {
  /**
   * Get all products with pagination and filters
   */
  getAllProducts: async (
    params: ProductFilters
  ): Promise<PaginatedResponse<Product>> => {
    return productApi.getProductsAdvanced(params);
  },

  /**
   * Get best seller / top products
   */
  getBestSellers: async (
    params: {
      size?: number;
    } = {}
  ): Promise<PaginatedResponse<Product>> => {
    return productApi.getBestSellers(params);
  },

  /**
   * Get products with simple pagination
   */
  getProductsPage: async (params: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Product>> => {
    return productApi.getProductsPage(params);
  },

  /**
   * Get product by ID
   */
  getProductById: async (id: number): Promise<Product> => {
    return productApi.getProductById(id);
  },

  /**
   * Create new product
   */
  createProduct: async (
    productData: CreateProductRequest
  ): Promise<Product> => {
    return productApi.createProduct(productData);
  },

  /**
   * Update product
   */
  updateProduct: async (
    id: number,
    productData: UpdateProductRequest
  ): Promise<Product> => {
    return productApi.updateProduct(id, productData);
  },

  /**
   * Delete product (soft delete)
   */
  deleteProduct: async (id: number): Promise<void> => {
    return productApi.deleteProduct(id);
  },

  /**
   * Gợi ý sản phẩm
   */
  getSuggestions: async (
    params: ProductSuggestionParams
  ): Promise<Product[]> => {
    return productApi.getSuggestions(params);
  },

  /**
   * Gợi ý sản phẩm bằng vector
   */
  getVectorSuggestions: async (
    params: ProductVectorSuggestionParams
  ): Promise<Product[]> => {
    return productApi.getVectorSuggestions(params);
  },

  /**
   * Track sản phẩm đã xem
   */
  trackProductView: async (productId: number): Promise<void> => {
    return productApi.trackProductView(productId);
  },

  /**
   * Gợi ý sản phẩm dựa trên lịch sử
   */
  getHistoryBasedSuggestions: async (params: {
    categoryId?: number;
    limit?: number;
  }): Promise<Product[]> => {
    return productApi.getHistoryBasedSuggestions(params);
  },

  /**
   * Upload product thumbnail
   */
  uploadThumbnail: async (
    file: File,
    productId?: number
  ): Promise<UploadResponse> => {
    return uploadApi.upload(
      file,
      "image",
      "products",
      productId?.toString(),
      "thumbnailUrl"
    );
  },
};
