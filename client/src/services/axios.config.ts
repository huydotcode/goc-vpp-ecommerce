import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => {
    // Don't add token for login, refresh, or Google OAuth endpoints
    const url = config.url || '';
    const isPublicEndpoint = url.includes('/login') || 
                            url.includes('/refresh') || 
                            url.includes('/google/auth-url') ||
                            url.includes('/google/test-login');
    
    if (!isPublicEndpoint) {
      let token = localStorage.getItem('accessToken');
      
      // Clean và validate token
      if (token) {
        // Loại bỏ khoảng trắng và dấu ngoặc kép thừa
        token = token.trim().replace(/^["']|["']$/g, '');
        
        // Kiểm tra token có hợp lệ không (JWT thường có 3 phần được phân cách bởi dấu chấm)
        if (token && token.split('.').length === 3) {
          // Đảm bảo headers object tồn tại
          if (!config.headers) {
            config.headers = {} as any;
          }
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.error('Invalid token format detected. Token length:', token?.length || 0);
          // Xóa token không hợp lệ
          localStorage.removeItem('accessToken');
          // Không reject ở đây, để response interceptor xử lý 401
          // Chỉ log warning
        }
      } else {
        // Nếu không có token và không phải public endpoint
        // Không làm gì ở đây, để server trả về 401 và response interceptor xử lý
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: any) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<{ accessToken: string }>(
          `${API_BASE_URL}/refresh`,
          {},
          { withCredentials: true }
        );

        // Response từ axios.post là full AxiosResponse, nên response.data chứa ResponseLoginDTO
        const accessToken = response.data?.accessToken;
        if (!accessToken) {
          console.error('Refresh response:', response.data);
          throw new Error('Không nhận được access token từ refresh endpoint');
        }
        
        // Clean token trước khi lưu
        const cleanToken = accessToken.trim().replace(/^["']|["']$/g, '');
        localStorage.setItem('accessToken', cleanToken);

        // Đảm bảo headers tồn tại và cập nhật token
        if (!originalRequest.headers) {
          originalRequest.headers = {} as any;
        }
        originalRequest.headers.Authorization = `Bearer ${cleanToken}`;

        processQueue(null, cleanToken);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;

        localStorage.removeItem('accessToken');
        Cookies.remove('refreshToken');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Xử lý lỗi 403 (Forbidden - Không có quyền)
    if (error.response?.status === 403) {
      const errorData = error.response.data as any;
      const errorMessage = errorData?.message || 'Bạn không có quyền thực hiện thao tác này';
      
      // Trả về error với thông tin đầy đủ để component có thể xử lý
      return Promise.reject({
        ...errorData,
        status: '403 FORBIDDEN',
        message: errorMessage,
        isAccessDenied: true,
      });
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default axiosInstance;

