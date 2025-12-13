import type {
  CreateReviewRequest,
  ReviewResponseDTO,
} from "@/types/review.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export const reviewApi = {
  getReviewsByProduct: (productId: number, params: any) => {
    return apiClient.get<ReviewResponseDTO>(
      `${API_ENDPOINTS.REVIEWS_PRODUCT}/${productId}`,
      {
        params,
      }
    );
  },

  getStats: (productId: number) => {
    return apiClient.get<any>(`${API_ENDPOINTS.REVIEWS_STATS}/${productId}`);
  },

  createReview: (data: CreateReviewRequest) => {
    return apiClient.post(API_ENDPOINTS.REVIEWS, data);
  },

  checkUserReviewed: (productId: number) => {
    return apiClient.get<boolean>(
      `${API_ENDPOINTS.REVIEWS}/check/${productId}`
    );
  },
};
