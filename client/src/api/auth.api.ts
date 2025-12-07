import type { ApiResponse } from "@/types/common.types";
import type { LoginRequest, LoginResponse } from "@/types/auth.types";
import type { User } from "@/types/user.types";
import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";

export interface User {
  username: string;
  email: string;
  provider?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Register new user account
   */
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>(
      API_ENDPOINTS.REGISTER,
      data
    );
    // Interceptor đã unwrap, response là ApiResponse<User>
    return (response as unknown as ApiResponse<User>).data!;
  },

  /**
   * Login with username and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.LOGIN,
      credentials
    );
    // Interceptor đã unwrap, response là ApiResponse<LoginResponse>
    return (response as unknown as ApiResponse<LoginResponse>).data!;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.REFRESH
    );
    // Interceptor đã unwrap, response là ApiResponse<LoginResponse>
    return (response as unknown as ApiResponse<LoginResponse>).data!;
  },

  /**
   * Get Google OAuth authorization URL
   */
  getGoogleAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response =
      await apiClient.get<ApiResponse<{ authUrl: string }>>("/google/auth-url");
    // Interceptor đã unwrap, response là ApiResponse<{ authUrl: string }>
    const data = (response as unknown as ApiResponse<{ authUrl: string }>).data;
    if (data && typeof data === "object" && "authUrl" in data) {
      return { authUrl: data.authUrl as string };
    }
    throw new Error("Không nhận được authUrl từ server");
  },

  /**
   * Test Google login (for development)
   */
  testGoogleLogin: async (
    email: string,
    name: string
  ): Promise<LoginResponse & { user: User }> => {
    const response = await apiClient.get<
      ApiResponse<LoginResponse & { user: User }>
    >(
      `/google/test-login?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
    );
    // Interceptor đã unwrap, response là ApiResponse<LoginResponse & { user: User }>
    return (response as unknown as ApiResponse<LoginResponse & { user: User }>)
      .data!;
  },

  /**
   * Test refresh token info
   */
  testRefresh: async (): Promise<unknown> => {
    const response = await apiClient.get("/test-refresh");
    return response.data;
  },
};
