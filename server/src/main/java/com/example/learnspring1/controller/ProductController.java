package com.example.learnspring1.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Optional;

import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.dto.PaginatedResponseDTO;
import com.example.learnspring1.domain.dto.MetadataDTO;
import com.example.learnspring1.service.ProductService;
import com.example.learnspring1.service.UserProductHistoryService;
import com.example.learnspring1.utils.SecurityUtil;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/products")
@Tag(name = "Product", description = "Quản lý sản phẩm")
@SecurityRequirement(name = "Bearer Authentication")
public class ProductController {

    private final ProductService productService;
    private final UserProductHistoryService userProductHistoryService;

    public ProductController(ProductService productService, UserProductHistoryService userProductHistoryService) {
        this.productService = productService;
        this.userProductHistoryService = userProductHistoryService;
    }

    @Operation(summary = "Tạo mới product")
    @ApiResponse(responseCode = "200", description = "Tạo product thành công", content = @Content(schema = @Schema(implementation = Product.class)))
    @ApiResponse(responseCode = "403", description = "Không có quyền", content = @Content(schema = @Schema(implementation = com.example.learnspring1.domain.APIResponse.class)))
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public Product create(@Valid @RequestBody Product input) {
        return productService.createProduct(input);
    }

    @Operation(summary = "Lấy product phân trang")
    @GetMapping("/page")
    public Page<Product> getPage(
            @Parameter(description = "Trang hiện tại", example = "1") @RequestParam(name = "page", defaultValue = "1") int page,
            @Parameter(description = "Số lượng mỗi trang", example = "10") @RequestParam(name = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return productService.getProductsPage(pageable);
    }

    @Operation(summary = "Phân trang + lọc nâng cao")
    @GetMapping("/advanced")
    public PaginatedResponseDTO<Product> getAdvanced(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "id") String sortField,
            @RequestParam(name = "direction", defaultValue = "ASC") String sortDirection,
            @RequestParam(name = "id", required = false) Long id,
            @RequestParam(name = "name", required = false) String name,
            @RequestParam(name = "sku", required = false) String sku,
            @RequestParam(name = "brand", required = false) String brand,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "isFeatured", required = false) Boolean isFeatured,
            @RequestParam(name = "isActive", required = false) Boolean isActive,
            @RequestParam(name = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(name = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(name = "search", required = false) String search) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        if (direction == null) {
            direction = Sort.Direction.ASC;
        }
        Sort sort = Sort.by(direction, sortField);
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        Page<Product> result = productService.getProductsPageWithFilters(pageable, id, name, sku, brand, categoryId,
                isFeatured, isActive, minPrice, maxPrice, search);
        MetadataDTO metadata = MetadataDTO.builder()
                .page(page)
                .size(size)
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .sortField(sortField)
                .sortDirection(sortDirection)
                .build();
        return PaginatedResponseDTO.<Product>builder()
                .metadata(metadata)
                .result(result.getContent())
                .build();
    }

    @Operation(summary = "Gợi ý sản phẩm cho trang chủ / tìm kiếm nhanh")
    @GetMapping("/suggestions")
    public List<Product> getSuggestions(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "limit", defaultValue = "8") int limit) {
        return productService.suggestProducts(query, categoryId, limit);
    }

    @Operation(summary = "Gợi ý sản phẩm bằng vector (Gemini + ChromaDB)")
    @GetMapping("/vector-suggest")
    public List<Product> getVectorSuggestions(
            @RequestParam(name = "q") String query,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "limit", defaultValue = "8") int limit) {
        return productService.suggestProductsByVector(query, categoryId, limit);
    }

    @Operation(summary = "Track sản phẩm người dùng đã xem/click")
    @PostMapping("/{id}/view")
    public void trackProductView(@PathVariable("id") Long productId) {
        Optional<String> currentUser = SecurityUtil.getCurrentUserLogin();
        if (currentUser.isPresent()) {
            userProductHistoryService.addProductView(currentUser.get(), productId);
        }
    }

    @Operation(summary = "Gợi ý sản phẩm dựa trên lịch sử click/view của người dùng")
    @GetMapping("/history-suggest")
    public List<Product> getHistoryBasedSuggestions(
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "limit", defaultValue = "8") int limit) {
        Optional<String> currentUser = SecurityUtil.getCurrentUserLogin();
        if (currentUser.isEmpty()) {
            return productService.getBestSellers(PageRequest.of(0, limit)).getContent();
        }
        
        List<Long> viewedProductIds = userProductHistoryService.getUserHistory(currentUser.get(), 20);
        if (viewedProductIds.isEmpty()) {
            return productService.getBestSellers(PageRequest.of(0, limit)).getContent();
        }
        
        return productService.suggestProductsByUserHistory(viewedProductIds, categoryId, limit);
    }

    @Operation(summary = "Lấy danh sách sản phẩm bán chạy / nổi bật")
    @GetMapping("/best-sellers")
    public PaginatedResponseDTO<Product> getBestSellers(
            @RequestParam(name = "size", defaultValue = "8") int size) {
        int page = 1;
        Pageable pageable = PageRequest.of(page - 1, size);

        Page<Product> result = productService.getBestSellers(pageable);
        MetadataDTO metadata = MetadataDTO.builder()
                .page(page)
                .size(size)
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .sortField("bestSellerScore")
                .sortDirection("DESC")
                .build();

        return PaginatedResponseDTO.<Product>builder()
                .metadata(metadata)
                .result(result.getContent())
                .build();
    }

    @Operation(summary = "Lấy product theo id")
    @GetMapping("/{id}")
    public Product getById(@PathVariable("id") Long id) {
        return productService.getProductByIdWithImages(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Product not found with id " + id));
    }

    @Operation(summary = "Cập nhật product")
    @ApiResponse(responseCode = "403", description = "Không có quyền", content = @Content(schema = @Schema(implementation = com.example.learnspring1.domain.APIResponse.class)))
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public Product update(@PathVariable("id") Long id, @Valid @RequestBody Product input) {
        return productService.updateProduct(id, input);
    }

    @Operation(summary = "Xóa product (soft delete)")
    @ApiResponse(responseCode = "403", description = "Không có quyền", content = @Content(schema = @Schema(implementation = com.example.learnspring1.domain.APIResponse.class)))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
    }
}
