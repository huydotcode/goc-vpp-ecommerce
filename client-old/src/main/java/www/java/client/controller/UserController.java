package www.java.client.controller;

import www.java.client.service.TokenService;
import www.java.client.utils.JwtUtil;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class UserController {

    private final TokenService tokenService;
    private final JwtUtil jwtUtil;
    
    public UserController(TokenService tokenService, JwtUtil jwtUtil) {
        this.tokenService = tokenService;
        this.jwtUtil = jwtUtil;
    }
    
    /**
     * Trang user sau khi login
     */
    @GetMapping("/user")
    public String userPage(
            @RequestParam(value = "error", required = false) String error,
            Model model, 
            RedirectAttributes redirectAttributes) {
        String token = tokenService.getToken();
        
        // Kiểm tra token
        if (token == null || !jwtUtil.isValidToken(token)) {
            redirectAttributes.addFlashAttribute("errorMessage", "Vui lòng đăng nhập!");
            return "redirect:/login";
        }
        
        // Lấy thông tin từ token
        String username = jwtUtil.getUsername(token);
        java.util.List<String> roles = jwtUtil.getRoles(token);
        boolean isAdmin = jwtUtil.isAdmin(token);
        
        // Debug logging
        System.out.println("[UserController] Username: " + username);
        System.out.println("[UserController] Roles: " + roles);
        System.out.println("[UserController] IsAdmin: " + isAdmin);
        
        model.addAttribute("username", username);
        model.addAttribute("roles", roles);
        model.addAttribute("isAdmin", isAdmin);
        
        // Hiển thị thông báo lỗi nếu có
        if ("access_denied".equals(error)) {
            model.addAttribute("errorMessage", "Bạn không có quyền truy cập trang quản trị. Chỉ người dùng có role ADMIN mới có thể truy cập.");
        }
        
        // Redirect đến trang shop (giới thiệu sản phẩm)
        return "redirect:/shop";
    }
}
