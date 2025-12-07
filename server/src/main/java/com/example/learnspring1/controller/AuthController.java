package com.example.learnspring1.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestHeader;

import com.example.learnspring1.domain.APIResponse;
import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.Role;
import com.example.learnspring1.domain.dto.LoginDTO;
import com.example.learnspring1.domain.dto.RegisterDTO;
import com.example.learnspring1.domain.dto.ResponseLoginDTO;
import com.example.learnspring1.service.UserService;
import com.example.learnspring1.utils.SecurityUtil;
import com.example.learnspring1.repository.UserRepository;

import jakarta.validation.Valid;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@RestController
@Tag(name = "Authentication", description = "API xác thực và đăng nhập")
public class AuthController {

    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final SecurityUtil securityUtil;
    private final UserDetailsService userDetailsService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public AuthController(
        AuthenticationManagerBuilder authenticationManagerBuilder, 
        SecurityUtil securityUtil,
        UserDetailsService userDetailsService,
        UserService userService,
        PasswordEncoder passwordEncoder,
        UserRepository userRepository
    ) {
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.securityUtil = securityUtil;
        this.userDetailsService = userDetailsService;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    @Operation(
        summary = "Đăng ký tài khoản mới",
        description = """
            Đăng ký tài khoản mới với role mặc định là USER.
            
            **Cách sử dụng:**
            1. Gửi POST request với username, email, password
            2. Tài khoản sẽ được tạo với role USER
            3. Sau đó có thể đăng nhập bằng email và password
            """,
        tags = {"Authentication"}
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Đăng ký thành công",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = APIResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Dữ liệu không hợp lệ hoặc email/username đã tồn tại",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = APIResponse.class)
            )
        )
    })
    @PostMapping("/register")
    @Transactional
    public APIResponse<User> register(
        @Parameter(
            description = "Thông tin đăng ký",
            required = true
        )
        @Valid @RequestBody RegisterDTO registerDTO
    ) {
        try {
            // Kiểm tra email đã tồn tại chưa
            if (userRepository.existsByEmail(registerDTO.getEmail())) {
                return new APIResponse<>(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Email đã tồn tại",
                    null,
                    "Email already exists"
                );
            }
            
            // Kiểm tra username đã tồn tại chưa
            if (userRepository.existsByUsername(registerDTO.getUsername())) {
                return new APIResponse<>(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Username đã tồn tại",
                    null,
                    "Username already exists"
                );
            }
            
            // Tạo user mới với role USER mặc định
            User newUser = User.builder()
                .username(registerDTO.getUsername())
                .email(registerDTO.getEmail())
                .password(registerDTO.getPassword())
                .role(Role.USER)
                .isActive(true)
                .build();
            
            User createdUser = userService.createUser(newUser, passwordEncoder);
            
            // Flush để đảm bảo user được lưu vào database ngay lập tức
            userRepository.flush();
            
            return new APIResponse<>(
                org.springframework.http.HttpStatus.OK,
                "Đăng ký thành công",
                createdUser,
                null
            );
        } catch (IllegalArgumentException e) {
            return new APIResponse<>(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                e.getMessage(),
                null,
                e.getMessage()
            );
        } catch (Exception e) {
            return new APIResponse<>(
                org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                "Lỗi khi đăng ký",
                null,
                e.getMessage()
            );
        }
    }

    @Operation(
        summary = "Đăng nhập hệ thống", 
        description = """
            Đăng nhập để lấy JWT access token.
            
            **Cách sử dụng:**
            1. Gửi POST request với username/password
            2. Nhận về access token
            3. Sử dụng token trong header: `Authorization: Bearer <token>`
            
            **Token có thời hạn:** 24 giờ
            """,
        tags = {"Authentication"}
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200", 
            description = "Đăng nhập thành công",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ResponseLoginDTO.class),
                examples = @ExampleObject(
                    name = "Success Response",
                    value = """
                        {
                            "status": "success",
                            "message": "Request processed successfully",
                            "data": {
                                "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            },
                            "errors": null
                        }
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "401", 
            description = "Username hoặc password không đúng",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = APIResponse.class),
                examples = @ExampleObject(
                    name = "Error Response",
                    value = """
                        {
                            "status": "error",
                            "message": "Invalid credentials",
                            "data": null,
                            "errors": ["Username or password is incorrect"]
                        }
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Dữ liệu đầu vào không hợp lệ",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = APIResponse.class)
            )
        )
    })
    @PostMapping("/login")
    public ResponseLoginDTO login(
        @Parameter(
            description = "Thông tin đăng nhập",
            required = true,
            example = """
                {
                    "username": "root_admin@system.local",
                    "password": "123123"
                }
                """
        )
        @Valid @RequestBody LoginDTO loginDTO,
        HttpServletResponse response
    ) {
        Authentication authentication = authenticationManagerBuilder.getObject()
                .authenticate(new UsernamePasswordAuthenticationToken(loginDTO.getUsername(), loginDTO.getPassword()));

        String accessToken = this.securityUtil.createToken(authentication);
        String refreshToken = this.securityUtil.createRefreshToken(authentication.getName());

        // Set refresh token in HTTP-only cookie (for web clients)
        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
        refreshTokenCookie.setHttpOnly(true);  // Prevent JavaScript access
        refreshTokenCookie.setSecure(false);    // Set to true in production with HTTPS
        refreshTokenCookie.setPath("/api/v1");
        refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60);  // 30 days
        response.addCookie(refreshTokenCookie);

        System.out.println("[AuthController] Login successful for user: " + authentication.getName());
        System.out.println("[AuthController] Refresh token saved to cookie: " + refreshToken.substring(0, Math.min(20, refreshToken.length())) + "...");

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Return both access and refresh tokens in response (for mobile clients or API clients)
        return ResponseLoginDTO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Operation(
        summary = "Làm mới access token",
        description = """
            Sử dụng refresh token từ cookie để lấy access token mới.
            
            **Cách sử dụng:**
            1. Refresh token tự động được gửi từ cookie
            2. Nhận về access token mới (chỉ access token, không có refresh token)
            3. Refresh token mới được tự động lưu vào cookie
            4. Sử dụng access token mới trong header: `Authorization: Bearer <token>`
            
            **Lưu ý:**
            - Response chỉ trả về access token
            - Refresh token mới được lưu tự động vào cookie (token rotation)
            - Refresh token có thời hạn: 30 ngày
            """,
        tags = {"Authentication"}
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Làm mới token thành công",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ResponseLoginDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Refresh token không hợp lệ hoặc đã hết hạn",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = APIResponse.class)
            )
        )
    })
    @PostMapping("/refresh")
    public ResponseLoginDTO refresh(
        @CookieValue(name = "refreshToken", required = false) String refreshToken,
        jakarta.servlet.http.HttpServletRequest request,
        HttpServletResponse response
    ) {
        // Log để debug
        System.out.println("[AuthController] Refresh endpoint called");
        System.out.println("[AuthController] Refresh token from cookie: " + (refreshToken != null ? refreshToken.substring(0, Math.min(20, refreshToken.length())) + "..." : "NULL"));
        
        // Kiểm tra cookie từ request header
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                System.out.println("[AuthController] Cookie found: " + cookie.getName() + " = " + cookie.getValue().substring(0, Math.min(20, cookie.getValue().length())) + "...");
            }
        } else {
            System.out.println("[AuthController] No cookies found in request");
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            System.out.println("[AuthController] ERROR: Refresh token is missing from cookie");
            throw new RuntimeException("Refresh token is missing");
        }

        try {
            // Validate and get username from refresh token
            String username = this.securityUtil.getUsernameFromRefreshToken(refreshToken);
            System.out.println("[AuthController] Refresh token validated for user: " + username);
            
            // Load user details from database to get full authorities
            org.springframework.security.core.userdetails.UserDetails userDetails;
            try {
                userDetails = this.userDetailsService.loadUserByUsername(username);
            } catch (UsernameNotFoundException e) {
                System.out.println("[AuthController] ERROR: User not found: " + username);
                throw new RuntimeException("User not found: " + username);
            }
            
            // Create authentication with full user details including authorities
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
            );
            
            String newAccessToken = this.securityUtil.createToken(authentication);
            
            // Rotate refresh token for security (lưu vào cookie, không trả về trong response)
            String newRefreshToken = this.securityUtil.createRefreshToken(username);
            Cookie newRefreshTokenCookie = new Cookie("refreshToken", newRefreshToken);
            newRefreshTokenCookie.setHttpOnly(true);
            newRefreshTokenCookie.setSecure(false);  // Set to true in production with HTTPS
            newRefreshTokenCookie.setPath("/api/v1");
            newRefreshTokenCookie.setMaxAge(30 * 24 * 60 * 60);  // 30 days
            response.addCookie(newRefreshTokenCookie);
            
            System.out.println("[AuthController] New access token generated");
            System.out.println("[AuthController] New refresh token saved to cookie: " + newRefreshToken.substring(0, Math.min(20, newRefreshToken.length())) + "...");
            
            // Chỉ trả về access token, refresh token đã được lưu vào cookie
            return new ResponseLoginDTO(newAccessToken);
        } catch (RuntimeException e) {
            System.out.println("[AuthController] Refresh token error: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.out.println("[AuthController] Unexpected error during refresh: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Invalid refresh token: " + e.getMessage());
        }
    }

    @Operation(
        summary = "Test endpoint để kiểm tra refresh token",
        description = """
            API này dùng để test và debug refresh token functionality.
            
            **Trả về thông tin:**
            - Access token hiện tại (từ Authorization header)
            - Refresh token hiện tại (từ cookie)
            - Thời gian còn lại của mỗi token
            - Thông tin user từ token
            
            **Cách sử dụng:**
            1. Đăng nhập để lấy tokens
            2. Gọi GET /test-refresh
            3. Xem thông tin chi tiết tokens
            """,
        tags = {"Testing"}
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Thông tin tokens",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Token Info",
                    value = """
                        {
                            "status": "success",
                            "message": "Token information",
                            "data": {
                                "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                "accessTokenUsername": "root_admin@system.local",
                                "accessTokenExpiresIn": 86000,
                                "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                "refreshTokenUsername": "root_admin@system.local",
                                "refreshTokenExpiresIn": 2592000,
                                "message": "All tokens are valid"
                            },
                            "errors": null
                        }
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Access token không hợp lệ",
            content = @Content(
                mediaType = "application/json"
            )
        )
    })
    @GetMapping("/test-refresh")
    public APIResponse<?> testRefresh(
        @RequestHeader(name = "Authorization", required = false) String authHeader,
        @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        java.util.Map<String, Object> info = new java.util.HashMap<>();
        
        // Extract access token from Authorization header
        String accessToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            accessToken = authHeader.substring(7);
        }

        // Get Access Token info
        if (accessToken != null) {
            try {
                String username = this.securityUtil.getUsernameFromToken(accessToken);
                long expiresIn = this.securityUtil.getExpiresInFromToken(accessToken);
                info.put("accessToken", accessToken);
                info.put("accessTokenUsername", username);
                info.put("accessTokenExpiresIn", expiresIn);
            } catch (Exception e) {
                info.put("accessTokenError", "Invalid access token: " + e.getMessage());
            }
        } else {
            info.put("accessTokenError", "No access token in Authorization header");
        }

        // Get Refresh Token info
        if (refreshToken != null) {
            try {
                String username = this.securityUtil.getUsernameFromRefreshToken(refreshToken);
                long expiresIn = this.securityUtil.getExpiresInFromRefreshToken(refreshToken);
                info.put("refreshToken", refreshToken);
                info.put("refreshTokenUsername", username);
                info.put("refreshTokenExpiresIn", expiresIn);
            } catch (Exception e) {
                info.put("refreshTokenError", "Invalid refresh token: " + e.getMessage());
            }
        } else {
            info.put("refreshTokenError", "No refresh token in cookies");
        }

        // Determine status message
        String message = "Token information retrieved";
        if (info.containsKey("accessTokenError") && info.containsKey("refreshTokenError")) {
            message = "Both tokens are invalid or missing";
        } else if (info.containsKey("accessTokenError")) {
            message = "Access token is invalid, but refresh token is valid";
        } else if (info.containsKey("refreshTokenError")) {
            message = "Refresh token is missing, but access token is valid";
        } else {
            message = "All tokens are valid";
        }

        info.put("message", message);

        return new APIResponse<>(
                org.springframework.http.HttpStatus.OK,
                "Token information",
                info,
                null
        );
    }

    @Operation(
        summary = "Test quick refresh - Login + Refresh in one step",
        description = """
            Endpoint này dùng để test nhanh toàn bộ flow login -> refresh.
            
            **Cách sử dụng:**
            1. Gửi POST request với username/password
            2. Endpoint sẽ tự động:
               - Login lấy tokens
               - Gọi /refresh ngay lập tức
               - Trả về cả login response và refresh response
            3. So sánh tokens để kiểm tra rotation
            
            **Response chứa:**
            - tokens_from_login: access token và refresh token ban đầu
            - tokens_from_refresh: tokens sau khi refresh (nên khác tokens_from_login)
            """,
        tags = {"Testing"}
    )
    @PostMapping("/test-quick-refresh")
    public APIResponse<?> testQuickRefresh(
        @RequestBody LoginDTO loginDTO,
        HttpServletResponse response
    ) {
        try {
            // Step 1: Login
            Authentication authentication = authenticationManagerBuilder.getObject()
                    .authenticate(new UsernamePasswordAuthenticationToken(
                            loginDTO.getUsername(), 
                            loginDTO.getPassword()
                    ));

            String accessToken1 = this.securityUtil.createToken(authentication);
            String refreshToken1 = this.securityUtil.createRefreshToken(authentication.getName());

            // Step 2: Immediately refresh to get new tokens
            String username = this.securityUtil.getUsernameFromRefreshToken(refreshToken1);
            
            // Load user details from database to get full authorities
            org.springframework.security.core.userdetails.UserDetails userDetails;
            try {
                userDetails = this.userDetailsService.loadUserByUsername(username);
            } catch (UsernameNotFoundException e) {
                throw new RuntimeException("User not found: " + username);
            }
            
            Authentication auth2 = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
            );
            
            String accessToken2 = this.securityUtil.createToken(auth2);
            String refreshToken2 = this.securityUtil.createRefreshToken(username);

            // Set cookie with final refresh token
            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken2);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false);
            refreshTokenCookie.setPath("/api/v1");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60);
            response.addCookie(refreshTokenCookie);

            // Compare tokens
            java.util.Map<String, Object> testResult = new java.util.HashMap<>();
            testResult.put("step_1_login", java.util.Map.of(
                "accessToken", accessToken1,
                "refreshToken", refreshToken1
            ));
            testResult.put("step_2_refresh", java.util.Map.of(
                "accessToken", accessToken2,
                "refreshToken", refreshToken2
            ));
            testResult.put("tokens_rotated", !refreshToken1.equals(refreshToken2) && !accessToken1.equals(accessToken2));
            testResult.put("message", "Quick refresh test completed. Check if tokens are different (rotated).");

            return new APIResponse<>(
                    org.springframework.http.HttpStatus.OK,
                    "Quick refresh test completed successfully",
                    testResult,
                    null
            );
        } catch (Exception e) {
            return new APIResponse<>(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Quick refresh test failed: " + e.getMessage(),
                    null,
                    e.getMessage()
            );
        }
    }
}
