package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.Category;
import com.example.learnspring1.domain.Order;
import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.ProductVariant;
import com.example.learnspring1.domain.VariantType;
import com.example.learnspring1.repository.CategoryRepository;
import com.example.learnspring1.repository.OrderItemRepository;
import com.example.learnspring1.repository.ProductRepository;
import com.example.learnspring1.repository.ProductVariantRepository;
import com.example.learnspring1.service.AiVectorService;
import com.example.learnspring1.service.CategoryService;
import com.example.learnspring1.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final AiVectorService aiVectorService;

    public ProductServiceImpl(ProductRepository productRepository,
            OrderItemRepository orderItemRepository,
            CategoryService categoryService,
            CategoryRepository categoryRepository,
            ProductVariantRepository productVariantRepository,
            AiVectorService aiVectorService) {
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.categoryService = categoryService;
        this.categoryRepository = categoryRepository;
        this.productVariantRepository = productVariantRepository;
        this.aiVectorService = aiVectorService;
    }

    private void ensureDefaultVariant(Product product) {
        List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
        if (variants != null && !variants.isEmpty()) {
            return;
        }

        // Xử lý giá: ưu tiên discountPrice, nếu không có thì dùng price, nếu không có thì 0
        BigDecimal variantPrice = product.getDiscountPrice() != null 
                ? product.getDiscountPrice() 
                : (product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO);
        
        ProductVariant defaultVariant = ProductVariant.builder()
                .product(product)
                .variantType(VariantType.OTHER)
                .variantValue("Default")
                .colorCode(null)
                .imageUrl(product.getThumbnailUrl())
                .price(variantPrice)
                .stockQuantity(0)
                .sku(product.getSku() != null ? product.getSku() : ("SKU-" + product.getId()))
                .sortOrder(0)
                .isActive(true)
                .isDefault(true)
                .build();

        productVariantRepository.save(defaultVariant);
    }

    private void syncDefaultVariant(Product product) {
        List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
        if (variants == null || variants.isEmpty()) {
            ensureDefaultVariant(product);
            return;
        }

        // Nếu chỉ có default variant hoặc tất cả là default, sync giá/tồn cho default
        variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsDefault()))
                .findFirst()
                .ifPresent(v -> {
                    // Xử lý giá: ưu tiên discountPrice, nếu không có thì dùng price, nếu không có thì giữ nguyên giá variant
                    BigDecimal newPrice = product.getDiscountPrice() != null 
                            ? product.getDiscountPrice() 
                            : (product.getPrice() != null ? product.getPrice() : v.getPrice());
                    v.setPrice(newPrice);
                    if (product.getThumbnailUrl() != null) {
                        v.setImageUrl(product.getThumbnailUrl());
                    }
                    if (product.getSku() != null) {
                        v.setSku(product.getSku());
                    }
                    productVariantRepository.save(v);
                });
    }

    @Override
    public Product createProduct(Product product) {
        if (product.getSku() != null && productRepository.existsBySku(product.getSku())) {
            throw new IllegalArgumentException("SKU đã tồn tại");
        }

        // Xử lý categories từ categoryIds hoặc categories
        if (product.getCategoryIds() != null && !product.getCategoryIds().isEmpty()) {
            // Load categories từ categoryIds
            List<Category> categories = categoryRepository.findAllById(product.getCategoryIds());
            product.setCategories(categories);
        }

        // Lưu variants tạm thời nếu có
        List<ProductVariant> variantsToSave = product.getVariants();
        product.setVariants(new ArrayList<>()); // Tạm thời clear để save product trước

        Product saved = productRepository.save(product);

        // Xử lý variants: bắt buộc phải có ít nhất 1 variant
        if (variantsToSave != null && !variantsToSave.isEmpty()) {
            // Set product reference cho tất cả variants
            for (ProductVariant variant : variantsToSave) {
                variant.setProduct(saved);
            }
            // Đảm bảo có ít nhất 1 variant là default
            boolean hasDefault = variantsToSave.stream()
                    .anyMatch(v -> Boolean.TRUE.equals(v.getIsDefault()));
            if (!hasDefault) {
                variantsToSave.get(0).setIsDefault(true);
            }
            // Lưu tất cả variants
            productVariantRepository.saveAll(variantsToSave);
        } else {
            // Nếu không có variant, tạo default variant
            ensureDefaultVariant(saved);
        }

        // Reload để có variants
        return productRepository.findById(saved.getId())
                .orElseThrow(() -> new RuntimeException("Failed to reload product after creation"));
    }

    @Override
    public Page<Product> getProductsPage(Pageable pageable, Specification<Product> spec) {
        return productRepository.findAll(spec, pageable);
    }

    @Override
    public Page<Product> getProductsPage(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable);
    }

    @Override
    public Page<Product> getProductsPageWithFilters(Pageable pageable,
            Long id,
            String name,
            String sku,
            String brand,
            Long categoryId,
            Boolean isFeatured,
            Boolean isActive,
            String search) {
        if (id != null) {
            return productRepository.findProductsByIdOnly(String.valueOf(id), pageable);
        }

        // Get all descendant category IDs if categoryId is provided
        List<Long> categoryIds = new ArrayList<>();
        if (categoryId != null) {
            categoryIds = categoryService.getAllDescendantIds(categoryId);
        }

        return productRepository.findProductsWithFiltersPaged(
                name, sku, brand, categoryId, categoryIds, isFeatured, isActive, search, pageable);
    }

    @Override
    public List<Product> getProductsWithFilters(String name, String sku, String brand, Long categoryId,
            Boolean isFeatured, Boolean isActive) {
        // Get all descendant category IDs if categoryId is provided
        List<Long> categoryIds = new ArrayList<>();
        if (categoryId != null) {
            categoryIds = categoryService.getAllDescendantIds(categoryId);
        }

        return productRepository.findProductsWithFilters(
                name, sku, brand, categoryId, categoryIds, isFeatured, isActive);
    }

    @Override
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    @Override
    public Optional<Product> getProductByIdWithImages(Long id) {
        return productRepository.findByIdWithImages(id);
    }

    @Override
    public Optional<Product> getProductBySku(String sku) {
        return productRepository.findBySku(sku);
    }

    @Override
    public Product updateProduct(Long id, Product product) {
        return productRepository.findById(id).map(existing -> {
            existing.setName(product.getName());
            existing.setDescription(product.getDescription());
            existing.setPrice(product.getPrice());
            existing.setDiscountPrice(product.getDiscountPrice());
            existing.setSku(product.getSku());
            existing.setBrand(product.getBrand());
            existing.setColor(product.getColor());
            existing.setSize(product.getSize());
            existing.setWeight(product.getWeight());
            existing.setDimensions(product.getDimensions());
            existing.setSpecifications(product.getSpecifications());
            existing.setThumbnailUrl(product.getThumbnailUrl());

            // Xử lý categories từ categoryIds hoặc categories
            if (product.getCategoryIds() != null && !product.getCategoryIds().isEmpty()) {
                // Load categories từ categoryIds
                List<Category> categories = categoryRepository.findAllById(product.getCategoryIds());
                existing.setCategories(categories);
            } else if (product.getCategories() != null) {
                // Nếu có categories trực tiếp thì dùng
                existing.setCategories(product.getCategories());
            }

            existing.setIsActive(product.getIsActive());
            existing.setIsFeatured(product.getIsFeatured());
            Product updated = productRepository.save(existing);

            // Kiểm tra và đảm bảo có ít nhất 1 variant active sau khi update
            List<ProductVariant> currentVariants = productVariantRepository.findByProductId(id);
            List<ProductVariant> activeVariants = currentVariants.stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsActive()) && v.getDeletedBy() == null)
                    .collect(Collectors.toList());

            if (activeVariants.isEmpty()) {
                // Nếu không còn variant active nào, tạo default variant mới
                ensureDefaultVariant(updated);
            } else {
                // Đảm bảo có ít nhất 1 variant là default
                boolean hasDefault = activeVariants.stream()
                        .anyMatch(v -> Boolean.TRUE.equals(v.getIsDefault()));
                if (!hasDefault) {
                    ProductVariant firstActive = activeVariants.get(0);
                    firstActive.setIsDefault(true);
                    productVariantRepository.save(firstActive);
                }
                // Đồng bộ default variant khi sản phẩm không có biến thể tùy chọn
                syncDefaultVariant(updated);
            }

            return updated;
        }).orElseThrow(() -> new RuntimeException("Product not found with id " + id));
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Product not found with id " + id));
        
        // Soft delete product
        product.softDelete();
        productRepository.save(product);
        
        // Soft delete tất cả variants của product này (chưa bị xóa)
        List<ProductVariant> variants = productVariantRepository.findByProductId(id);
        for (ProductVariant variant : variants) {
            if (variant.getDeletedBy() == null) {
                variant.softDelete(); // Method tự động lấy user từ SecurityUtil
                productVariantRepository.save(variant);
            }
        }
    }

    @Override
    public Page<Product> getBestSellers(Pageable pageable) {
        // Best seller: dựa trên tổng quantity của OrderItem trong 90 ngày gần nhất
        // và chỉ tính các đơn hàng COMPLETED.
        Instant fromDate = Instant.now().minus(90, ChronoUnit.DAYS);
        return orderItemRepository.findBestSellers(Order.OrderStatus.COMPLETED, fromDate, pageable);
    }

    @Override
    public List<Product> suggestProducts(String query, Long categoryId, int limit) {
        int size = Math.max(1, Math.min(limit, 20));

        // Lấy toàn bộ id con của category (nếu có) để ưu tiên phù hợp ngữ cảnh
        List<Long> categoryIds = new ArrayList<>();
        if (categoryId != null) {
            categoryIds = categoryService.getAllDescendantIds(categoryId);
        }

        Pageable primaryPageable = PageRequest.of(
                0,
                size,
                Sort.by(Sort.Direction.DESC, "isFeatured").and(Sort.by(Sort.Direction.DESC, "createdAt")));

        Page<Product> primaryCandidates = productRepository.findProductsWithFiltersPaged(
                null, // name
                null, // sku
                null, // brand
                categoryId,
                categoryIds,
                true, // isFeatured ưu tiên
                true, // isActive
                query,
                primaryPageable);

        Set<Long> seenIds = new HashSet<>();
        List<Product> suggestions = new ArrayList<>();

        primaryCandidates.getContent().forEach(product -> {
            if (product.getId() != null && seenIds.add(product.getId())) {
                suggestions.add(product);
            }
        });

        if (suggestions.size() < size) {
            Page<Product> bestSellerCandidates = getBestSellers(
                    PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "id")));
            bestSellerCandidates.getContent().forEach(product -> {
                if (product.getId() != null && seenIds.add(product.getId())) {
                    suggestions.add(product);
                }
            });
        }

        if (suggestions.size() < size) {
            Page<Product> activeFallback = productRepository.findByIsActiveTrue(
                    PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "createdAt")));
            activeFallback.getContent().forEach(product -> {
                if (product.getId() != null && seenIds.add(product.getId())) {
                    suggestions.add(product);
                }
            });
        }

        return suggestions.subList(0, Math.min(suggestions.size(), size));
    }

    /**
     * Mở rộng query với synonyms để cải thiện kết quả tìm kiếm
     */
    private String expandQueryWithSynonyms(String query) {
        if (query == null || query.isBlank()) {
            return query;
        }
        
        String lowerQuery = query.toLowerCase().trim();
        
        // Map synonyms: từ khóa -> các từ đồng nghĩa
        Map<String, String> synonyms = Map.of(
            "cặp", "cặp balo túi sách cặp học sinh ba lô",
            "balo", "balo cặp túi sách ba lô",
            "túi", "túi balo cặp túi sách",
            "bút", "bút viết bút bi bút mực",
            "sổ", "sổ tay vở sổ ghi chép",
            "chuột", "chuột máy tính mouse",
            "bàn phím", "bàn phím keyboard",
            "màu", "màu vẽ màu sáp màu nước",
            "cọ", "cọ vẽ brush",
            "giấy", "giấy vẽ giấy màu"
        );
        
        // Tìm synonyms và thêm vào query
        for (Map.Entry<String, String> entry : synonyms.entrySet()) {
            if (lowerQuery.contains(entry.getKey())) {
                return query + " " + entry.getValue();
            }
        }
        
        return query;
    }

    @Override
    public List<Product> suggestProductsByVector(String query, Long categoryId, int limit) {
        int size = Math.max(1, Math.min(limit, 20));
        if (query == null || query.isBlank()) {
            return suggestProducts("", categoryId, size);
        }

        // Mở rộng query với synonyms để cải thiện kết quả
        String expandedQuery = expandQueryWithSynonyms(query.trim());
        List<Double> embedding = aiVectorService.embedWithGemini(expandedQuery);
        var chromaResp = aiVectorService.queryChroma(embedding, categoryId, size);
        if (chromaResp == null || chromaResp.ids == null || chromaResp.ids.isEmpty()) {
            return suggestProducts(query, categoryId, size);
        }

        List<String> idStrings = chromaResp.ids.get(0);
        List<Long> ids = idStrings.stream()
                .map(id -> {
                    try {
                        return Long.parseLong(id);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                })
                .filter(v -> v != null)
                .collect(Collectors.toList());

        if (ids.isEmpty()) {
            return suggestProducts(query, categoryId, size);
        }

        List<Product> fetched = productRepository.findAllById(ids);
        List<Product> ordered = new ArrayList<>();
        for (Long id : ids) {
            fetched.stream().filter(p -> p.getId().equals(id)).findFirst().ifPresent(ordered::add);
            if (ordered.size() >= size) {
                break;
            }
        }
        return ordered;
    }

    @Override
    public List<Product> suggestProductsByUserHistory(List<Long> viewedProductIds, Long categoryId, int limit) {
        int size = Math.max(1, Math.min(limit, 20));
        
        if (viewedProductIds == null || viewedProductIds.isEmpty()) {
            return getBestSellers(PageRequest.of(0, size)).getContent();
        }

        try {
            List<String> productIdStrings = viewedProductIds.stream()
                    .map(String::valueOf)
                    .collect(Collectors.toList());

            List<List<Double>> embeddings;
            try {
                embeddings = aiVectorService.getEmbeddingsByProductIds(productIdStrings);
            } catch (Exception e) {
                return getBestSellers(PageRequest.of(0, size)).getContent();
            }
            
            if (embeddings == null || embeddings.isEmpty()) {
                return getBestSellers(PageRequest.of(0, size)).getContent();
            }
            
            List<List<Double>> validEmbeddings = embeddings.stream()
                    .filter(e -> e != null && !e.isEmpty())
                    .collect(Collectors.toList());
            
            if (validEmbeddings.isEmpty()) {
                return getBestSellers(PageRequest.of(0, size)).getContent();
            }

            List<Double> averageEmbedding = aiVectorService.averageVectors(validEmbeddings);
            var chromaResp = aiVectorService.queryChroma(averageEmbedding, categoryId, size * 5);
            
            if (chromaResp == null || chromaResp.ids == null || chromaResp.ids.isEmpty()) {
                return getBestSellers(PageRequest.of(0, size)).getContent();
            }

            List<String> idStrings = chromaResp.ids.get(0);
            List<Double> distances = chromaResp.distances != null && !chromaResp.distances.isEmpty() 
                    ? chromaResp.distances.get(0) 
                    : Collections.emptyList();

            List<Long> ids = new ArrayList<>();
            for (int i = 0; i < idStrings.size() && ids.size() < size * 2; i++) {
                try {
                    Long productId = Long.parseLong(idStrings.get(i));
                    if (viewedProductIds.contains(productId)) {
                        continue;
                    }
                    if (i < distances.size() && distances.get(i) > 0.6) {
                        continue;
                    }
                    ids.add(productId);
                } catch (NumberFormatException e) {
                    // Skip invalid IDs
                }
            }
            
            if (!distances.isEmpty() && ids.size() > 1) {
                Map<Long, Double> distanceMap = new java.util.HashMap<>();
                for (int i = 0; i < idStrings.size(); i++) {
                    try {
                        Long pid = Long.parseLong(idStrings.get(i));
                        if (ids.contains(pid) && i < distances.size()) {
                            distanceMap.put(pid, distances.get(i));
                        }
                    } catch (NumberFormatException ignored) {}
                }
                ids.sort(Comparator.comparingDouble(pid -> distanceMap.getOrDefault(pid, 999.0)));
            }

            if (ids.isEmpty()) {
                return getBestSellers(PageRequest.of(0, size)).getContent();
            }

            List<Product> fetched = productRepository.findAllById(ids);
            Map<Long, Product> productMap = fetched.stream()
                    .collect(Collectors.toMap(Product::getId, p -> p));

            List<Product> ordered = new ArrayList<>();
            for (Long id : ids) {
                Product p = productMap.get(id);
                if (p != null && Boolean.TRUE.equals(p.getIsActive())) {
                    ordered.add(p);
                }
                if (ordered.size() >= size) {
                    break;
                }
            }

            return ordered;
        } catch (Exception e) {
            return getBestSellers(PageRequest.of(0, size)).getContent();
        }
    }
}
