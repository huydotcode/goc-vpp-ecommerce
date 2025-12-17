/**
 * Product types
 */

import type { Category } from "./category.types";
import type { ProductVariant } from "./variant.types";

export interface ProductImage {
  id: number;
  imageUrl: string;
  sortOrder?: number | null;
  isPrimary: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price?: number | null; // BigDecimal as number
  discountPrice?: number | null; // BigDecimal as number
  totalStockQuantity?: number | null; // Tổng stock từ tất cả variants (computed)
  hasStock?: boolean | null; // Có còn hàng không (computed)
  sku?: string | null;
  brand?: string | null;
  color?: string | null;
  size?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  specifications?: string | null;
  thumbnailUrl?: string | null;
  categories?: Category[];
  images?: ProductImage[];
  variants?: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  soldCount?: number | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface ProductFilters {
  id?: number;
  name?: string;
  search?: string; // Fuzzy search
  categoryId?: number; // Filter by category
  brand?: string;
  minPrice?: number; // Min price filter
  maxPrice?: number; // Max price filter
  isActive?: boolean; // Default: true
  isFeatured?: boolean;
  page?: number; // 1-indexed
  size?: number; // Default: 10
  sort?: string; // Field to sort by (e.g., "name", "price", "createdAt")
  direction?: "asc" | "desc"; // Sort direction
}

export interface ProductSuggestionParams {
  q?: string;
  categoryId?: number;
  limit?: number;
}

export interface ProductVectorSuggestionParams {
  q: string;
  categoryId?: number;
  limit?: number;
}

import type { VariantType } from "./variant.types";

// Variant khi tạo product mới (productId chưa có)
export interface CreateProductVariantRequest {
  variantType: VariantType;
  variantValue: string;
  colorCode?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  stockQuantity?: number | null;
  sku?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  sku?: string;
  brand?: string;
  color?: string;
  size?: string;
  weight?: string;
  dimensions?: string;
  specifications?: string;
  thumbnailUrl?: string;
  categoryIds?: number[]; // For many-to-many relationship
  isActive?: boolean;
  isFeatured?: boolean;
  variants?: CreateProductVariantRequest[]; // Bắt buộc phải có ít nhất 1 variant
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  sku?: string;
  brand?: string;
  color?: string;
  size?: string;
  weight?: string;
  dimensions?: string;
  specifications?: string;
  thumbnailUrl?: string;
  categoryIds?: number[];
  isActive?: boolean;
  isFeatured?: boolean;
  // Stock được quản lý qua variants
}
