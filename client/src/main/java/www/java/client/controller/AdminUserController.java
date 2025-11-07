package www.java.client.controller;

import www.java.client.annotation.RequireAdmin;
import www.java.client.model.User;
import www.java.client.model.PaginatedResponse;
import www.java.client.service.UserService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/users")
@RequireAdmin
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public String listUsers(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "id") String sort,
            @RequestParam(value = "direction", defaultValue = "asc") String direction,
            @RequestParam(value = "id", required = false) String id,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "search", required = false) String search,
            Model model) {

        page = Math.max(1, page);
        size = Math.min(Math.max(5, size), 100);
        direction = "desc".equalsIgnoreCase(direction) ? "desc" : "asc";

        PaginatedResponse<User> paginatedResponse = userService.getUsersWithPagination(
            page, size, sort, direction, id, role, username, email, isActive, search);

        if (paginatedResponse == null || paginatedResponse.getResult() == null) {
            paginatedResponse = new PaginatedResponse<>();
            paginatedResponse.setResult(new java.util.ArrayList<>());
        }

        PaginatedResponse.Metadata metadata = paginatedResponse.getMetadata();
        int currentPage = metadata != null ? metadata.getPage() : page;
        int totalPages = metadata != null ? metadata.getTotalPages() : 1;
        long totalElements = metadata != null ? metadata.getTotalElements() : 0;

        boolean hasNext = currentPage < totalPages;
        boolean hasPrev = currentPage > 1;

        model.addAttribute("users", paginatedResponse.getResult());
        model.addAttribute("currentPage", currentPage);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalElements", totalElements);
        model.addAttribute("hasNext", hasNext);
        model.addAttribute("hasPrev", hasPrev);
        model.addAttribute("sort", sort);
        model.addAttribute("direction", direction);
        model.addAttribute("id", id);
        model.addAttribute("role", role);
        model.addAttribute("username", username);
        model.addAttribute("email", email);
        model.addAttribute("isActive", isActive);
        model.addAttribute("search", search);
        model.addAttribute("size", size);

        return "users/list-admin";
    }

    @PostMapping
    public String createUser(@ModelAttribute User user, RedirectAttributes redirectAttributes) {
        try {
            User created = userService.createUser(user);
            if (created != null) {
                redirectAttributes.addFlashAttribute("successMessage", "Tạo user thành công!");
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Tạo user thất bại!");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi tạo user: " + e.getMessage());
        }
        return "redirect:/users";
    }

    @PostMapping("/update/{id}")
    public String updateUser(@PathVariable("id") Long id, @ModelAttribute User user, RedirectAttributes redirectAttributes) {
        try {
            User updated = userService.updateUser(id, user);
            if (updated != null) {
                redirectAttributes.addFlashAttribute("successMessage", "Cập nhật user thành công!");
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Cập nhật user thất bại!");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi cập nhật user: " + e.getMessage());
        }
        return "redirect:/users";
    }

    @GetMapping("/delete/{id}")
    public String deleteUser(@PathVariable("id") Long id, RedirectAttributes redirectAttributes) {
        try {
            userService.deleteUser(id);
            redirectAttributes.addFlashAttribute("successMessage", "Xóa user thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi xóa user: " + e.getMessage());
        }
        return "redirect:/users";
    }
}

