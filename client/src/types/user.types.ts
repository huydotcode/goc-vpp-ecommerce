/**
 * User types
 */

export const UserRole = {
  EMPLOYEE: "EMPLOYEE",
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null;
  isActive: boolean;
  role: UserRole;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export interface UserFilters {
  id?: number;
  role?: UserRole;
  username?: string;
  email?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface UserAddress {
  id: number;
  userId: number;
  isDefault: boolean;
  phone?: string | null;
  provinceCode?: string | null;
  provinceName?: string | null;
  districtCode?: string | null;
  districtName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  street?: string | null;
  fullAddress?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UpdateAddressRequest {
  isDefault?: boolean;
  phone?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
  wardCode?: string;
  wardName?: string;
  street?: string;
  fullAddress?: string;
}
