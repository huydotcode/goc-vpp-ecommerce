export interface CartItem {
  id: number;
  productId: number;
  variantId?: number | null;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  productImageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CartResponse {
  cartId: number;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  discountAmount?: number;
  finalAmount?: number;
  appliedPromotions?: PromotionSummary[];
  giftItems?: GiftItem[];
}

export interface PromotionSummary {
  id: number;
  name: string;
  description: string;
  discountType: string;
  value: number;
}

export interface GiftItem {
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
}

export interface AddCartItemRequest {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cartItemId: number;
  quantity: number;
}

export interface UpdateCartItemVariantRequest {
  cartItemId: number;
  variantId: number | null;
}
