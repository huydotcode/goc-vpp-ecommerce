package com.example.learnspring1.utils.responseHandler;

import com.example.learnspring1.domain.APIResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@RestControllerAdvice // áp dụng cho tất cả @RestController
public class APIResponseHandler implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        // Loại trừ các endpoint của Swagger/OpenAPI
        String declaringClassName = returnType.getDeclaringClass().getName();
        if (declaringClassName.startsWith("org.springdoc") || 
            declaringClassName.startsWith("springfox.documentation")) {
            return false;
        }
        // true = áp dụng cho tất cả response khác
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response) {
        // Nếu body đã là APIResponse thì không cần bọc lại
        if (body instanceof APIResponse) {
            return body;
        }

        // Bọc body vào APIResponse
        return new APIResponse<>(
                HttpStatus.OK,
                "Request processed successfully",
                body,
                null);
    }
}
