import { uploadApi } from "@/api/upload.api";
import { userApi } from "@/api/user.api";
import type { PaginatedResponse } from "@/types/common.types";
import type { UploadResponse } from "@/types/upload.types";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserFilters,
} from "@/types/user.types";

// Re-export types để backward compatibility
export type { CreateUserRequest, UpdateUserRequest, User as UserDTO };

export const userService = {
  /**
   * Get all users with pagination and filters
   */
  getAllUsers: async (
    params: UserFilters
  ): Promise<PaginatedResponse<User>> => {
    return userApi.getUsersAdvanced(params);
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
    return userApi.getUsersFilter(filters);
  },

  /**
   * Get current logged-in user
   */
  getCurrentUser: async (): Promise<User> => {
    return userApi.getCurrentUser();
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: number): Promise<User> => {
    return userApi.getUserById(id);
  },

  /**
   * Create new user
   */
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    return userApi.createUser(userData);
  },

  /**
   * Update user
   */
  updateUser: async (
    id: number,
    userData: UpdateUserRequest
  ): Promise<User> => {
    return userApi.updateUser(id, userData);
  },

  /**
   * Delete user (soft delete)
   */
  deleteUser: async (id: number): Promise<void> => {
    return userApi.deleteUser(id);
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (
    file: File,
    userId?: number
  ): Promise<UploadResponse> => {
    return uploadApi.upload(
      file,
      "image",
      "users",
      userId?.toString(),
      "avatarUrl"
    );
  },
};
