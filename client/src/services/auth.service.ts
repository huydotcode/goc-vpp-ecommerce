import axiosInstance from './axios.config';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface User {
  username: string;
  email: string;
  provider?: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>('/login', credentials);
    return response;
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>('/refresh');
    return response;
  },

  getGoogleAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response: any = await axiosInstance.get('/google/auth-url');
    if (response.authUrl) {
      return { authUrl: response.authUrl };
    }
    if (response.data && response.data.authUrl) {
      return { authUrl: response.data.authUrl };
    }
    throw new Error('Không nhận được authUrl từ server');
  },

  testGoogleLogin: async (email: string, name: string): Promise<LoginResponse & { user: User }> => {
    const response = await axiosInstance.get<LoginResponse & { user: User }>(
      `/google/test-login?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`
    );
    return response;
  },

  testRefresh: async (): Promise<any> => {
    const response = await axiosInstance.get('/test-refresh');
    return response;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  },
};

