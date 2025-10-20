package com.example.learnspring1.config;

import java.io.IOException;
import java.util.Optional;

import org.springframework.security.core.AuthenticationException; // ✅

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.example.learnspring1.domain.APIResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final ObjectMapper objectMapper;

    public CustomAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json;charset=UTF-8");

        APIResponse<Object> res = new APIResponse<>();
        res.setStatus(HttpStatus.UNAUTHORIZED.toString());
        res.setMessage("Token không hợp lệ hoặc đã hết hạn");

        String errorCode = Optional.ofNullable(authException.getCause())
                .map(Throwable::getMessage)
                .orElse(authException.getMessage());

        res.setErrorCode(errorCode);
        objectMapper.writeValue(response.getOutputStream(), res);
    }
}