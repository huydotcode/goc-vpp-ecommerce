/**
 * Promotion types
 */

export const PromotionDiscountType = {
  DISCOUNT_AMOUNT: "DISCOUNT_AMOUNT",
  GIFT: "GIFT",
} as const;

export type PromotionDiscountType =
  (typeof PromotionDiscountType)[keyof typeof PromotionDiscountType];

export const PromotionConditionOperator = {
  ALL: "ALL",
  ANY: "ANY",
} as const;

export type PromotionConditionOperator =
  (typeof PromotionConditionOperator)[keyof typeof PromotionConditionOperator];

/**
 * PromotionConditionDetail for Request (CREATE/UPDATE)
 * Matches backend ConditionDetailDTO - only required fields
 */
export interface PromotionConditionDetailRequest {
  productId: number;
  requiredQuantity: number;
}

/**
 * PromotionConditionDetail for Response (GET)
 * Matches backend ConditionDetailDTO - includes all fields from entity
 */
export interface PromotionConditionDetailResponse {
  id: number;
  productId: number;
  productName?: string | null;
  productPrice?: number | null;
  productThumbnailUrl?: string | null;
  requiredQuantity: number;
}

/**
 * PromotionCondition for Request (CREATE/UPDATE)
 * Matches backend ConditionGroupDTO - no id
 */
export interface PromotionConditionRequest {
  operator: PromotionConditionOperator;
  details: PromotionConditionDetailRequest[];
}

/**
 * PromotionCondition for Response (GET)
 * Matches backend ConditionDTO - includes id
 */
export interface PromotionConditionResponse {
  id: number;
  operator: PromotionConditionOperator;
  details: PromotionConditionDetailResponse[];
}

/**
 * PromotionGiftItem for Request (CREATE/UPDATE)
 * Matches backend GiftItemDTO - only required fields
 */
export interface PromotionGiftItemRequest {
  productId: number;
  quantity: number;
}

/**
 * PromotionGiftItem for Response (GET)
 * Matches backend GiftItemDTO - includes all fields from entity
 */
export interface PromotionGiftItemResponse {
  id: number;
  productId: number;
  productName?: string | null;
  productThumbnailUrl?: string | null;
  quantity: number;
}

/**
 * Promotion entity (full entity with audit fields)
 * Used internally, not directly returned from API
 */
export interface Promotion {
  id: number;
  name: string;
  thumbnailUrl?: string | null;
  description?: string | null;
  discountType: PromotionDiscountType;
  discountAmount?: number | null;
  isActive: boolean;
  conditions: PromotionConditionResponse[];
  giftItems: PromotionGiftItemResponse[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

/**
 * PromotionRequest for CREATE/UPDATE operations
 * Matches backend PromotionRequestDTO
 */
export interface PromotionRequest {
  name: string;
  slug?: string;
  thumbnailUrl?: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountAmount?: number;
  conditions: PromotionConditionRequest[];
  giftItems: PromotionGiftItemRequest[];
}

/**
 * PromotionResponse from API (GET operations)
 * Matches backend PromotionResponseDTO
 */
export interface PromotionResponse {
  id: number;
  name: string;
  slug?: string | null;
  thumbnailUrl?: string | null;
  description?: string | null;
  discountType: PromotionDiscountType;
  discountAmount?: number | null;
  isActive: boolean;
  conditions: PromotionConditionResponse[];
  giftItems: PromotionGiftItemResponse[];
}

export interface PromotionFilters {
  id?: number;
  name?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
}
