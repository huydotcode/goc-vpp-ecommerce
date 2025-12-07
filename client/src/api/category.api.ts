import type { PaginatedResponse } from "@/types/common.types";
import type {
  Category,
  CategoryFilters,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/types/category.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export const categoryApi = {
  /**
   * Get categories with pagination, sorting, and filtering
   */
  getCategoriesAdvanced: async (
    filters: CategoryFilters
  ): Promise<PaginatedResponse<Category>> => {
    const response = await apiClient.get<PaginatedResponse<Category>>(
      API_ENDPOINTS.CATEGORIES_ADVANCED,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get categories with simple filtering (no pagination)
   */
  getCategoriesFilter: async (filters: {
    name?: string;
    isActive?: boolean;
  }): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>(
      API_ENDPOINTS.CATEGORIES_FILTER,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get category by ID
   */
  getCategoryById: async (id: number): Promise<Category> => {
    const response = await apiClient.get<Category>(
      `${API_ENDPOINTS.CATEGORIES}/${id}`
    );
    return response.data;
  },

  /**
   * Create new category
   */
  createCategory: async (
    category: CreateCategoryRequest
  ): Promise<Category> => {
    const response = await apiClient.post<Category>(
      API_ENDPOINTS.CATEGORIES,
      category
    );
    return response.data;
  },

  /**
   * Update category by ID
   */
  updateCategory: async (
    id: number,
    category: UpdateCategoryRequest
  ): Promise<Category> => {
    const response = await apiClient.put<Category>(
      `${API_ENDPOINTS.CATEGORIES}/${id}`,
      category
    );
    return response.data;
  },

  /**
   * Delete category by ID (soft delete)
   */
  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.CATEGORIES}/${id}`);
  },

  /**
   * Get nested categories (with children)
   */
  getNestedCategories: async (filters: {
    isActive?: boolean;
  }): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>(
      `${API_ENDPOINTS.CATEGORIES}/nested`,
      { params: filters }
    );
    return response.data;
  },
};
