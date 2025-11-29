package com.example.learnspring1.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import com.example.learnspring1.domain.User;
import com.example.learnspring1.repository.UserRepository;
import com.example.learnspring1.utils.SecurityUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@Tag(name = "Google OAuth2", description = "Google OAuth2 Authentication")
public class GoogleOAuth2Controller {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityUtil securityUtil;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Operation(
        summary = "Google OAuth2 Login - Redirect URL",
        description = """
            Callback endpoint cho Google OAuth2.
            
            **Cách dùng:**
            1. User click "Login with Google"
            2. Google redirect tới endpoint này với authorization code
            3. Server đổi code lấy token từ Google
            4. Server tạo User nếu chưa tồn tại
            5. Server tạo JWT access token + refresh token
            6. Redirect về client với tokens trong URL
            """,
        tags = {"Google OAuth2"}
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "302",
            description = "Redirect về client với tokens"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Authorization code không hợp lệ"
        )
    })
    @GetMapping("/google/redirect")
    public Object googleRedirect(
        @RequestParam(name = "code") String code,
        @RequestParam(name = "state", required = false) String state,
        @RequestParam(name = "format", defaultValue = "redirect") String format,
        HttpServletResponse response
    ) {
        try {
            // Step 1: Exchange authorization code for Google tokens
            String googleTokenUrl = "https://oauth2.googleapis.com/token";
            Map<String, String> tokenRequest = new HashMap<>();
            tokenRequest.put("code", code);
            tokenRequest.put("client_id", googleClientId);
            tokenRequest.put("client_secret", googleClientSecret);
            // Redirect URI - PHẢI KHỚP với Google Cloud Console và với authUrl
            String redirectUri = "http://localhost:8080/api/v1/google/redirect";
            tokenRequest.put("redirect_uri", redirectUri);
            tokenRequest.put("grant_type", "authorization_code");

            ResponseEntity<String> tokenResponse = restTemplate.postForEntity(
                googleTokenUrl,
                tokenRequest,
                String.class
            );

            JsonNode tokenData = objectMapper.readTree(tokenResponse.getBody());
            String googleAccessToken = tokenData.get("access_token").asText();

            // Step 2: Get user info from Google
            String googleUserInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

            ResponseEntity<String> userInfoResponse = restTemplate.getForEntity(
                googleUserInfoUrl + "?access_token=" + googleAccessToken,
                String.class
            );

            JsonNode userInfo = objectMapper.readTree(userInfoResponse.getBody());
            String googleId = userInfo.get("id").asText();
            String email = userInfo.get("email").asText();
            String name = userInfo.get("name").asText();
            String picture = userInfo.get("picture").asText();

            // Step 3: Find or create user
            Optional<User> existingUser = userRepository.findByUsername(email);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                // Update user info
                user.setProvider("GOOGLE");
                user.setProviderId(googleId);
                user.setIsActive(true);
            } else {
                // Create new user
                user = new User();
                user.setUsername(email);
                user.setEmail(email);
                user.setProvider("GOOGLE");
                user.setProviderId(googleId);
                user.setIsActive(true);
                user.setPassword(""); // Empty string for OAuth2 users (password not needed)
            }

            userRepository.save(user);

            // Step 4: Create JWT tokens
            org.springframework.security.core.userdetails.UserDetails userDetails =
                new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    "",
                    Collections.emptyList()
                );
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
            );

            String accessToken = securityUtil.createToken(authentication);
            String refreshToken = securityUtil.createRefreshToken(user.getUsername());

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Step 5: Set refresh token in HTTP-only cookie
            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false);  // Set to true in production with HTTPS
            refreshTokenCookie.setPath("/api/v1");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60);  // 30 days
            response.addCookie(refreshTokenCookie);

            // Step 6: Return response based on format
            if ("json".equalsIgnoreCase(format)) {
                // Trả về JSON cho Postman test
                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("message", "Google OAuth2 login successful");
                result.put("accessToken", accessToken);
                
                Map<String, Object> userData = new HashMap<>();
                userData.put("username", user.getUsername());
                userData.put("email", user.getEmail());
                userData.put("provider", user.getProvider());
                result.put("user", userData);
                
                return result;
            } else {
                // Redirect to frontend (default behavior)
                // Frontend URL: http://localhost:5173/google/callback
                String frontendRedirectUrl = String.format(
                    "http://localhost:5173/google/callback?accessToken=%s&user=%s",
                    java.net.URLEncoder.encode(accessToken, java.nio.charset.StandardCharsets.UTF_8),
                    java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8)
                );
                response.sendRedirect(frontendRedirectUrl);
                return null;
            }

        } catch (Exception e) {
            System.out.println("[GoogleOAuth2Controller] Error: " + e.getMessage());
            e.printStackTrace();
            try {
                if ("json".equalsIgnoreCase(format)) {
                    // Trả về JSON error cho Postman
                    Map<String, Object> error = new HashMap<>();
                    error.put("status", "error");
                    error.put("message", "Google OAuth2 login failed: " + e.getMessage());
                    return error;
                } else {
                    // Redirect to frontend with error
                    response.sendRedirect("http://localhost:5173/login?error=" + 
                        java.net.URLEncoder.encode(e.getMessage(), java.nio.charset.StandardCharsets.UTF_8));
                    return null;
                }
            } catch (Exception redirectError) {
                redirectError.printStackTrace();
                // Return error JSON as fallback
                Map<String, Object> error = new HashMap<>();
                error.put("status", "error");
                error.put("message", "Google OAuth2 login failed: " + redirectError.getMessage());
                return error;
            }
        }
    }

    @Operation(
        summary = "Lấy Google OAuth2 URL để đăng nhập",
        description = """
            Trả về URL để redirect user đến Google OAuth2 login page.
            
            **Cách dùng:**
            1. Gọi GET /google/auth-url
            2. Nhận về URL Google OAuth2
            3. Mở URL trong browser hoặc redirect user đến URL đó
            4. User đăng nhập Google
            5. Google redirect về /google/redirect với authorization code
            """,
        tags = {"Google OAuth2"}
    )
    @GetMapping("/google/auth-url")
    public Map<String, Object> getGoogleAuthUrl() {
        // Redirect URI - PHẢI KHỚP với Google Cloud Console
        // Nếu thay đổi, nhớ cập nhật trong Google Cloud Console
        String redirectUri = "http://localhost:8080/api/v1/google/redirect";
        String scope = "profile email";
        String state = "random_state_" + System.currentTimeMillis();
        
        String authUrl = String.format(
            "https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s&access_type=offline&prompt=consent",
            googleClientId,
            java.net.URLEncoder.encode(redirectUri, java.nio.charset.StandardCharsets.UTF_8),
            java.net.URLEncoder.encode(scope, java.nio.charset.StandardCharsets.UTF_8),
            state
        );
        
        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("authUrl", authUrl);
        result.put("redirectUri", redirectUri);
        result.put("message", "Mở URL này trong browser để đăng nhập Google");
        return result;
    }

    @Operation(
        summary = "Test Google OAuth2 - Mô phỏng login",
        description = """
            Endpoint test để mô phỏng Google OAuth2 login mà không cần browser.
            
            **Cách dùng:**
            1. Gọi GET /google/test-login với email
            2. Server tạo user và JWT tokens
            3. Trả về accessToken (refresh token lưu vào cookie)
            
            **Mục đích:** Debug/test OAuth2 flow
            """,
        tags = {"Google OAuth2"}
    )
    @GetMapping("/google/test-login")
    public Map<String, Object> testGoogleLogin(
        @RequestParam(name = "email", defaultValue = "testuser@gmail.com") String email,
        @RequestParam(name = "name", defaultValue = "Test User") String name,
        HttpServletResponse response
    ) {
        try {
            String googleId = "google_" + System.currentTimeMillis();

            // Find or create user
            Optional<User> existingUser = userRepository.findByUsername(email);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                user.setProvider("GOOGLE");
                user.setProviderId(googleId);
                user.setIsActive(true);
            } else {
                user = new User();
                user.setUsername(email);
                user.setEmail(email);
                user.setProvider("GOOGLE");
                user.setProviderId(googleId);
                user.setIsActive(true);
            }

            userRepository.save(user);

            // Create JWT tokens
            org.springframework.security.core.userdetails.UserDetails userDetails =
                new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    "",
                    Collections.emptyList()
                );
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
            );

            String accessToken = securityUtil.createToken(authentication);
            String refreshToken = securityUtil.createRefreshToken(user.getUsername());

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Set cookie
            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false);
            refreshTokenCookie.setPath("/api/v1");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60);
            response.addCookie(refreshTokenCookie);

            // Return response - chỉ trả về access token (giống refresh endpoint)
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "Google OAuth2 login successful");
            result.put("accessToken", accessToken);
            
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("username", user.getUsername());
            userInfo.put("email", user.getEmail());
            userInfo.put("provider", user.getProvider());
            result.put("user", userInfo);

            return result;

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "Google OAuth2 login failed: " + e.getMessage());
            return error;
        }
    }
}

