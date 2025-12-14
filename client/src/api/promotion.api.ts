import type { PaginatedResponse } from "@/types/common.types";
import type {
  Promotion,
  PromotionRequest,
  PromotionResponse,
  PromotionFilters,
} from "@/types/promotion.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export const promotionApi = {
  /**
   * Get promotions with pagination, sorting, and filtering
   */
  getPromotionsAdvanced: async (
    filters: PromotionFilters
  ): Promise<PaginatedResponse<PromotionResponse>> => {
    const response = await apiClient.get<PaginatedResponse<PromotionResponse>>(
      API_ENDPOINTS.PROMOTIONS_ADVANCED,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get active promotions
   */
  getActivePromotions: async (): Promise<PromotionResponse[]> => {
    const response = await apiClient.get<PromotionResponse[]>(
      API_ENDPOINTS.PROMOTIONS_ACTIVE
    );
    return response.data;
  },

  /**
   * Get promotion by ID
   */
  getPromotionById: async (id: number): Promise<PromotionResponse> => {
    const response = await apiClient.get<PromotionResponse>(
      `${API_ENDPOINTS.PROMOTIONS}/${id}`
    );
    return response.data;
  },

  /**
   * Get promotion by slug
   */
  getPromotionBySlug: async (slug: string): Promise<PromotionResponse> => {
    const response = await apiClient.get<PromotionResponse>(
      `${API_ENDPOINTS.PROMOTIONS}/slug/${slug}`
    );
    return response.data;
  },

  /**
   * Create new promotion
   */
  createPromotion: async (promotion: PromotionRequest): Promise<Promotion> => {
    const response = await apiClient.post<Promotion>(
      API_ENDPOINTS.PROMOTIONS,
      promotion
    );
    return response.data;
  },

  /**
   * Update promotion by ID
   */
  updatePromotion: async (
    id: number,
    promotion: PromotionRequest
  ): Promise<Promotion> => {
    const response = await apiClient.put<Promotion>(
      `${API_ENDPOINTS.PROMOTIONS}/${id}`,
      promotion
    );
    return response.data;
  },

  /**
   * Delete promotion by ID (soft delete)
   */
  deletePromotion: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.PROMOTIONS}/${id}`);
  },
};
