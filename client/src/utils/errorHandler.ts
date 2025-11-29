export interface ApiErrorResponse {
  status?: string;
  message?: string;
  errorCode?: string;
  data?: unknown;
  timestamp?: string;
  isAccessDenied?: boolean;
}

export const extractErrorMessage = (error: unknown): { message: string; errorCode?: string; isAccessDenied?: boolean } => {
  // Nếu error là object có cấu trúc API response
  if (error && typeof error === 'object') {
    const apiError = error as ApiErrorResponse;
    
    // Xử lý lỗi 403 (Access Denied) - ưu tiên hiển thị message từ BE
    if (apiError.isAccessDenied || apiError.status === '403 FORBIDDEN' || apiError.status?.includes('403')) {
      return {
        message: apiError.message || 'Bạn không có quyền thực hiện thao tác này',
        errorCode: apiError.errorCode,
        isAccessDenied: true,
      };
    }
    
    // Nếu có errorCode, ưu tiên hiển thị errorCode
    if (apiError.errorCode) {
      return {
        message: apiError.errorCode,
        errorCode: apiError.errorCode,
        isAccessDenied: apiError.isAccessDenied,
      };
    }
    
    // Nếu có message
    if (apiError.message) {
      return {
        message: apiError.message,
        errorCode: apiError.errorCode,
        isAccessDenied: apiError.isAccessDenied,
      };
    }
  }
  
  // Nếu error là Error instance
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }
  
  // Fallback
  return {
    message: 'Đã xảy ra lỗi không xác định',
  };
};

/**
 * Hiển thị thông báo lỗi 403 (Access Denied) một cách dễ hiểu
 */
export const getAccessDeniedMessage = (error: unknown): string => {
  const { message, isAccessDenied } = extractErrorMessage(error);
  
  if (isAccessDenied) {
    // Thông báo từ BE đã được format sẵn, chỉ cần trả về
    return message;
  }
  
  return message;
};

