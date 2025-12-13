import { reviewApi } from "@/api/review.api";
import type {
  ReviewStats,
  CreateReviewRequest,
  ReviewResponseDTO,
} from "@/types/review.types";

export const reviewService = {
  getReviewsByProduct: async (productId: number, page = 1, size = 5) => {
    try {
      const params = { page, size, sort: "createdAt", direction: "desc" };

      const response = await reviewApi.getReviewsByProduct(productId, params);

      return (response as any).data as ReviewResponseDTO;
    } catch (error) {
      console.error("Lỗi tải review:", error);
      return null;
    }
  },

  getStats: async (productId: number) => {
    try {
      const response = await reviewApi.getStats(productId);
      return (response as any).data as ReviewStats;
    } catch (error) {
      return null;
    }
  },

  createReview: async (data: CreateReviewRequest) => {
    const response = await reviewApi.createReview(data);
    return response;
  },

  checkUserReviewed: async (productId: number) => {
    try {
      const response = await reviewApi.checkUserReviewed(productId);
      return (response as any).data as boolean;
    } catch (error) {
      console.error("Error checking review status:", error);
      return false;
    }
  },
};
