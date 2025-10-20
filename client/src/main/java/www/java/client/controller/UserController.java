package www.java.client.controller;

import www.java.client.model.User;
import www.java.client.service.UserService;

import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Hiển thị danh sách users với sort, filter và search
    @GetMapping
    public String listUsers(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "id") String sort,
            @RequestParam(value = "direction", defaultValue = "asc") String direction,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "search", required = false) String search,
            Model model) {
        
        System.out.println("========================================");
        System.out.println("UserController.listUsers() called");
        System.out.println("Page: " + page + ", Size: " + size);
        System.out.println("Sort: " + sort + ", Direction: " + direction);
        System.out.println("Role: " + role + ", Username: " + username + ", Email: " + email);
        System.out.println("IsActive: " + isActive + ", Search: " + search);
        System.out.println("========================================");
        
        try {
            // Server-side pagination từ backend
            var paginated = userService.getUsersAdvanced(page, size, sort, direction);
            List<User> users = (paginated != null && paginated.getResult() != null) ? paginated.getResult() : new ArrayList<>();
            
            // Apply search filter ở client (vì backend chưa có search API)
            if (search != null && !search.trim().isEmpty()) {
                users = users.stream()
                    .filter(user -> 
                        user.getUsername().toLowerCase().contains(search.toLowerCase()) ||
                        user.getEmail().toLowerCase().contains(search.toLowerCase()) ||
                        (user.getId().toString().equals(search))
                    )
                    .collect(java.util.stream.Collectors.toList());
            }
            
            // Apply sorting ở client
            users = userService.sortUsers(users, sort, direction);
            
            // Apply pagination ở client (clamp page hợp lệ, tránh out-of-range)
            // Metadata từ backend
            int totalElements = (paginated != null && paginated.getMetadata() != null) ? (int) paginated.getMetadata().getTotalElements() : users.size();
            int totalPages = (paginated != null && paginated.getMetadata() != null) ? paginated.getMetadata().getTotalPages() : 1;
            int currentPage = (paginated != null && paginated.getMetadata() != null) ? paginated.getMetadata().getPage() : page;
            boolean hasNext = currentPage < totalPages;
            boolean hasPrev = currentPage > 1;
            
            model.addAttribute("users", users);
            model.addAttribute("currentPage", currentPage);
            model.addAttribute("totalPages", totalPages);
            model.addAttribute("totalElements", totalElements);
            model.addAttribute("hasNext", hasNext);
            model.addAttribute("hasPrev", hasPrev);
            model.addAttribute("sort", sort);
            model.addAttribute("direction", direction);
            model.addAttribute("role", role);
            model.addAttribute("username", username);
            model.addAttribute("email", email);
            model.addAttribute("isActive", isActive);
            model.addAttribute("search", search);
            model.addAttribute("size", size);
            
            return "users/list";
        } catch (Exception e) {
            System.err.println("ERROR in listUsers: " + e.getMessage());
            // Nếu có lỗi authentication, redirect về login
            if (e.getMessage().contains("401") || e.getMessage().contains("Unauthorized")) {
                System.out.println("Token expired or invalid, redirecting to login");
                return "redirect:/login?error=token_expired";
            }
            // Nếu có lỗi khác, hiển thị trang trống
            model.addAttribute("users", new java.util.ArrayList<>());
            model.addAttribute("errorMessage", "Có lỗi xảy ra khi tải danh sách users: " + e.getMessage());
            return "users/list";
        }
    }

    // Hiển thị form tạo mới user
    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("user", new User());
        model.addAttribute("isEdit", false);
        return "users/form";
    }

    // Xử lý tạo mới user
    @PostMapping
    public String createUser(@ModelAttribute User user, RedirectAttributes redirectAttributes) {
        System.out.println("========================================");
        System.out.println("UserController.createUser() called");
        System.out.println("User before setting fields:");
        System.out.println("Username: " + user.getUsername());
        System.out.println("Email: " + user.getEmail());
        System.out.println("Role: " + user.getRole());
        System.out.println("IsActive: " + user.getIsActive());
        System.out.println("CreatedAt: " + user.getCreatedAt());
        System.out.println("========================================");
        
        // Set các field bắt buộc
        user.setIsActive(true);
        user.setCreatedAt(java.time.Instant.now());
        user.setUpdatedAt(java.time.Instant.now());
        user.setCreatedBy("system"); // hoặc lấy từ session
        user.setUpdatedBy("system");
        
        System.out.println("User after setting fields:");
        System.out.println("IsActive: " + user.getIsActive());
        System.out.println("CreatedAt: " + user.getCreatedAt());
        System.out.println("UpdatedAt: " + user.getUpdatedAt());
        System.out.println("CreatedBy: " + user.getCreatedBy());
        System.out.println("UpdatedBy: " + user.getUpdatedBy());
        System.out.println("========================================");
        
        User created = userService.createUser(user);
        if (created != null) {
            redirectAttributes.addFlashAttribute("successMessage", "Tạo user thành công!");
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi tạo user!");
        }
        return "redirect:/users";
    }

    // Hiển thị form chỉnh sửa user
    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable("id") Long id, Model model, RedirectAttributes redirectAttributes) {
        User user = userService.getUserById(id);
        if (user != null) {
            model.addAttribute("user", user);
            model.addAttribute("isEdit", true);
            return "users/form";
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Không tìm thấy user!");
            return "redirect:/users";
        }
    }

    // Xử lý cập nhật user
    @PostMapping("/update/{id}")
    public String updateUser(@PathVariable("id") Long id, @ModelAttribute User user, RedirectAttributes redirectAttributes) {
        User updated = userService.updateUser(id, user);
        if (updated != null) {
            redirectAttributes.addFlashAttribute("successMessage", "Cập nhật user thành công!");
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi cập nhật user!");
        }
        return "redirect:/users";
    }

    // Xử lý xóa user
    @GetMapping("/delete/{id}")
    public String deleteUser(@PathVariable("id") Long id, RedirectAttributes redirectAttributes) {
        try {
            userService.deleteUser(id);
            redirectAttributes.addFlashAttribute("successMessage", "Xóa user thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi xóa user!");
        }
        return "redirect:/users";
    }

    // Hiển thị chi tiết user
    @GetMapping("/view/{id}")
    public String viewUser(@PathVariable("id") Long id, Model model, RedirectAttributes redirectAttributes) {
        User user = userService.getUserById(id);
        if (user != null) {
            model.addAttribute("user", user);
            return "users/view";
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Không tìm thấy user!");
            return "redirect:/users";
        }
    }

    // API endpoints for modal (JSON response)
    @GetMapping("/api/{id}")
    @ResponseBody
    public User getUserApi(@PathVariable("id") Long id) {
        System.out.println("========================================");
        System.out.println("getUserApi called with ID: " + id);
        User user = userService.getUserById(id);
        if (user != null) {
            System.out.println("User found: " + user.getUsername());
            System.out.println("Email: " + user.getEmail());
            System.out.println("Role: " + user.getRole());
            System.out.println("IsActive: " + user.getIsActive());
            System.out.println("CreatedAt: " + user.getCreatedAt());
        } else {
            System.out.println("User not found!");
        }
        System.out.println("========================================");
        return user;
    }

    @PutMapping("/api/{id}")
    @ResponseBody
    public User updateUserApi(@PathVariable("id") Long id, @RequestBody User user) {
        return userService.updateUser(id, user);
    }
}

