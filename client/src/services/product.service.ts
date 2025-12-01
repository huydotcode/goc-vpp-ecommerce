import { productApi } from "@/api/product.api";
import { uploadApi } from "@/api/upload.api";
import type {
  Product,
  ProductFilters,
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
