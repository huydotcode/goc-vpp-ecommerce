import { productService } from "@/services/product.service";
import type {
  CreateProductRequest,
  ProductFilters,
  ProductSuggestionParams,
  ProductVectorSuggestionParams,
  UpdateProductRequest,
} from "@/types/product.types";
import { handleApiError } from "@/utils/error";
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
  bestSellers: (size: number) =>
    [...productKeys.all, "best-sellers", { size }] as const,
  suggestions: (params: ProductSuggestionParams) =>
    [...productKeys.all, "suggestions", params] as const,
  vectorSuggestions: (params: ProductVectorSuggestionParams) =>
    [...productKeys.all, "vector-suggestions", params] as const,
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

// Get best seller / top products
export const useBestSellers = (size = 8, enabled = true) => {
  return useQuery({
    queryKey: productKeys.bestSellers(size),
    queryFn: () => productService.getBestSellers({ size }),
    enabled,
  });
};

// Get product suggestions (AI-like)
export const useProductSuggestions = (
  params: ProductSuggestionParams,
  enabled = true
) => {
  return useQuery({
    queryKey: productKeys.suggestions(params),
    queryFn: () => productService.getSuggestions(params),
    enabled,
  });
};

// Get product vector suggestions (Gemini + ChromaDB)
export const useProductVectorSuggestions = (
  params: ProductVectorSuggestionParams,
  enabled = true
) => {
  return useQuery({
    queryKey: productKeys.vectorSuggestions(params),
    queryFn: () => productService.getVectorSuggestions(params),
    enabled: enabled && !!params.q && params.q.trim().length > 0,
  });
};

// Track product view mutation
export const useTrackProductView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => productService.trackProductView(productId),
    onSuccess: () => {
      // Invalidate history suggestions để refresh gợi ý
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "history-suggestions"],
      });
    },
    onError: handleApiError,
  });
};

// Get history-based suggestions
export const useHistoryBasedSuggestions = (
  params: { categoryId?: number; limit?: number } = {},
  enabled = true
) => {
  return useQuery({
    queryKey: [...productKeys.all, "history-suggestions", params],
    queryFn: async () => {
      console.log("[useHistoryBasedSuggestions] Calling API with params:", params, "enabled:", enabled);
      try {
        const result = await productService.getHistoryBasedSuggestions(params);
        console.log("[useHistoryBasedSuggestions] API result:", result?.length || 0, "products");
        return result;
      } catch (error) {
        console.error("[useHistoryBasedSuggestions] API error:", error);
        throw error;
      }
    },
    enabled,
    retry: 1,
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
    },
    onError: handleApiError,
  });
};
