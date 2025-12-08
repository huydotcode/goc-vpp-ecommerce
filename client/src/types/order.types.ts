export const PaymentMethod = {
  PAYOS: "PAYOS",
  COD: "COD",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  CONFIRMED: "CONFIRMED",
  SHIPPING: "SHIPPING",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface CheckoutRequest {
  paymentMethod: PaymentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  description?: string;
}

export interface CheckoutResponse {
  orderCode: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  message: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderCode: string;
  userId?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentLinkId?: string | null;
  status: OrderStatus;
  description?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string | null;
}
