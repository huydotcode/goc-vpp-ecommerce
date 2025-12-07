package com.example.learnspring1.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.learnspring1.domain.ProductVariant;
import com.example.learnspring1.domain.VariantType;
import com.example.learnspring1.domain.dto.PaginatedResponseDTO;
import com.example.learnspring1.domain.dto.MetadataDTO;
import com.example.learnspring1.domain.dto.ProductVariantDTO;
import com.example.learnspring1.service.ProductVariantService;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/product-variants")
@Tag(name = "Product Variant", description = "Quản lý biến thể sản phẩm")
@SecurityRequirement(name = "Bearer Authentication")
public class ProductVariantController {

    private final ProductVariantService variantService;

    public ProductVariantController(ProductVariantService variantService) {
        this.variantService = variantService;
    }

    @Operation(summary = "Tạo mới variant")
    @ApiResponse(responseCode = "200", description = "Tạo variant thành công")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<ProductVariantDTO> create(@Valid @RequestBody ProductVariantDTO input) {
        ProductVariantDTO created = variantService.createVariantDTO(input);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Lấy danh sách variant theo product ID")
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductVariantDTO>> getByProductId(
            @Parameter(description = "ID sản phẩm") @PathVariable Long productId,
            @Parameter(description = "Chỉ lấy variant active") @RequestParam(name = "activeOnly", defaultValue = "false") boolean activeOnly) {
        List<ProductVariant> variants = activeOnly 
            ? variantService.getActiveVariantsByProductId(productId)
            : variantService.getVariantsByProductId(productId);
        List<ProductVariantDTO> dtos = variants.stream()
                .map(variantService::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @Operation(summary = "Lấy variant theo ID")
    @GetMapping("/{id}")
    public ResponseEntity<ProductVariantDTO> getById(@PathVariable Long id) {
        ProductVariant variant = variantService.getVariantById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy variant với ID: " + id));
        return ResponseEntity.ok(variantService.convertToDTO(variant));
    }

    @Operation(summary = "Phân trang + lọc variant")
    @GetMapping("/advanced")
    public PaginatedResponseDTO<ProductVariantDTO> getAdvanced(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "id") String sortField,
            @RequestParam(name = "direction", defaultValue = "ASC") String sortDirection,
            @RequestParam(name = "productId", required = false) Long productId,
            @RequestParam(name = "variantType", required = false) VariantType variantType,
            @RequestParam(name = "isActive", required = false) Boolean isActive) {
        Sort.Direction direction;
        if (sortDirection == null || sortDirection.isEmpty()) {
            direction = Sort.Direction.ASC;
        } else {
            try {
                direction = Sort.Direction.fromString(sortDirection);
            } catch (IllegalArgumentException e) {
                direction = Sort.Direction.ASC;
            }
        }
        Sort sort = Sort.by(direction, sortField);
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        Page<ProductVariant> result = variantService.getVariantsPage(pageable, productId, variantType, isActive);
        
        List<ProductVariantDTO> dtos = result.getContent().stream()
                .map(variantService::convertToDTO)
                .collect(Collectors.toList());

        MetadataDTO metadata = MetadataDTO.builder()
                .page(page)
                .size(size)
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .sortField(sortField)
                .sortDirection(sortDirection != null ? sortDirection : "ASC")
                .build();

        return PaginatedResponseDTO.<ProductVariantDTO>builder()
                .metadata(metadata)
                .result(dtos)
                .build();
    }

    @Operation(summary = "Cập nhật variant")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<ProductVariantDTO> update(@PathVariable Long id, @Valid @RequestBody ProductVariantDTO input) {
        ProductVariantDTO updated = variantService.updateVariantDTO(id, input);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Xóa variant (soft delete)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        variantService.deleteVariant(id);
        return ResponseEntity.noContent().build();
    }
}

