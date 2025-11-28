import axiosInstance from './axios.config';

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  role: 'ADMIN' | 'USER';
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
  isActive?: boolean;
  role: 'ADMIN' | 'USER';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  isActive?: boolean;
  role?: 'ADMIN' | 'USER';
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

export const userService = {
  getAllUsers: async (params: {
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
    id?: number;
    role?: string;
    username?: string;
    email?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<UserDTO>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.direction) queryParams.append('direction', params.direction);
    if (params.id) queryParams.append('id', params.id.toString());
    if (params.role) queryParams.append('role', params.role);
    if (params.username) queryParams.append('username', params.username);
    if (params.email) queryParams.append('email', params.email);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);

    // Response từ axios interceptor đã là response.data từ server
    // Server trả về: { status, message, data: { metadata, result } }
    // Axios interceptor trả về response.data, nên response = { status, message, data: { metadata, result } }
    const response = await axiosInstance.get<{
      status: string;
      message: string;
      data: PaginatedResponse<UserDTO>;
    }>(`/users/advanced?${queryParams.toString()}`);
    
    // Lấy data từ response
    if (response && 'data' in response && response.data && 'metadata' in response.data && 'result' in response.data) {
      return response.data;
    }
    
    // Fallback: nếu response đã là PaginatedResponse trực tiếp
    throw new Error('Response không đúng định dạng');
  },

  getUserById: async (id: number): Promise<UserDTO> => {
    const response = await axiosInstance.get<{ data: UserDTO } | UserDTO>(`/users/${id}`);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as UserDTO;
  },

  createUser: async (userData: CreateUserRequest): Promise<UserDTO> => {
    const response = await axiosInstance.post<{ data: UserDTO } | UserDTO>('/users', userData);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as UserDTO;
  },

  updateUser: async (id: number, userData: UpdateUserRequest): Promise<UserDTO> => {
    const response = await axiosInstance.put<{ data: UserDTO } | UserDTO>(`/users/${id}`, userData);
    if (response && 'data' in response && typeof response.data === 'object' && 'id' in response.data) {
      return response.data;
    }
    return response as UserDTO;
  },

  deleteUser: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/users/${id}`);
  },

  uploadAvatar: async (
    file: File,
    userId?: number
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', 'image');
    formData.append('module', 'users');
    if (userId) {
      formData.append('entityId', userId.toString());
    }
    formData.append('purpose', 'avatarUrl');

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

