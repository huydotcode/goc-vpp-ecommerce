import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import type { UserDTO } from '../services/user.service';

export interface LoginRequest {
  username: string;
  password: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserDTO | null;
  userRole: 'ADMIN' | 'USER' | 'EMPLOYEE' | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  loadUserInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
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
  const [userRole, setUserRole] = useState<'ADMIN' | 'USER' | 'EMPLOYEE' | null>(null);

  const loadUserInfo = async () => {
    try {
      console.log('[AuthContext] Loading user info from /users/me...');
      const userInfo = await userService.getCurrentUser();
      console.log('[AuthContext] User info received:', { id: userInfo.id, email: userInfo.email, role: userInfo.role });
      setUser(userInfo);
      setUserRole(userInfo.role);
      console.log('[AuthContext] User info set in state:', { user: userInfo, role: userInfo.role });
    } catch (error) {
      console.error('[AuthContext] Failed to load user info:', error);
      // Nếu lỗi 401, có thể token hết hạn, xóa token
      const errorObj = error as { status?: string; message?: string };
      if (errorObj?.status === '401 UNAUTHORIZED' || errorObj?.status?.includes('401')) {
        console.log('[AuthContext] 401 error, removing token');
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
      }
      setUser(null);
      setUserRole(null);
      throw error; // Re-throw để component có thể xử lý
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
    if (token) {
      loadUserInfo().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      console.log('[AuthContext] Starting login...');
      const response = await authService.login(credentials);
      console.log('[AuthContext] Login response:', response);
      
      // Backend trả về { status, message, data: { accessToken, refreshToken } }
      // Axios interceptor đã unwrap response.data, nên response = { status, message, data: { accessToken, refreshToken } }
      let accessToken: string | undefined;
      if (response && typeof response === 'object') {
        if ('data' in response && response.data && typeof response.data === 'object' && 'accessToken' in response.data) {
          // Response có format { data: { accessToken, refreshToken } }
          accessToken = (response.data as { accessToken: string }).accessToken;
        } else if ('accessToken' in response) {
          // Response có format { accessToken, refreshToken }
          accessToken = (response as { accessToken: string }).accessToken;
        } else {
          console.error('[AuthContext] Response structure:', response);
          throw new Error('Không tìm thấy accessToken trong response');
        }
      } else {
        console.error('[AuthContext] Response is not an object:', response);
        throw new Error('Response không đúng định dạng');
      }
      
      if (!accessToken) {
        throw new Error('AccessToken là undefined hoặc null');
      }
      
      // Clean token trước khi lưu
      const cleanToken = accessToken.trim().replace(/^["']|["']$/g, '');
      localStorage.setItem('accessToken', cleanToken);
      setIsAuthenticated(true);
      console.log('[AuthContext] Login successful, loading user info...');
      // Load user info sau khi login
      await loadUserInfo();
      console.log('[AuthContext] User info loaded, login complete');
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
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
      const cleanToken = response.accessToken.trim().replace(/^["']|["']$/g, '');
      localStorage.setItem('accessToken', cleanToken);
    } catch (error) {
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, userRole, login, logout, refreshToken, loadUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

