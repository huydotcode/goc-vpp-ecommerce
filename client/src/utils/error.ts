import { message } from "antd";
import type { AxiosError } from "axios";

/**
 * Unified error handling utilities
 */

export interface ApiErrorResponse {
  status?: string | number;
  message?: string;
  errorCode?: string;
  data?: unknown;
  timestamp?: string;
  isAccessDenied?: boolean;
  errors?: string[];
}

export interface ExtractedError {
  message: string;
  errorCode?: string;
  status?: number;
  isAccessDenied?: boolean;
}

/**
 * Extract error message from various error types
 * Supports both Axios errors and API response errors
 */
export const extractErrorMessage = (error: unknown): ExtractedError => {
  // Handle API response error
  if (error && typeof error === "object") {
    const apiError = error as ApiErrorResponse;

    // Handle 403 (Access Denied) - priority
    if (
      apiError.isAccessDenied ||
      apiError.status === "403 FORBIDDEN" ||
      apiError.status === 403 ||
      String(apiError.status)?.includes("403")
    ) {
      return {
        message:
          apiError.message || "Bạn không có quyền thực hiện thao tác này",
        errorCode: apiError.errorCode,
        status: typeof apiError.status === "number" ? apiError.status : 403,
        isAccessDenied: true,
      };
    }

    // If has errorCode, prioritize it
    if (apiError.errorCode) {
      return {
        message: apiError.errorCode,
        errorCode: apiError.errorCode,
        status:
          typeof apiError.status === "number" ? apiError.status : undefined,
        isAccessDenied: apiError.isAccessDenied,
      };
    }

    // If has message
    if (apiError.message) {
      return {
        message: apiError.message,
        errorCode: apiError.errorCode,
        status:
          typeof apiError.status === "number" ? apiError.status : undefined,
        isAccessDenied: apiError.isAccessDenied,
      };
    }

    // Handle validation errors array
    if (apiError.errors && apiError.errors.length > 0) {
      return {
        message: apiError.errors.join(", "),
        status:
          typeof apiError.status === "number" ? apiError.status : undefined,
      };
    }
  }

  // Handle Axios error (from error.ts)
  if (error instanceof Error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    if (axiosError.response) {
      const { data, status } = axiosError.response;

      // Backend error message
      if (data?.message) {
        return {
          message: data.message,
          status,
          errorCode: data.errorCode,
          isAccessDenied: data.isAccessDenied,
        };
      }

      // Backend validation errors
      if (data?.errors && data.errors.length > 0) {
        return {
          message: data.errors.join(", "),
          status,
        };
      }

      // HTTP status error messages
      switch (status) {
        case 400:
          return { message: "Dữ liệu không hợp lệ", status };
        case 401:
          return {
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
            status,
          };
        case 403:
          return {
            message: "Bạn không có quyền thực hiện thao tác này",
            status,
            isAccessDenied: true,
          };
        case 404:
          return { message: "Không tìm thấy dữ liệu", status };
        case 500:
          return { message: "Lỗi server. Vui lòng thử lại sau", status };
        default:
          return {
            message: `Lỗi ${status}: ${axiosError.message}`,
            status,
          };
      }
    }

    if (axiosError.request) {
      return {
        message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng",
      };
    }

    return { message: error.message };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  return { message: "Đã xảy ra lỗi không mong muốn" };
};

/**
 * Get error message string (for backward compatibility)
 */
export const getErrorMessage = (error: unknown): string => {
  return extractErrorMessage(error).message;
};

/**
 * Show error notification using Ant Design message
 */
export const showError = (error: unknown): void => {
  const errorMessage = getErrorMessage(error);
  message.error(errorMessage);
};

/**
 * Show success notification
 */
export const showSuccess = (msg: string): void => {
  message.success(msg);
};

/**
 * Show warning notification
 */
export const showWarning = (msg: string): void => {
  message.warning(msg);
};

/**
 * Show info notification
 */
export const showInfo = (msg: string): void => {
  message.info(msg);
};

/**
 * Handle API error and show notification
 * @returns Error message for further handling if needed
 */
export const handleApiError = (error: unknown): string => {
  const errorMessage = getErrorMessage(error);
  showError(error);
  return errorMessage;
};
