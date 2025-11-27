package www.java.client.interceptor;

import www.java.client.annotation.RequireAdmin;
import www.java.client.service.TokenService;
import www.java.client.utils.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminInterceptor implements HandlerInterceptor {
    
    private final TokenService tokenService;
    private final JwtUtil jwtUtil;
    
    public AdminInterceptor(TokenService tokenService, JwtUtil jwtUtil) {
        this.tokenService = tokenService;
        this.jwtUtil = jwtUtil;
    }
    
    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws Exception {
        // Chỉ xử lý nếu handler là method handler
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }
        
        HandlerMethod handlerMethod = (HandlerMethod) handler;
        
        // Kiểm tra annotation @RequireAdmin trên method hoặc class
        boolean requireAdmin = handlerMethod.getMethodAnnotation(RequireAdmin.class) != null
                || handlerMethod.getBeanType().getAnnotation(RequireAdmin.class) != null;
        
        if (!requireAdmin) {
            return true; // Không cần kiểm tra, cho phép truy cập
        }
        
        // Kiểm tra token
        String token = tokenService.getToken();
        if (token == null || !jwtUtil.isValidToken(token)) {
            response.sendRedirect("/login?error=token_required");
            return false;
        }
        
        // Kiểm tra role ADMIN
        if (!jwtUtil.isAdmin(token)) {
            response.sendRedirect("/user?error=access_denied");
            return false;
        }
        
        return true; // Cho phép truy cập
    }
}

