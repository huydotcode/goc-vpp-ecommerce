import { productService } from "@/services/product.service";
import type {
  CreateProductRequest,
  ProductFilters,
  UpdateProductRequest,
} from "@/types/product.types";
import { handleApiError, showSuccess } from "@/utils/error";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  page: (params: { page?: number; size?: number }) =>
    [...productKeys.lists(), "page", params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

// Get all products with pagination and filters
export const useProducts = (filters: ProductFilters, enabled = true) => {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productService.getAllProducts(filters),
    enabled,
  });
};

// Get products with simple pagination
export const useProductsPage = (
  params: { page?: number; size?: number },
  enabled = true
) => {
  return useQuery({
    queryKey: productKeys.page(params),
    queryFn: () => productService.getProductsPage(params),
    enabled,
  });
};

// Get product by ID
export const useProduct = (id: number, enabled = true) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProductById(id),
    enabled: enabled && !!id,
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: CreateProductRequest) =>
      productService.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      showSuccess("Tạo sản phẩm thành công");
    },
    onError: handleApiError,
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRequest }) =>
      productService.updateProduct(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      showSuccess("Cập nhật sản phẩm thành công");
    },
    onError: handleApiError,
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      showSuccess("Xóa sản phẩm thành công");
    },
    onError: handleApiError,
  });
};

// Upload thumbnail mutation
export const useUploadThumbnail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, productId }: { file: File; productId?: number }) =>
      productService.uploadThumbnail(file, productId),
    onSuccess: (_data, variables) => {
      if (variables.productId) {
        queryClient.invalidateQueries({
          queryKey: productKeys.detail(variables.productId),
        });
      }
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      showSuccess("Upload thumbnail thành công");
    },
    onError: handleApiError,
  });
};
