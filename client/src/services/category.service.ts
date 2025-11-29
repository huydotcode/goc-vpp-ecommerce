import axiosInstance from './axios.config';

export interface CategoryDTO {
  id: number;
  name: string;
  thumbnailUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
}

export interface CreateCategoryRequest {
  name: string;
  thumbnailUrl?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  thumbnailUrl?: string;
  description?: string;
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

export const categoryService = {
  getAllCategories: async (params: {
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
    id?: number;
    name?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<CategoryDTO>> => {
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
      data: PaginatedResponse<CategoryDTO>;
    }>(`/categories/advanced?${queryParams.toString()}`);
    
    if (response && 'data' in response && response.data && 'metadata' in response.data && 'result' in response.data) {
      return response.data;
    }
    
    throw new Error('Response không đúng định dạng');
  },

  getCategoryById: async (id: number): Promise<CategoryDTO> => {
    const response = await axiosInstance.get<{ data: CategoryDTO } | CategoryDTO>(`/categories/${id}`);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as CategoryDTO;
  },

  createCategory: async (categoryData: CreateCategoryRequest): Promise<CategoryDTO> => {
    const response = await axiosInstance.post<{ data: CategoryDTO } | CategoryDTO>('/categories', categoryData);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as CategoryDTO;
  },

  updateCategory: async (id: number, categoryData: UpdateCategoryRequest): Promise<CategoryDTO> => {
    const response = await axiosInstance.put<{ data: CategoryDTO } | CategoryDTO>(`/categories/${id}`, categoryData);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as CategoryDTO;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
  },

  uploadThumbnail: async (
    file: File,
    categoryId?: number
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', 'image');
    formData.append('module', 'categories');
    if (categoryId) {
      formData.append('entityId', categoryId.toString());
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

