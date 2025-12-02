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
};



