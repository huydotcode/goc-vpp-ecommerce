import { categoryService } from "@/services/category.service";
import type {
  CategoryFilters,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/types/category.types";
import { handleApiError } from "@/utils/error";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (filters: CategoryFilters) =>
    [...categoryKeys.lists(), filters] as const,
  filters: (filters: { name?: string; isActive?: boolean }) =>
    [...categoryKeys.all, "filter", filters] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

// Get all categories with pagination and filters
export const useCategories = (filters: CategoryFilters, enabled = true) => {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: () => categoryService.getAllCategories(filters),
    enabled,
  });
};

// Get categories with simple filtering
export const useCategoriesFilter = (
  filters: { name?: string; isActive?: boolean },
  enabled = true
) => {
  return useQuery({
    queryKey: categoryKeys.filters(filters),
    queryFn: () => categoryService.getCategoriesFilter(filters),
    enabled,
  });
};

// Get nested categories (with children)
export const useNestedCategories = (
  filters: { isActive?: boolean },
  enabled = true
) => {
  return useQuery({
    queryKey: [...categoryKeys.all, "nested", filters],
    queryFn: () => categoryService.getNestedCategories(filters),
    enabled,
  });
};

// Get category by ID
export const useCategory = (id: number, enabled = true) => {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryService.getCategoryById(id),
    enabled: enabled && !!id,
  });
};

// Create category mutation
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: CreateCategoryRequest) =>
      categoryService.createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
    onError: handleApiError,
  });
};

// Update category mutation
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryRequest }) =>
      categoryService.updateCategory(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(variables.id),
      });
    },
    onError: handleApiError,
  });
};

// Delete category mutation
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
    onError: handleApiError,
  });
};

// Upload thumbnail mutation
export const useUploadCategoryThumbnail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, categoryId }: { file: File; categoryId?: number }) =>
      categoryService.uploadThumbnail(file, categoryId),
    onSuccess: (_data, variables) => {
      if (variables.categoryId) {
        queryClient.invalidateQueries({
          queryKey: categoryKeys.detail(variables.categoryId),
        });
      }
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
    onError: handleApiError,
  });
};
