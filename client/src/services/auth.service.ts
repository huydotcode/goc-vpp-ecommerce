import { authApi } from "@/api/auth.api";
import type { LoginRequest, LoginResponse } from "@/types/auth.types";
import Cookies from "js-cookie";
import { storage } from "../utils/storage";

export interface User {
  username: string;
  email: string;
  provider?: string;
}

// Re-export types để backward compatibility
export type { LoginRequest, LoginResponse };

export const authService = {
  /**
   * Login with username and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return authApi.login(credentials);
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<LoginResponse> => {
    return authApi.refreshToken();
  },

  /**
   * Get Google OAuth authorization URL
   */
  getGoogleAuthUrl: async (): Promise<{ authUrl: string }> => {
    return authApi.getGoogleAuthUrl();
  },

  /**
   * Test Google login (for development)
   */
  testGoogleLogin: async (
    email: string,
    name: string
  ): Promise<LoginResponse & { user: User }> => {
    return authApi.testGoogleLogin(email, name);
  },

  /**
   * Test refresh token info
   */
  testRefresh: async (): Promise<unknown> => {
    return authApi.testRefresh();
  },

  /**
   * Logout - clear token and redirect to home
   */
  logout: () => {
    // Xóa accessToken từ localStorage
    storage.removeToken();
    // Xóa refreshToken cookie
    Cookies.remove("refreshToken");
    // Xóa tất cả sessionStorage nếu có
    sessionStorage.clear();
    // Redirect về trang chủ
    window.location.href = "/";
  },
};
