import { userService } from "@/services/user.service";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "@/types/user.types";
import { handleApiError, showSuccess } from "@/utils/error";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, "current"] as const,
  filters: (filters: {
    role?: string;
    username?: string;
    email?: string;
    isActive?: boolean;
  }) => [...userKeys.all, "filter", filters] as const,
};

// Get all users with pagination and filters
export const useUsers = (filters: UserFilters, enabled = true) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userService.getAllUsers(filters),
    enabled,
  });
};

// Get users with simple filtering
export const useUsersFilter = (
  filters: {
    role?: string;
    username?: string;
    email?: string;
    isActive?: boolean;
  },
  enabled = true
) => {
  return useQuery({
    queryKey: userKeys.filters(filters),
    queryFn: () => userService.getUsersFilter(filters),
    enabled,
  });
};

// Get current user
export const useCurrentUser = (enabled = true) => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: () => userService.getCurrentUser(),
    enabled,
  });
};

// Get user by ID
export const useUser = (id: number, enabled = true) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: enabled && !!id,
  });
};

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserRequest) =>
      userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess("Tạo người dùng thành công");
    },
    onError: handleApiError,
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      userService.updateUser(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
      showSuccess("Cập nhật người dùng thành công");
    },
    onError: handleApiError,
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess("Xóa người dùng thành công");
    },
    onError: handleApiError,
  });
};

// Upload avatar mutation
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, userId }: { file: File; userId?: number }) =>
      userService.uploadAvatar(file, userId),
    onSuccess: (_data, variables) => {
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: userKeys.detail(variables.userId),
        });
      }
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
      showSuccess("Upload avatar thành công");
    },
    onError: handleApiError,
  });
};
