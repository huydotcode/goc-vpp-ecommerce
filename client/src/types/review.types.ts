export interface Review {
  id: number;
  productId: number;
  userFullName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export interface CreateReviewRequest {
  productId: number;
  rating: number;
  content: string;
  userFullName?: string;
}

// --- THÊM PHẦN NÀY ĐỂ SỬA LỖI ---
export interface ReviewResponseDTO {
  metadata: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  result: Review[];
}
