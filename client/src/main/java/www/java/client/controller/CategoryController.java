package www.java.client.controller;

import www.java.client.model.Category;
import www.java.client.model.PaginatedResponse;
import www.java.client.service.CategoryService;

import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/categories")
public class CategoryController {

    private static final int MIN_PAGE_SIZE = 5;
    private static final int MAX_PAGE_SIZE = 100;

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public String listCategories(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "id") String sort,
            @RequestParam(value = "direction", defaultValue = "asc") String direction,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "search", required = false) String search,
            Model model) {

        page = Math.max(1, page);
        size = Math.min(Math.max(MIN_PAGE_SIZE, size), MAX_PAGE_SIZE);
        direction = "desc".equalsIgnoreCase(direction) ? "desc" : "asc";

        PaginatedResponse<Category> paginatedResponse = categoryService.getCategoriesWithPagination(
            page, size, sort, direction, name, isActive, search);

        if (paginatedResponse == null || paginatedResponse.getResult() == null) {
            paginatedResponse = new PaginatedResponse<>();
            paginatedResponse.setResult(new ArrayList<>());
        }

        PaginatedResponse.Metadata metadata = paginatedResponse.getMetadata();
        int currentPage = metadata != null ? metadata.getPage() : page;
        int totalPages = metadata != null ? metadata.getTotalPages() : 1;
        long totalElements = metadata != null ? metadata.getTotalElements() : 0;

        boolean hasNext = currentPage < totalPages;
        boolean hasPrev = currentPage > 1;

        model.addAttribute("categories", paginatedResponse.getResult());
        model.addAttribute("currentPage", currentPage);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalElements", totalElements);
        model.addAttribute("hasNext", hasNext);
        model.addAttribute("hasPrev", hasPrev);
        model.addAttribute("sort", sort);
        model.addAttribute("direction", direction);
        model.addAttribute("name", name);
        model.addAttribute("isActive", isActive);
        model.addAttribute("search", search);
        model.addAttribute("size", size);

        return "categories/list-admin";
    }

    @PostMapping
    public String createCategory(@ModelAttribute Category category, RedirectAttributes redirectAttributes) {
        category.setIsActive(true);
        category.setCreatedAt(java.time.Instant.now());
        category.setUpdatedAt(java.time.Instant.now());
        category.setCreatedBy("system");
        category.setUpdatedBy("system");
        Category created = categoryService.createCategory(category);
        if (created != null) {
            redirectAttributes.addFlashAttribute("successMessage", "Tạo category thành công!");
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi tạo category!");
        }
        return "redirect:/categories";
    }

    @PostMapping("/update/{id}")
    public String updateCategory(@PathVariable("id") Long id, @ModelAttribute Category category, RedirectAttributes redirectAttributes) {
        Category updated = categoryService.updateCategory(id, category);
        if (updated != null) {
            redirectAttributes.addFlashAttribute("successMessage", "Cập nhật category thành công!");
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi cập nhật category!");
        }
        return "redirect:/categories";
    }

    @GetMapping("/delete/{id}")
    public String deleteCategory(@PathVariable("id") Long id, RedirectAttributes redirectAttributes) {
        try {
            categoryService.deleteCategory(id);
            redirectAttributes.addFlashAttribute("successMessage", "Xóa category thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi xóa category!");
        }
        return "redirect:/categories";
    }
}


