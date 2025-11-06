package com.example.learnspring1.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.*;

import com.example.learnspring1.domain.ProductImage;
import com.example.learnspring1.service.ProductImageService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/product-images")
@Tag(name = "ProductImage", description = "Quản lý ảnh sản phẩm")
@SecurityRequirement(name = "Bearer Authentication")
public class ProductImageController {

    private final ProductImageService productImageService;

    public ProductImageController(ProductImageService productImageService) {
        this.productImageService = productImageService;
    }

    @Operation(summary = "Tạo mới ảnh sản phẩm")
    @PostMapping
    public ProductImage create(@Valid @RequestBody ProductImage input) {
        return productImageService.create(input);
    }

    @Operation(summary = "Lấy ảnh theo id")
    @GetMapping("/{id}")
    public ProductImage getById(@PathVariable("id") Long id) {
        return productImageService.getById(id)
            .orElseThrow(() -> new java.util.NoSuchElementException("ProductImage not found with id " + id));
    }

    @Operation(summary = "Cập nhật ảnh sản phẩm")
    @PutMapping("/{id}")
    public ProductImage update(@PathVariable("id") Long id, @Valid @RequestBody ProductImage input) {
        return productImageService.update(id, input);
    }

    @Operation(summary = "Xóa ảnh sản phẩm (soft delete)")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Long id) {
        productImageService.delete(id);
    }

    @Operation(summary = "Lấy danh sách ảnh theo productId")
    @GetMapping
    public java.util.List<ProductImage> getByProduct(@RequestParam("productId") Long productId) {
        return productImageService.getByProductId(productId);
    }
}


