import axiosInstance from './axios.config';
import type { CategoryDTO } from './category.service';

export interface ProductImageDTO {
  id: number;
  imageUrl: string;
  sortOrder?: number;
  productId?: number;
}

export interface ProductDTO {
  id: number;
  name: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  stockQuantity?: number;
  sku?: string;
  brand?: string;
  color?: string;
  size?: string;
  weight?: string;
  dimensions?: string;
  specifications?: string;
  thumbnailUrl?: string;
  categories?: CategoryDTO[];
  images?: ProductImageDTO[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  stockQuantity?: number;
  sku?: string;
  brand?: string;
  color?: string;
  size?: string;
  weight?: string;
  dimensions?: string;
  specifications?: string;
  thumbnailUrl?: string;
  categoryIds?: number[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  stockQuantity?: number;
  sku?: string;
  brand?: string;
  color?: string;
  size?: string;
  weight?: string;
  dimensions?: string;
  specifications?: string;
  thumbnailUrl?: string;
  categoryIds?: number[];
  isActive?: boolean;
  isFeatured?: boolean;
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

export const productService = {
  getAllProducts: async (params: {
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
    id?: number;
    name?: string;
    sku?: string;
    brand?: string;
    categoryId?: number;
    isFeatured?: boolean;
    isActive?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<ProductDTO>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.direction) queryParams.append('direction', params.direction);
    if (params.id) queryParams.append('id', params.id.toString());
    if (params.name) queryParams.append('name', params.name);
    if (params.sku) queryParams.append('sku', params.sku);
    if (params.brand) queryParams.append('brand', params.brand);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.isFeatured !== undefined) queryParams.append('isFeatured', params.isFeatured.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);

    const response = await axiosInstance.get<{
      status: string;
      message: string;
      data: PaginatedResponse<ProductDTO>;
    }>(`/products/advanced?${queryParams.toString()}`);
    
    if (response && 'data' in response && response.data && 'metadata' in response.data && 'result' in response.data) {
      return response.data;
    }
    
    throw new Error('Response không đúng định dạng');
  },

  getProductById: async (id: number): Promise<ProductDTO> => {
    const response = await axiosInstance.get<{ data: ProductDTO } | ProductDTO>(`/products/${id}`);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as ProductDTO;
  },

  createProduct: async (productData: CreateProductRequest): Promise<ProductDTO> => {
    const response = await axiosInstance.post<{ data: ProductDTO } | ProductDTO>('/products', productData);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as ProductDTO;
  },

  updateProduct: async (id: number, productData: UpdateProductRequest): Promise<ProductDTO> => {
    const response = await axiosInstance.put<{ data: ProductDTO } | ProductDTO>(`/products/${id}`, productData);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as ProductDTO;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/products/${id}`);
  },

  uploadThumbnail: async (
    file: File,
    productId?: number
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', 'image');
    formData.append('module', 'products');
    if (productId) {
      formData.append('entityId', productId.toString());
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

