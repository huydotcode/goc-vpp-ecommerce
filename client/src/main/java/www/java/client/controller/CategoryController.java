package www.java.client.controller;

import www.java.client.model.Category;
import www.java.client.model.PaginatedResponse;
import www.java.client.service.CategoryService;

import java.util.ArrayList;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
@RequestMapping("/categories")
public class CategoryController {

    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);
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
            @RequestParam(value = "id", required = false) String id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "search", required = false) String search,
            Model model) {

        page = Math.max(1, page);
        size = Math.min(Math.max(MIN_PAGE_SIZE, size), MAX_PAGE_SIZE);
        direction = "desc".equalsIgnoreCase(direction) ? "desc" : "asc";

        PaginatedResponse<Category> paginatedResponse = categoryService.getCategoriesWithPagination(
            page, size, sort, direction, id, name, isActive, search);

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
        model.addAttribute("id", id);
        model.addAttribute("name", name);
        model.addAttribute("isActive", isActive);
        model.addAttribute("search", search);
        model.addAttribute("size", size);

        return "categories/list-admin";
    }

    @PostMapping
    public String createCategory(@ModelAttribute Category category, 
                                @RequestParam(value = "name", required = false) String nameParam,
                                @RequestParam(value = "description", required = false) String descriptionParam,
                                @RequestParam(value = "thumbnailUrl", required = false) String thumbnailUrlParam,
                                RedirectAttributes redirectAttributes) {
        logger.info("========================================");
        logger.info("CategoryController.createCategory() called");
        logger.info("Category before setting fields:");
        logger.info("Name: '{}'", category.getName());
        logger.info("Description: '{}'", category.getDescription());
        logger.info("ThumbnailUrl: '{}'", category.getThumbnailUrl());
        logger.info("IsActive: {}", category.getIsActive());
        logger.info("Category object: {}", category);
        logger.info("Request params:");
        logger.info("nameParam: '{}'", nameParam);
        logger.info("descriptionParam: '{}'", descriptionParam);
        logger.info("thumbnailUrlParam: '{}'", thumbnailUrlParam);
        logger.info("========================================");
        
        try {
            // Fallback: sử dụng request params nếu model binding không hoạt động
            if (category.getName() == null || category.getName().trim().isEmpty()) {
                if (nameParam != null && !nameParam.trim().isEmpty()) {
                    category.setName(nameParam.trim());
                    logger.info("Using nameParam: '{}'", nameParam);
                }
            }
            if (category.getDescription() == null) {
                if (descriptionParam != null) {
                    category.setDescription(descriptionParam);
                    logger.info("Using descriptionParam: '{}'", descriptionParam);
                }
            }
            if (category.getThumbnailUrl() == null) {
                if (thumbnailUrlParam != null) {
                    category.setThumbnailUrl(thumbnailUrlParam);
                    logger.info("Using thumbnailUrlParam: '{}'", thumbnailUrlParam);
                }
            }
            
            // Validation
            if (category.getName() == null || category.getName().trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Tên category là bắt buộc!");
                return "redirect:/categories";
            }
            
            // Set các field bắt buộc
            category.setIsActive(true);
            category.setCreatedAt(java.time.Instant.now());
            category.setUpdatedAt(java.time.Instant.now());
            category.setCreatedBy("system");
            category.setUpdatedBy("system");
            
            logger.info("Category after setting fields:");
            logger.info("Name: {}", category.getName());
            logger.info("IsActive: {}", category.getIsActive());
            logger.info("CreatedAt: {}", category.getCreatedAt());
            logger.info("UpdatedAt: {}", category.getUpdatedAt());
            logger.info("CreatedBy: {}", category.getCreatedBy());
            logger.info("UpdatedBy: {}", category.getUpdatedBy());
            logger.info("========================================");
            
            Category created = categoryService.createCategory(category);
            if (created != null) {
                logger.info("Category created successfully with ID: {}", created.getId());
                redirectAttributes.addFlashAttribute("successMessage", "Tạo category thành công!");
            } else {
                logger.error("Failed to create category - service returned null");
                redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi tạo category!");
            }
        } catch (Exception e) {
            logger.error("Exception occurred while creating category", e);
            redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi tạo category: " + e.getMessage());
        }
        return "redirect:/categories";
    }

    @PostMapping("/update/{id}")
    public String updateCategory(@PathVariable("id") Long id, @ModelAttribute Category category, RedirectAttributes redirectAttributes) {
        logger.info("========================================");
        logger.info("CategoryController.updateCategory() called with ID: {}", id);
        logger.info("Category update data:");
        logger.info("Name: {}", category.getName());
        logger.info("Description: {}", category.getDescription());
        logger.info("ThumbnailUrl: {}", category.getThumbnailUrl());
        logger.info("IsActive: {}", category.getIsActive());
        logger.info("========================================");
        
        try {
            // Validation
            if (category.getName() == null || category.getName().trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Tên category là bắt buộc!");
                return "redirect:/categories";
            }
            
            // Set updated timestamp
            category.setUpdatedAt(java.time.Instant.now());
            category.setUpdatedBy("system");
            
            Category updated = categoryService.updateCategory(id, category);
            if (updated != null) {
                logger.info("Category updated successfully with ID: {}", updated.getId());
                redirectAttributes.addFlashAttribute("successMessage", "Cập nhật category thành công!");
            } else {
                logger.error("Failed to update category - service returned null");
                redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi cập nhật category!");
            }
        } catch (Exception e) {
            logger.error("Exception occurred while updating category with ID: {}", id, e);
            redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi cập nhật category: " + e.getMessage());
        }
        return "redirect:/categories";
    }

    @GetMapping("/delete/{id}")
    public String deleteCategory(@PathVariable("id") Long id, RedirectAttributes redirectAttributes) {
        logger.info("========================================");
        logger.info("CategoryController.deleteCategory() called with ID: {}", id);
        logger.info("========================================");
        
        try {
            if (id == null || id <= 0) {
                redirectAttributes.addFlashAttribute("errorMessage", "ID category không hợp lệ!");
                return "redirect:/categories";
            }
            
            categoryService.deleteCategory(id);
            logger.info("Category deleted successfully with ID: {}", id);
            redirectAttributes.addFlashAttribute("successMessage", "Xóa category thành công!");
        } catch (Exception e) {
            logger.error("Exception occurred while deleting category with ID: {}", id, e);
            redirectAttributes.addFlashAttribute("errorMessage", "Có lỗi xảy ra khi xóa category: " + e.getMessage());
        }
        return "redirect:/categories";
    }
    
}


