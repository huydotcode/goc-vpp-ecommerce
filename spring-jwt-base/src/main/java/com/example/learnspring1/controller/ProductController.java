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
import org.springframework.web.bind.annotation.*;

import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.dto.PaginatedResponseDTO;
import com.example.learnspring1.domain.dto.MetadataDTO;
import com.example.learnspring1.service.ProductService;
 

import jakarta.validation.Valid;

@RestController
@RequestMapping("/products")
@Tag(name = "Product", description = "Quản lý sản phẩm")
@SecurityRequirement(name = "Bearer Authentication")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @Operation(summary = "Tạo mới product")
    @ApiResponse(responseCode = "200", description = "Tạo product thành công",
        content = @Content(schema = @Schema(implementation = Product.class)))
    @PostMapping
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
            @RequestParam(name = "isActive", required = false) Boolean isActive,
            @RequestParam(name = "search", required = false) String search
    ) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortField);
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        Page<Product> result = productService.getProductsPageWithFilters(pageable, id, name, sku, brand, isActive, search);
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

    @Operation(summary = "Lấy product theo id")
    @GetMapping("/{id}")
    public Product getById(@PathVariable("id") Long id) {
        return productService.getProductByIdWithImages(id)
            .orElseThrow(() -> new java.util.NoSuchElementException("Product not found with id " + id));
    }

    @Operation(summary = "Cập nhật product")
    @PutMapping("/{id}")
    public Product update(@PathVariable("id") Long id, @Valid @RequestBody Product input) {
        return productService.updateProduct(id, input);
    }

    @Operation(summary = "Xóa product (soft delete)")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
    }
}


