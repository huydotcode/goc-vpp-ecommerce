import { categoryApi } from "@/api/category.api";
import { uploadApi } from "@/api/upload.api";
import type {
  Category,
  CategoryFilters,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/types/category.types";
import type { PaginatedResponse } from "@/types/common.types";
import type { UploadResponse } from "@/types/upload.types";

// Re-export types để backward compatibility
export type {
  Category as CategoryDTO,
  CreateCategoryRequest,
  UpdateCategoryRequest,
};

export const categoryService = {
  /**
   * Get all categories with pagination and filters
   */
  getAllCategories: async (
    params: CategoryFilters
  ): Promise<PaginatedResponse<Category>> => {
    return categoryApi.getCategoriesAdvanced(params);
  },

  /**
   * Get categories with simple filtering (no pagination)
   */
  getCategoriesFilter: async (filters: {
    name?: string;
    isActive?: boolean;
  }): Promise<Category[]> => {
    return categoryApi.getCategoriesFilter(filters);
  },

  /**
   * Get category by ID
   */
  getCategoryById: async (id: number): Promise<Category> => {
    return categoryApi.getCategoryById(id);
  },

  /**
   * Create new category
   */
  createCategory: async (
    categoryData: CreateCategoryRequest
  ): Promise<Category> => {
    return categoryApi.createCategory(categoryData);
  },

  /**
   * Update category
   */
  updateCategory: async (
    id: number,
    categoryData: UpdateCategoryRequest
  ): Promise<Category> => {
    return categoryApi.updateCategory(id, categoryData);
  },

  /**
   * Delete category (soft delete)
   */
  deleteCategory: async (id: number): Promise<void> => {
    return categoryApi.deleteCategory(id);
  },

  /**
   * Upload category thumbnail
   */
  uploadThumbnail: async (
    file: File,
    categoryId?: number
  ): Promise<UploadResponse> => {
    return uploadApi.upload(
      file,
      "image",
      "categories",
      categoryId?.toString(),
      "thumbnailUrl"
    );
  },
};
