package com.example.learnspring1.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.learnspring1.domain.Category;
import com.example.learnspring1.domain.dto.CategoryDTO;
import com.example.learnspring1.domain.dto.PaginatedResponseDTO;
import com.example.learnspring1.domain.dto.MetadataDTO;
import com.example.learnspring1.service.CategoryService;
import com.example.learnspring1.domain.APIResponse;

import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import com.example.learnspring1.domain.CreateValidation;

@RestController
@RequestMapping("/categories")
@Tag(name = "Category", description = "Quản lý danh mục")
@SecurityRequirement(name = "Bearer Authentication")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @Operation(summary = "Tạo mới category", description = "Tạo mới một category với thông tin hợp lệ.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tạo category thành công",
            content = @Content(schema = @Schema(implementation = Category.class))),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ",
            content = @Content(schema = @Schema(implementation = APIResponse.class))),
        @ApiResponse(responseCode = "403", description = "Không có quyền",
            content = @Content(schema = @Schema(implementation = APIResponse.class)))
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public CategoryDTO createNewCategory(@Validated(CreateValidation.class) @RequestBody Category input) {
        Category category = this.categoryService.createCategory(input);
        return toDTO(category);
    }

    @Operation(summary = "Lấy category với sort và phân trang", description = "Trả về danh sách category với tính năng sort và phân trang.")
    @ApiResponse(responseCode = "200", description = "Thành công",
        content = @Content(schema = @Schema(implementation = PaginatedResponseDTO.class)))
    @GetMapping("/advanced")
    public PaginatedResponseDTO<CategoryDTO> getCategoriesAdvanced(
            @Parameter(description = "Trang hiện tại", example = "1") @RequestParam(name = "page", defaultValue = "1") int page,
            @Parameter(description = "Số lượng mỗi trang", example = "10") @RequestParam(name = "size", defaultValue = "10") int size,
            @Parameter(description = "Trường để sort", example = "name") @RequestParam(name = "sort", defaultValue = "id") String sortField,
            @Parameter(description = "Hướng sort (asc/desc)", example = "asc") @RequestParam(name = "direction", defaultValue = "asc") String direction,
            @Parameter(description = "ID để filter", example = "1") @RequestParam(name = "id", required = false) Long id,
            @Parameter(description = "Tên để filter", example = "Electronics") @RequestParam(name = "name", required = false) String name,
            @Parameter(description = "Trạng thái active", example = "true") @RequestParam(name = "isActive", required = false) Boolean isActive,
            @Parameter(description = "Search term", example = "electronics") @RequestParam(name = "search", required = false) String search) 
    {
        // Validate và normalize parameters
        page = Math.max(1, page);
        size = Math.min(Math.max(5, size), 100); // Min 5, Max 100
        
        // Validate và normalize sort field
        String[] allowedSortFields = {"id", "name", "createdAt", "updatedAt"};
        String validSortField = sortField;
        if (!java.util.Arrays.asList(allowedSortFields).contains(sortField)) {
            validSortField = "id"; // Default fallback
        }
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(sortDirection, validSortField);
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        
        // Sử dụng method với filtering
        Page<CategoryDTO> categoryPage = categoryService.getCategoriesPageWithFilters(pageable, id, name, isActive, search).map(this::toDTO);
        
        // Tạo metadata
        MetadataDTO metadata = MetadataDTO.builder()
                .page(page)
                .size(size)
                .totalElements(categoryPage.getTotalElements())
                .totalPages(categoryPage.getTotalPages())
                .first(categoryPage.isFirst())
                .last(categoryPage.isLast())
                .empty(categoryPage.isEmpty())
                .sortField(validSortField)
                .sortDirection(direction)
                .numberOfElements(categoryPage.getNumberOfElements())
                .build();
        
        return PaginatedResponseDTO.<CategoryDTO>builder()
                .metadata(metadata)
                .result(categoryPage.getContent())
                .build();
    }

    @Operation(summary = "Lấy category với filter thủ công", description = "Trả về danh sách category với filter thủ công.")
    @ApiResponse(responseCode = "200", description = "Thành công",
        content = @Content(schema = @Schema(implementation = Category.class)))
    @GetMapping("/filter")
    public List<CategoryDTO> getCategoriesByFilter(
            @Parameter(description = "Tên để filter", example = "Electronics") @RequestParam(name = "name", required = false) String name,
            @Parameter(description = "Trạng thái active", example = "true") @RequestParam(name = "isActive", required = false) Boolean isActive) 
    {
        return categoryService.getCategoriesWithFilters(name, isActive).stream().map(this::toDTO).toList();
    }

    @Operation(summary = "Lấy category theo ID", description = "Trả về thông tin category theo id.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công",
            content = @Content(schema = @Schema(implementation = Category.class))),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy category",
            content = @Content(schema = @Schema(implementation = APIResponse.class)))
    })
    @GetMapping("/{id}")
    public CategoryDTO getCategoryById(@Parameter(description = "ID của category", example = "1") @PathVariable("id") Long id) {
        Category category = categoryService.getCategoryById(id)
                .orElseThrow(() -> new NoSuchElementException("Category not found with id " + id));
        return toDTO(category);
    }

    @Operation(summary = "Cập nhật category", description = "Cập nhật thông tin category theo id.")
    @ApiResponse(responseCode = "200", description = "Cập nhật thành công",
        content = @Content(schema = @Schema(implementation = CategoryDTO.class)))
    @ApiResponse(responseCode = "404", description = "Không tìm thấy category",
        content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @ApiResponse(responseCode = "403", description = "Không có quyền",
        content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public CategoryDTO updateCategory(@Parameter(description = "ID của category", example = "1") @PathVariable("id") Long id,
                              @Valid @RequestBody Category category) {
        Category updatedCategory = categoryService.updateCategory(id, category);
        return toDTO(updatedCategory);
    }

    @Operation(summary = "Xóa category", description = "Xóa category theo id (soft delete).")
    @ApiResponse(responseCode = "200", description = "Xóa thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy category",
        content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @ApiResponse(responseCode = "403", description = "Không có quyền",
        content = @Content(schema = @Schema(implementation = APIResponse.class)))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCategory(@Parameter(description = "ID của category", example = "1") @PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
    }

    // Chuyển Category entity sang CategoryDTO
    private CategoryDTO toDTO(Category category) {
        if (category == null) return null;
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .thumbnailUrl(category.getThumbnailUrl())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .createdBy(category.getCreatedBy())
                .updatedBy(category.getUpdatedBy())
                .deletedBy(category.getDeletedBy())
                .build();
    }
}

