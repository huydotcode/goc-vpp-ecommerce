import type { PaginatedResponse } from "@/types/common.types";
import type {
  ProductVariant,
  CreateVariantRequest,
  UpdateVariantRequest,
  VariantFilters,
} from "@/types/variant.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export const variantApi = {
  getVariantsByProductId: async (
    productId: number,
    activeOnly: boolean = false
  ): Promise<ProductVariant[]> => {
    const response = await apiClient.get<ProductVariant[]>(
      `${API_ENDPOINTS.PRODUCT_VARIANTS}/product/${productId}`,
      { params: { activeOnly } }
    );
    return response.data;
  },

  getVariantsAdvanced: async (
    filters: VariantFilters
  ): Promise<PaginatedResponse<ProductVariant>> => {
    const response = await apiClient.get<PaginatedResponse<ProductVariant>>(
      API_ENDPOINTS.PRODUCT_VARIANTS_ADVANCED,
      { params: filters }
    );
    return response.data;
  },

  getVariantById: async (id: number): Promise<ProductVariant> => {
    const response = await apiClient.get<ProductVariant>(
      `${API_ENDPOINTS.PRODUCT_VARIANTS}/${id}`
    );
    return response.data;
  },

  createVariant: async (
    variant: CreateVariantRequest
  ): Promise<ProductVariant> => {
    const response = await apiClient.post<ProductVariant>(
      API_ENDPOINTS.PRODUCT_VARIANTS,
      variant
    );
    return response.data;
  },

  updateVariant: async (
    id: number,
    variant: UpdateVariantRequest
  ): Promise<ProductVariant> => {
    const response = await apiClient.put<ProductVariant>(
      `${API_ENDPOINTS.PRODUCT_VARIANTS}/${id}`,
      variant
    );
    return response.data;
  },

  deleteVariant: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.PRODUCT_VARIANTS}/${id}`);
  },
};

