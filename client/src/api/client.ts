import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { storage } from "../utils/storage";

export const PUBLIC_ENDPOINTS = [
  "/login",
  "/refresh",
  "/google/auth-url",
  "/google/test-login",
  "/register",
];

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Cần cho refresh token cookie
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: Thêm JWT token vào header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't add token for public endpoints
    const url = config.url || "";
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) =>
      url.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      let token = storage.getToken();

      // Clean và validate token
      if (token) {
        token = token.trim().replace(/^["']|["']$/g, "");

        // Validate JWT format (3 parts separated by dots)
        if (token && token.split(".").length === 3) {
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } else {
          console.error("Invalid token format detected");
          storage.removeToken();
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Xử lý response và errors
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Xử lý 401 - Auto refresh token
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Nếu đang refresh, thêm request vào queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi refresh endpoint (không dùng apiClient để tránh loop)
        const response = await axios.post<
          { accessToken: string } | { data: { accessToken: string } }
        >(`${API_BASE_URL}/refresh`, {}, { withCredentials: true });

        // Xử lý cả 2 trường hợp: trực tiếp hoặc wrap trong ApiResponse
        let accessToken: string | undefined;
        if ("accessToken" in response.data) {
          accessToken = response.data.accessToken;
        } else if (
          "data" in response.data &&
          response.data.data &&
          typeof response.data.data === "object" &&
          "accessToken" in response.data.data
        ) {
          accessToken = (response.data.data as { accessToken: string })
            .accessToken;
        }

        if (!accessToken) {
          console.error("Refresh response:", response.data);
          throw new Error("Không nhận được access token từ refresh endpoint");
        }

        // Clean token trước khi lưu
        const cleanToken = accessToken.trim().replace(/^["']|["']$/g, "");
        storage.setToken(cleanToken);

        // Đảm bảo headers tồn tại và cập nhật token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${cleanToken}`;
        }

        processQueue(null, cleanToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;

        storage.removeToken();
        Cookies.remove("refreshToken");

        // Chỉ redirect về /login nếu đang ở protected route
        // Không redirect nếu đang ở public route (/, /login, etc.)
        const currentPath = window.location.pathname;
        const publicRoutes = ["/", "/login", "/register", "/google/callback"];
        const isPublicRoute = publicRoutes.includes(currentPath);

        if (!isPublicRoute) {
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      }
    }

    // Xử lý 403 (Forbidden)
    if (error.response?.status === 403) {
      const errorData = error.response.data as Record<string, unknown>;
      const errorMessage =
        (errorData?.message as string) ||
        "Bạn không có quyền thực hiện thao tác này";

      return Promise.reject({
        ...errorData,
        status: "403 FORBIDDEN",
        message: errorMessage,
        isAccessDenied: true,
      });
    }

    // Xử lý các lỗi khác
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
