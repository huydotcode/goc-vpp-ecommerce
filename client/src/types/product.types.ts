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
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface ProductFilters {
  id?: number;
  name?: string;
  sku?: string;
  brand?: string;
  categoryId?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
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
}
