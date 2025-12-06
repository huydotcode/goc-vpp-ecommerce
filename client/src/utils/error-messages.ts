/**
 * Mapping error messages từ backend (tiếng Anh) sang tiếng Việt
 * Thêm các error message mới vào đây khi backend trả về error mới
 */
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Cart errors
  "Product is not available": "Sản phẩm không khả dụng",
  "Insufficient stock": "Sản phẩm không đủ số lượng tồn kho",
  "Product not found": "Không tìm thấy sản phẩm",
  "Cart item not found": "Không tìm thấy sản phẩm trong giỏ hàng",
  "Cart not found": "Không tìm thấy giỏ hàng",
  "Product price is not set": "Giá sản phẩm chưa được thiết lập",
  "Quantity must be greater than 0": "Số lượng phải lớn hơn 0",

  // Auth errors
  "User not authenticated": "Người dùng chưa đăng nhập",
  Unauthorized: "Bạn không có quyền thực hiện thao tác này",
  "User not found": "Không tìm thấy người dùng",

  // Order errors
  "Order not found": "Không tìm thấy đơn hàng",
  "Order already confirmed": "Đơn hàng đã được xác nhận",
  "Invalid status": "Trạng thái không hợp lệ",
  "Failed to create order": "Không thể tạo đơn hàng",
  "Failed to update order status": "Không thể cập nhật trạng thái đơn hàng",

  // Validation errors
  "Amount must be greater than 0": "Số tiền phải lớn hơn 0",

  // Payment errors
  "Invalid signature": "Chữ ký không hợp lệ",
  "Order already confirmed or failed":
    "Đơn hàng đã được xác nhận hoặc thất bại",
};

/**
 * Translate error message từ tiếng Anh sang tiếng Việt
 * @param message - Error message từ backend (có thể là tiếng Anh hoặc tiếng Việt)
 * @returns Message đã được dịch sang tiếng Việt, hoặc giữ nguyên nếu không có trong map
 */
export const translateErrorMessage = (message: string): string => {
  if (!message || typeof message !== "string") {
    return "Đã xảy ra lỗi không mong muốn";
  }

  // Trim whitespace
  const trimmedMessage = message.trim();

  // 1. Kiểm tra exact match trước (case-sensitive)
  if (ERROR_MESSAGE_MAP[trimmedMessage]) {
    return ERROR_MESSAGE_MAP[trimmedMessage];
  }

  // 2. Kiểm tra case-insensitive match
  const lowerMessage = trimmedMessage.toLowerCase();
  for (const [key, value] of Object.entries(ERROR_MESSAGE_MAP)) {
    if (key.toLowerCase() === lowerMessage) {
      return value;
    }
  }

  // 3. Kiểm tra partial match (nếu message chứa key)
  // Ưu tiên match dài nhất trước
  const sortedKeys = Object.keys(ERROR_MESSAGE_MAP).sort(
    (a, b) => b.length - a.length
  );
  for (const key of sortedKeys) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return ERROR_MESSAGE_MAP[key];
    }
  }

  // 4. Nếu không tìm thấy, trả về message gốc
  return trimmedMessage;
};
