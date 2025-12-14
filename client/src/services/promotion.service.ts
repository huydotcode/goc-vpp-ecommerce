import { promotionApi } from "@/api/promotion.api";
import { uploadApi } from "@/api/upload.api";
import type {
  Promotion,
  PromotionRequest,
  PromotionResponse,
  PromotionFilters,
  PromotionConditionRequest,
  PromotionConditionResponse,
  PromotionConditionDetailRequest,
  PromotionConditionDetailResponse,
  PromotionGiftItemRequest,
  PromotionGiftItemResponse,
} from "@/types/promotion.types";
import type { PaginatedResponse } from "@/types/common.types";
import type { UploadResponse } from "@/types/upload.types";

// Re-export types để backward compatibility
export type {
  PromotionResponse as PromotionDTO,
  PromotionRequest as CreatePromotionRequest,
  PromotionRequest as UpdatePromotionRequest,
  PromotionConditionRequest as ConditionGroupDTO,
  PromotionConditionDetailRequest as ConditionDetailDTO,
  PromotionGiftItemRequest as GiftItemDTO,
  // Response types
  PromotionConditionResponse,
  PromotionConditionDetailResponse,
  PromotionGiftItemResponse,
};

export const promotionService = {
  /**
   * Get all promotions with pagination and filters
   */
  getAllPromotions: async (
    params: PromotionFilters
  ): Promise<PaginatedResponse<PromotionResponse>> => {
    return promotionApi.getPromotionsAdvanced(params);
  },

  /**
   * Get active promotions
   */
  getActivePromotions: async (): Promise<PromotionResponse[]> => {
    return promotionApi.getActivePromotions();
  },

  /**
   * Get promotion by ID
   */
  getPromotionById: async (id: number): Promise<PromotionResponse> => {
    return promotionApi.getPromotionById(id);
  },

  /**
   * Get promotion by slug
   */
  getPromotionBySlug: async (slug: string): Promise<PromotionResponse> => {
    return promotionApi.getPromotionBySlug(slug);
  },

  /**
   * Create new promotion
   */
  createPromotion: async (
    promotionData: PromotionRequest
  ): Promise<Promotion> => {
    return promotionApi.createPromotion(promotionData);
  },

  /**
   * Update promotion
   */
  updatePromotion: async (
    id: number,
    promotionData: PromotionRequest
  ): Promise<Promotion> => {
    return promotionApi.updatePromotion(id, promotionData);
  },

  /**
   * Upload promotion thumbnail
   */
  uploadThumbnail: async (
    file: File,
    promotionId?: number
  ): Promise<UploadResponse> => {
    return uploadApi.upload(
      file,
      "image",
      "promotions",
      promotionId?.toString(),
      "thumbnailUrl"
    );
  },
};
