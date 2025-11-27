package www.java.client.service;

import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Service
public class TokenService {
    
    private static final String TOKEN_COOKIE_NAME = "access_token";
    private static final String TOKEN_SESSION_KEY = "access_token";
    
    public void saveToken(String token) {
        try {
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletResponse response = attr.getResponse();
            HttpSession session = attr.getRequest().getSession(true);
            
            // Lưu vào session trước (ưu tiên cao nhất)
            session.setAttribute(TOKEN_SESSION_KEY, token);
            
            // Lưu vào cookie
            if (response != null) {
                Cookie cookie = new Cookie(TOKEN_COOKIE_NAME, token);
                cookie.setHttpOnly(false);
                cookie.setPath("/");
                cookie.setMaxAge(24 * 60 * 60); // 1 day
                response.addCookie(cookie);
            }
        } catch (Exception e) {
            // No request context available
        }
    }
    
    public String getToken() {
        try {
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attr.getRequest();
            
            // 1. Ưu tiên lấy từ session (token mới nhất)
            HttpSession session = request.getSession(false);
            if (session != null) {
                String sessionToken = (String) session.getAttribute(TOKEN_SESSION_KEY);
                if (sessionToken != null && !sessionToken.trim().isEmpty()) {
                    System.out.println("TokenService: Using token from SESSION");
                    return sessionToken;
                }
            }
            
            // 2. Fallback: lấy từ cookie
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if (TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                        System.out.println("TokenService: Using token from COOKIE");
                        return cookie.getValue();
                    }
                }
            }
            
            System.out.println("TokenService: No token found in session or cookie");
        } catch (Exception e) {
            System.out.println("TokenService: Exception getting token: " + e.getMessage());
        }
        return null;
    }
    
    public void clearToken() {
        try {
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletResponse response = attr.getResponse();
            HttpSession session = attr.getRequest().getSession(false);
            
            // Clear session
            if (session != null) {
                session.removeAttribute(TOKEN_SESSION_KEY);
            }
            
            // Clear cookie
            if (response != null) {
                Cookie cookie = new Cookie(TOKEN_COOKIE_NAME, null);
                cookie.setPath("/");
                cookie.setMaxAge(0);
                response.addCookie(cookie);
            }
        } catch (Exception e) {
            // No request context available
        }
    }
}
