import apiClient from "./client";

export interface CreateVnPayPaymentRequest {
  amount?: number;
  orderInfo?: string;
  bankCode?: string;
  locale?: string;
}

export interface CreateVnPayPaymentResponse {
  paymentUrl: string;
}

interface ApiResponseWrapper<T> {
  status: string;
  message: string;
  data: T;
  errorCode?: string | null;
}

export interface CreatePayOSPaymentRequest {
  amount?: number;
  description?: string;
  orderCode?: string;
}

export interface CreateCODOrderRequest {
  amount?: number;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
}

export interface CreateCODOrderResponse {
  orderCode?: string;
  status?: string;
  paymentMethod?: string;
  totalAmount?: number;
  message?: string;
}

export interface CreatePayOSPaymentResponse {
  paymentUrl?: string;
  checkoutUrl?: string;
  [key: string]: unknown;
}

export const paymentApi = {
  createVnPayPayment: async (
    data: CreateVnPayPaymentRequest
  ): Promise<CreateVnPayPaymentResponse> => {
    const res = (await apiClient.post(
      "/payment/vnpay/create",
      data
    )) as CreateVnPayPaymentResponse | ApiResponseWrapper<CreateVnPayPaymentResponse>;

    if ("paymentUrl" in res) {
      return res;
    }

    if (res && typeof res === "object" && "data" in res && res.data) {
      return (res as ApiResponseWrapper<CreateVnPayPaymentResponse>).data;
    }

    throw new Error("Khong doc duoc paymentUrl tu response VNPAY");
  },

  createPayOSPayment: async (
    data: CreatePayOSPaymentRequest
  ): Promise<CreatePayOSPaymentResponse> => {
    const res = (await apiClient.post(
      "/payment/payos/create",
      data
    )) as CreatePayOSPaymentResponse | ApiResponseWrapper<CreatePayOSPaymentResponse>;

    // Response có thể được wrap trong APIResponse
    if (res && typeof res === "object") {
      // Nếu có checkoutUrl trực tiếp (không wrap)
      if ("checkoutUrl" in res || "paymentUrl" in res) {
        return res as CreatePayOSPaymentResponse;
      }
      
      // Nếu được wrap trong ApiResponse
      if ("data" in res && res.data) {
        const payosData = (res as ApiResponseWrapper<unknown>).data;
        
        // PayOS response structure: { code: "00", desc: "success", data: { checkoutUrl: "..." } }
        if (payosData && typeof payosData === "object") {
          // Kiểm tra nếu có checkoutUrl trực tiếp trong data
          if ("checkoutUrl" in payosData || "paymentUrl" in payosData) {
            return payosData as CreatePayOSPaymentResponse;
          }
          
          // Kiểm tra nested data (PayOS structure: data.data.checkoutUrl)
          if ("data" in payosData && payosData.data && typeof payosData.data === "object") {
            const nestedData = payosData.data as Record<string, unknown>;
            if ("checkoutUrl" in nestedData || "paymentUrl" in nestedData) {
              return nestedData as CreatePayOSPaymentResponse;
            }
          }
          
          // Kiểm tra lỗi từ PayOS
          if ("code" in payosData && "desc" in payosData) {
            const errorData = payosData as { code?: string; desc?: string };
            if (errorData.code !== "00") {
              throw new Error(`PayOS error: ${errorData.desc || errorData.code || "Unknown error"}`);
            }
          }
        }
      }
      
      // Nếu có lỗi trực tiếp
      if ("code" in res && "desc" in res) {
        const errorData = res as { code?: string; desc?: string };
        if (errorData.code !== "00") {
          throw new Error(`PayOS error: ${errorData.desc || errorData.code || "Unknown error"}`);
        }
      }
    }

    throw new Error("Khong doc duoc paymentUrl tu response PayOS");
  },

  createCODOrder: async (
    data: CreateCODOrderRequest
  ): Promise<CreateCODOrderResponse> => {
    try {
      const res = (await apiClient.post(
        "/orders/cod",
        data
      )) as CreateCODOrderResponse | ApiResponseWrapper<CreateCODOrderResponse>;

      // Response có thể được wrap trong APIResponse
      if (res && typeof res === "object") {
        // Nếu có orderCode trực tiếp
        if ("orderCode" in res) {
          return res as CreateCODOrderResponse;
        }

        // Nếu được wrap trong ApiResponse
        if ("data" in res && res.data) {
          const responseData = (res as ApiResponseWrapper<CreateCODOrderResponse>).data;
          
          // Kiểm tra nếu có lỗi trong data
          if (responseData && typeof responseData === "object" && "error" in responseData) {
            const errorData = responseData as { error?: string; message?: string };
            throw new Error(errorData.error || errorData.message || "Failed to create COD order");
          }
          
          return responseData;
        }
      }

      throw new Error("Khong doc duoc orderCode tu response COD");
    } catch (error) {
      // Xử lý lỗi từ API
      if (error && typeof error === "object" && "message" in error) {
        throw error;
      }
      throw new Error("Co loi xay ra khi tao don hang COD");
    }
  },
};



