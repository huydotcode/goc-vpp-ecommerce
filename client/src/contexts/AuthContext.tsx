import type { LoginRequest } from "@/types/auth.types";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/auth.service";
import type { UserDTO } from "../services/user.service";
import { userService } from "../services/user.service";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserDTO | null;
  userRole: "ADMIN" | "USER" | "EMPLOYEE" | null;
  login: (credentials: LoginRequest) => Promise<UserDTO | undefined>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  loadUserInfo: () => Promise<UserDTO | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDTO | null>(null);
  const [userRole, setUserRole] = useState<
    "ADMIN" | "USER" | "EMPLOYEE" | null
  >(null);

  const loadUserInfo = async (): Promise<UserDTO | null> => {
    try {
      const userInfo = await userService.getCurrentUser();

      setUser(userInfo);
      setUserRole(userInfo.role);

      return userInfo;
    } catch (error) {
      console.error("[AuthContext] Failed to load user info:", error);
      // Kiểm tra lỗi 401 (unauthorized)
      const errorObj = error as {
        response?: { status?: number };
        status?: number;
      };
      const status = errorObj?.response?.status || errorObj?.status;

      if (status === 401) {
        localStorage.removeItem("accessToken");
        setIsAuthenticated(false);
      }
      setUser(null);
      setUserRole(null);
      throw error; // Re-throw để component có thể xử lý
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    if (token) {
      // Luôn load user info nếu có token, isLoading sẽ tự động false khi hoàn thành
      loadUserInfo()
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    credentials: LoginRequest
  ): Promise<UserDTO | undefined> => {
    try {
      // authService.login() trả về LoginResponse: { accessToken, refreshToken }
      const response = await authService.login(credentials);

      // Clean token trước khi lưu
      const cleanToken = response.accessToken
        .trim()
        .replace(/^["']|["']$/g, "");
      localStorage.setItem("accessToken", cleanToken);
      setIsAuthenticated(true);

      // Load user info sau khi login
      const userInfo = await loadUserInfo();

      // Return user info after loading
      return userInfo ?? undefined;
    } catch (error) {
      console.error("[AuthContext] Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);
  };

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken();
      // Clean token trước khi lưu
      const cleanToken = response.accessToken
        .trim()
        .replace(/^["']|["']$/g, "");
      localStorage.setItem("accessToken", cleanToken);

      // Reload user info sau khi refresh token
      await loadUserInfo();
    } catch (error) {
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        userRole,
        refreshToken,
        loadUserInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
