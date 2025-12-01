/**
 * Category types
 */

export interface Category {
  id: number;
  name: string;
  thumbnailUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface CategoryFilters {
  id?: number;
  name?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

export interface CreateCategoryRequest {
  name: string;
  thumbnailUrl?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  thumbnailUrl?: string;
  description?: string;
  isActive?: boolean;
}

