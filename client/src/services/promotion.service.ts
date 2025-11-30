import axiosInstance from './axios.config';

export type PromotionDiscountType = 'DISCOUNT_AMOUNT' | 'GIFT';
export type PromotionConditionOperator = 'ALL' | 'ANY';

export interface ConditionDetailDTO {
  id?: number;
  productId: number;
  productName?: string;
  productPrice?: number;
  requiredQuantity: number;
}

export interface ConditionGroupDTO {
  id?: number;
  operator: PromotionConditionOperator;
  details: ConditionDetailDTO[];
}

export interface GiftItemDTO {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
}

export interface PromotionDTO {
  id: number;
  name: string;
  thumbnailUrl?: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountAmount?: number;
  isActive: boolean;
  conditions?: ConditionGroupDTO[];
  giftItems?: GiftItemDTO[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreatePromotionRequest {
  name: string;
  thumbnailUrl?: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountAmount?: number;
  conditions?: ConditionGroupDTO[];
  giftItems?: GiftItemDTO[];
  isActive?: boolean;
}

export interface UpdatePromotionRequest {
  name?: string;
  thumbnailUrl?: string;
  description?: string;
  discountType?: PromotionDiscountType;
  discountAmount?: number;
  conditions?: ConditionGroupDTO[];
  giftItems?: GiftItemDTO[];
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  metadata: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    empty: boolean;
    sortField: string;
    sortDirection: string;
    numberOfElements: number;
  };
  result: T[];
}

export interface UploadResponse {
  status: string;
  message: string;
  data: {
    secureUrl: string;
    publicId: string;
    [key: string]: unknown;
  };
}

export const promotionService = {
  getAllPromotions: async (params: {
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
    id?: number;
    name?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<PromotionDTO>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.direction) queryParams.append('direction', params.direction);
    if (params.id) queryParams.append('id', params.id.toString());
    if (params.name) queryParams.append('name', params.name);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);

    const response = await axiosInstance.get<{
      status: string;
      message: string;
      data: PaginatedResponse<PromotionDTO>;
    }>(`/promotions/advanced?${queryParams.toString()}`);
    
    if (response && 'data' in response && response.data && 'metadata' in response.data && 'result' in response.data) {
      return response.data;
    }
    
    throw new Error('Response không đúng định dạng');
  },

  getPromotionById: async (id: number): Promise<PromotionDTO> => {
    const response = await axiosInstance.get<{ data: PromotionDTO } | PromotionDTO>(`/promotions/${id}`);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as PromotionDTO;
  },

  createPromotion: async (promotionData: CreatePromotionRequest): Promise<PromotionDTO> => {
    const response = await axiosInstance.post<{ data: PromotionDTO } | PromotionDTO>('/promotions', promotionData);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as PromotionDTO;
  },

  updatePromotion: async (id: number, promotionData: UpdatePromotionRequest): Promise<PromotionDTO> => {
    const response = await axiosInstance.put<{ data: PromotionDTO } | PromotionDTO>(`/promotions/${id}`, promotionData);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as PromotionDTO;
  },


  getActivePromotions: async (): Promise<PromotionDTO[]> => {
    const response = await axiosInstance.get<{ data: PromotionDTO[] } | PromotionDTO[]>('/promotions/active');
    if (response && 'data' in response && Array.isArray(response.data)) {
      return response.data;
    }
    return response as PromotionDTO[];
  },

  uploadThumbnail: async (
    file: File,
    promotionId?: number
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', 'image');
    formData.append('module', 'promotions');
    if (promotionId) {
      formData.append('entityId', promotionId.toString());
    }
    formData.append('purpose', 'thumbnailUrl');

    const response = await axiosInstance.post<UploadResponse | { data: UploadResponse }>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response && 'data' in response && typeof response.data === 'object' && 'status' in response.data && 'message' in response.data) {
      return response.data;
    }
    return response as unknown as UploadResponse;
  },
};

