package www.java.client.controller;

import www.java.client.model.User;
import www.java.client.service.UserService;
import www.java.client.model.PaginatedResponse;

import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
@RequestMapping("/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private static final int MIN_PAGE_SIZE = 5;
    private static final int MAX_PAGE_SIZE = 100;

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

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
        
        try {
            // Validate và normalize parameters
            page = Math.max(1, page);
            size = Math.min(Math.max(MIN_PAGE_SIZE, size), MAX_PAGE_SIZE);
            direction = "desc".equalsIgnoreCase(direction) ? "desc" : "asc";
            
            logger.debug("Loading users - Page: {}, Size: {}, Sort: {}, Direction: {}", 
                        page, size, sort, direction);

            // Gọi API với server-side pagination và filtering
            PaginatedResponse<User> paginatedResponse = userService.getUsersWithPagination(
                page, size, sort, direction, role, username, email, isActive, search);

            if (paginatedResponse == null || paginatedResponse.getResult() == null) {
                logger.warn("Received null or empty response from service");
                paginatedResponse = new PaginatedResponse<>();
                paginatedResponse.setResult(new ArrayList<>());
            }

            // Tính toán pagination metadata
            PaginatedResponse.Metadata metadata = paginatedResponse.getMetadata();
            int currentPage = metadata != null ? metadata.getPage() : page;
            int totalPages = metadata != null ? metadata.getTotalPages() : 1;
            long totalElements = metadata != null ? metadata.getTotalElements() : 0;
            
            boolean hasNext = currentPage < totalPages;
            boolean hasPrev = currentPage > 1;

            // Add attributes to model
            addPaginationAttributes(model, paginatedResponse.getResult(), currentPage, 
                                  totalPages, totalElements, hasNext, hasPrev, 
                                  sort, direction, role, username, email, isActive, search, size);

            logger.debug("Successfully loaded {} users (page {}/{})", 
                        paginatedResponse.getResult().size(), currentPage, totalPages);
            
            // Add success parameter for notification
            model.addAttribute("success", "true");
            
            return "users/list-admin";
            
        } catch (Exception e) {
            logger.error("Error loading users: {}", e.getMessage(), e);
            logger.error("Exception type: {}", e.getClass().getSimpleName());
            logger.error("Exception cause: {}", e.getCause());
            
            if (isAuthenticationError(e)) {
                logger.warn("Authentication error detected, redirecting to login");
                logger.warn("Error message: {}", e.getMessage());
                return "redirect:/login?error=token_expired";
            }
            
            // Return empty page with error message
            addPaginationAttributes(model, new ArrayList<>(), 1, 1, 0, 
                                  false, false, sort, direction, role, username, 
                                  email, isActive, search, size);
            model.addAttribute("errorMessage", "Có lỗi xảy ra khi tải danh sách users. Vui lòng thử lại.");
            
            return "users/list-admin";
        }
    }

    private void addPaginationAttributes(Model model, List<User> users, int currentPage, 
                                       int totalPages, long totalElements, boolean hasNext, 
                                       boolean hasPrev, String sort, String direction, 
                                       String role, String username, String email, 
                                       Boolean isActive, String search, int size) {
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
    }

    private boolean isAuthenticationError(Exception e) {
        String message = e.getMessage();
        return message != null && (message.contains("401") || 
                                  message.contains("Unauthorized") || 
                                  message.contains("Forbidden"));
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

