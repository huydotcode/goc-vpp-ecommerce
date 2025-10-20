package www.java.client.controller;

import www.java.client.service.AuthService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
            System.out.println("Redirecting to /users");
            return "redirect:/users";
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
}
