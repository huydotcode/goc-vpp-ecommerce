export interface ApiErrorResponse {
  status?: string;
  message?: string;
  errorCode?: string;
  data?: unknown;
  timestamp?: string;
}

export const extractErrorMessage = (error: unknown): { message: string; errorCode?: string } => {
  // Nếu error là object có cấu trúc API response
  if (error && typeof error === 'object') {
    const apiError = error as ApiErrorResponse;
    
    // Nếu có errorCode, ưu tiên hiển thị errorCode
    if (apiError.errorCode) {
      return {
        message: apiError.errorCode,
        errorCode: apiError.errorCode,
      };
    }
    
    // Nếu có message
    if (apiError.message) {
      return {
        message: apiError.message,
        errorCode: apiError.errorCode,
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

