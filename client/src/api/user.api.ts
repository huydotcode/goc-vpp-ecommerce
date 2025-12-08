import type { PaginatedResponse } from "@/types/common.types";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserFilters,
} from "@/types/user.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export const userApi = {
  /**
   * Get users with pagination, sorting, and filtering
   */
  getUsersAdvanced: async (
    filters: UserFilters
  ): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>(
      API_ENDPOINTS.USERS_ADVANCED,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get users with simple filtering (no pagination)
   */
  getUsersFilter: async (filters: {
    role?: string;
    username?: string;
    email?: string;
    isActive?: boolean;
  }): Promise<User[]> => {
    const response = await apiClient.get<User[]>(API_ENDPOINTS.USERS_FILTER, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`${API_ENDPOINTS.USERS}/${id}`);
    return response.data;
  },

  /**
   * Create new user
   */
  createUser: async (user: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>(API_ENDPOINTS.USERS, user);
    return response.data;
  },

  /**
   * Update user by ID
   */
  updateUser: async (id: number, user: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>(
      `${API_ENDPOINTS.USERS}/${id}`,
      user
    );
    return response.data;
  },

  /**
   * Delete user by ID (soft delete)
   */
  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.USERS}/${id}`);
  },

  /**
   * Get current logged-in user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>(`${API_ENDPOINTS.USERS}/me`);
    return response.data;
  },
};
