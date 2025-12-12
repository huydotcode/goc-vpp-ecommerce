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
  cartItemIds?: number[]; // Optional: nếu không có thì checkout tất cả items trong cart
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
  variantName?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isGift?: boolean;
}

export interface Order {
  id: number;
  orderCode: string;
  createdAt: string;
  totalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  appliedPromotions?: string; // JSON string
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentLinkId?: string | null;
  description?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  items?: OrderItem[];
  // From Remote
  updatedAt?: string | null;
  userFirstName?: string;
  userLastName?: string;
}

export interface DailySale {
  date: string;
  orders: number;
  revenue: number;
  customers: number;
}

export interface OrderStatistics {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  dailySales: DailySale[];
}

export interface OrderStatisticsByRange {
  rangeRevenue: number;
  rangeOrders: number;
  startDate: string;
  endDate: string;
  dailySales: DailySale[];
}

export interface OrderDetail {
  id: number;
  orderCode: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string | null;
  items: OrderItem[];
  // User account info (if order is linked to a user account)
  userId?: number;
  userFirstName?: string;
  userLastName?: string;
}
