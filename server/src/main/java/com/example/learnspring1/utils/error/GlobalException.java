package com.example.learnspring1.utils.error;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.example.learnspring1.domain.APIResponse;

@RestControllerAdvice(basePackages = "com.example.learnspring1.controller")
public class GlobalException {

	// Lỗi đăng nhập sai username/password
	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<APIResponse<?>> handleBadCredentials(BadCredentialsException ex) {
		APIResponse<?> result = new APIResponse<>(HttpStatus.UNAUTHORIZED,
				"Username hoặc password không đúng", null, ex.getMessage());
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
	}

	// Xử lý tất cả lỗi không xác định
	@ExceptionHandler(Exception.class)
	public ResponseEntity<APIResponse<?>> handleAllException(Exception ex) {
		APIResponse<?> result = new APIResponse<>(HttpStatus.INTERNAL_SERVER_ERROR,
				"Đã xảy ra lỗi không xác định", null, ex.getMessage());
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
	}

	// Lỗi khi tài nguyên không tồn tại
	@ExceptionHandler(NoSuchElementException.class)
	public ResponseEntity<APIResponse<?>> handleNotFound(NoSuchElementException ex) {
		APIResponse<?> result = new APIResponse<>(HttpStatus.NOT_FOUND,
				"Không tìm thấy tài nguyên", null, ex.getMessage());
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
	}

	// Lỗi validation (hợp lệ dữ liệu)
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<APIResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
		List<String> errorList = ex.getBindingResult().getFieldErrors().stream()
				.map(error -> error.getField() + ": " + error.getDefaultMessage())
				.collect(Collectors.toList());

		String errors = String.join("; ", errorList);

		APIResponse<Object> response = new APIResponse<>(HttpStatus.BAD_REQUEST,
				"Dữ liệu không hợp lệ", null, errors);

		return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
	}

	// Lỗi vi phạm ràng buộc dữ liệu (unique, foreign key, etc.)
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<APIResponse<?>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
		APIResponse<?> result = new APIResponse<>(HttpStatus.CONFLICT,
				"Vi phạm ràng buộc dữ liệu", null, ex.getRootCause().getMessage());
		return ResponseEntity.status(HttpStatus.CONFLICT).body(result);
	}

	// Lỗi phương thức HTTP không được hỗ trợ
	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<APIResponse<?>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
		APIResponse<?> result = new APIResponse<>(HttpStatus.METHOD_NOT_ALLOWED,
				"Phương thức HTTP không được hỗ trợ", null, ex.getMessage());
		return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(result);
	}

	// Có thể thêm các exception khác tùy nhu cầu
}
