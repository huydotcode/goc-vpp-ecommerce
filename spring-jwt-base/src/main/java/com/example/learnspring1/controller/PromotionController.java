package com.example.learnspring1.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.learnspring1.domain.Promotion;
import com.example.learnspring1.domain.dto.PaginatedResponseDTO;
import com.example.learnspring1.domain.dto.MetadataDTO;
import com.example.learnspring1.domain.dto.PromotionRequestDTO;
import com.example.learnspring1.domain.dto.PromotionResponseDTO;
import com.example.learnspring1.service.PromotionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/promotions")
@Tag(name = "Promotion", description = "Manage promotion programs")
@SecurityRequirement(name = "Bearer Authentication")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @Operation(summary = "Create a promotion program")
    @ApiResponse(responseCode = "200", description = "Promotion created successfully",
            content = @Content(schema = @Schema(implementation = Promotion.class)))
    @PostMapping
    public Promotion createPromotion(@Valid @RequestBody PromotionRequestDTO request) {
        return promotionService.createPromotion(request);
    }

    @Operation(summary = "Update a promotion program")
    @ApiResponse(responseCode = "200", description = "Promotion updated successfully",
            content = @Content(schema = @Schema(implementation = Promotion.class)))
    @PutMapping("/{id}")
    public Promotion updatePromotion(@PathVariable("id") Long id, @Valid @RequestBody PromotionRequestDTO request) {
        return promotionService.updatePromotion(id, request);
    }

    @Operation(summary = "Phân trang + lọc nâng cao")
    @GetMapping("/advanced")
    public PaginatedResponseDTO<PromotionResponseDTO> getAdvanced(
            @Parameter(description = "Trang hiện tại", example = "1") @RequestParam(name = "page", defaultValue = "1") int page,
            @Parameter(description = "Số lượng mỗi trang", example = "10") @RequestParam(name = "size", defaultValue = "10") int size,
            @Parameter(description = "Trường để sort", example = "id") @RequestParam(name = "sort", defaultValue = "id") String sortField,
            @Parameter(description = "Hướng sort (asc/desc)", example = "asc") @RequestParam(name = "direction", defaultValue = "ASC") String sortDirection,
            @Parameter(description = "ID để filter", example = "1") @RequestParam(name = "id", required = false) Long id,
            @Parameter(description = "Tên để filter", example = "Promotion") @RequestParam(name = "name", required = false) String name,
            @Parameter(description = "Trạng thái active", example = "true") @RequestParam(name = "isActive", required = false) Boolean isActive,
            @Parameter(description = "Search term", example = "promotion") @RequestParam(name = "search", required = false) String search) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortField);
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        Page<Promotion> result = promotionService.getPromotionsPageWithFilters(pageable, id, name, isActive, search);
        MetadataDTO metadata = MetadataDTO.builder()
                .page(page)
                .size(size)
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .sortField(sortField)
                .sortDirection(sortDirection)
                .build();
        List<PromotionResponseDTO> responseDTOs = result.getContent().stream()
                .map(PromotionResponseDTO::fromEntity)
                .toList();
        return PaginatedResponseDTO.<PromotionResponseDTO>builder()
                .metadata(metadata)
                .result(responseDTOs)
                .build();
    }

    @Operation(summary = "Get promotion details")
    @GetMapping("/{id}")
    public PromotionResponseDTO getPromotion(@PathVariable("id") Long id) {
        Promotion promotion = promotionService.getPromotion(id);
        return PromotionResponseDTO.fromEntity(promotion);
    }

    @Operation(summary = "Get active promotions")
    @GetMapping("/active")
    public List<PromotionResponseDTO> getActivePromotions() {
        return promotionService.getActivePromotions().stream()
                .map(PromotionResponseDTO::fromEntity)
                .toList();
    }
}

