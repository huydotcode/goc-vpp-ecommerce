export interface CartItem {
  id: number;
  productId: number;
  productName: string;
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
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  grandTotal?: number;
  appliedPromotion?: string | null;
}

export interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cartItemId: number;
  quantity: number;
}
