package www.java.client.controller;

import www.java.client.model.User;
import www.java.client.service.AuthService;
import www.java.client.service.UserService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    // Hiển thị trang login
    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }

    // Xử lý login
    @PostMapping("/login")
    public String login(@RequestParam("username") String username, 
                       @RequestParam("password") String password,
                       RedirectAttributes redirectAttributes) {
        System.out.println("========================================");
        System.out.println("AuthController.login() called");
        System.out.println("Username: " + username);
        System.out.println("========================================");
        
        var response = authService.login(username, password);
        
        System.out.println("========================================");
        System.out.println("AuthService response: " + (response != null ? "NOT NULL" : "NULL"));
        if (response != null) {
            System.out.println("AccessToken: " + (response.getAccessToken() != null ? "NOT NULL" : "NULL"));
        }
        System.out.println("========================================");
        
        if (response != null && response.getAccessToken() != null) {
            System.out.println("Redirecting to /user");
            return "redirect:/user";
        } else {
            System.out.println("Login failed, redirecting to /login with error");
            redirectAttributes.addFlashAttribute("errorMessage", "Username hoặc password không đúng!");
            return "redirect:/login";
        }
    }

    // Xử lý logout
    @GetMapping("/logout")
    public String logout(RedirectAttributes redirectAttributes) {
        authService.logout();
        redirectAttributes.addFlashAttribute("successMessage", "Đăng xuất thành công!");
        return "redirect:/login";
    }

    // Trang chủ redirect về login
    @GetMapping("/")
    public String home() {
        return "redirect:/login";
    }

    // Hiển thị trang đăng ký
    @GetMapping("/register")
    public String showRegisterForm() {
        return "register";
    }

    // Xử lý đăng ký
    @PostMapping("/register")
    public String register(
            @RequestParam("username") String username,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("confirmPassword") String confirmPassword,
            @RequestParam(value = "role", defaultValue = "USER") String role,
            RedirectAttributes redirectAttributes) {
        
        // Validation
        if (username == null || username.trim().isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Username là bắt buộc!");
            return "redirect:/register";
        }
        
        if (email == null || email.trim().isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Email là bắt buộc!");
            return "redirect:/register";
        }
        
        if (password == null || password.trim().isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Password là bắt buộc!");
            return "redirect:/register";
        }
        
        if (!password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("errorMessage", "Password và xác nhận password không khớp!");
            return "redirect:/register";
        }
        
        try {
            // Tạo user mới
            User newUser = new User();
            newUser.setUsername(username.trim());
            newUser.setEmail(email.trim());
            newUser.setPassword(password);
            newUser.setRole(role.toUpperCase());
            newUser.setIsActive(true);
            newUser.setCreatedAt(java.time.Instant.now());
            newUser.setUpdatedAt(java.time.Instant.now());
            newUser.setCreatedBy("system");
            
            User created = userService.createUser(newUser);
            
            if (created != null) {
                redirectAttributes.addFlashAttribute("successMessage", "Đăng ký thành công! Vui lòng đăng nhập.");
                return "redirect:/login";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Đăng ký thất bại! Vui lòng thử lại.");
                return "redirect:/register";
            }
        } catch (Exception e) {
            System.err.println("Error during registration: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi đăng ký: " + (e.getMessage() != null ? e.getMessage() : "Vui lòng thử lại."));
            return "redirect:/register";
        }
    }

    // API endpoint để lấy token từ session
    @GetMapping("/api/auth/token")
    @ResponseBody
    public java.util.Map<String, String> getToken() {
        java.util.Map<String, String> response = new java.util.HashMap<>();
        String token = authService.getTokenFromSession();
        if (token != null) {
            response.put("token", token);
            response.put("status", "success");
        } else {
            response.put("status", "error");
            response.put("message", "No token found");
        }
        return response;
    }
}
