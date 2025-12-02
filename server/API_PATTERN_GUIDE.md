# 📚 Hướng dẫn Pattern API - Spring Boot Backend

## 📋 Mục lục
1. [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
2. [Response Format](#response-format)
3. [Controller Pattern](#controller-pattern)
4. [Service Pattern](#service-pattern)
5. [Repository Pattern](#repository-pattern)
6. [DTO Pattern](#dto-pattern)
7. [Ví dụ hoàn chỉnh](#ví-dụ-hoàn-chỉnh)
8. [Best Practices](#best-practices)

---

## 🏗️ Kiến trúc tổng quan

### Layered Architecture
```
Controller (REST API)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Database (MariaDB)
```

### Flow xử lý request
```
1. Client → Controller (nhận request, validate)
2. Controller → Service (xử lý business logic)
3. Service → Repository (truy vấn database)
4. Repository → Database
5. Database → Repository → Service → Controller → Client
```

---

## 📦 Response Format

### 1. Standard API Response (`APIResponse<T>`)

**Cấu trúc:**
```java
{
  "status": "success" | "error",
  "message": "Mô tả kết quả",
  "data": <T>,  // Dữ liệu trả về (có thể null)
  "errorCode": "Mã lỗi (nếu có)",
  "timestamp": "2025-01-15T10:30:00"
}
```

**Ví dụ Success:**
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "name": "Product Name"
  },
  "errorCode": null,
  "timestamp": "2025-01-15T10:30:00"
}
```

**Ví dụ Error:**
```json
{
  "status": "error",
  "message": "Dữ liệu không hợp lệ",
  "data": null,
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2025-01-15T10:30:00"
}
```

### 2. Paginated Response (`PaginatedResponseDTO<T>`)

**Cấu trúc:**
```java
{
  "metadata": {
    "page": 1,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10,
    "first": true,
    "last": false,
    "empty": false,
    "sortField": "name",
    "sortDirection": "asc",
    "numberOfElements": 10
  },
  "result": [
    { ... }, // List of items
    { ... }
  ]
}
```

### 3. Login Response (`ResponseLoginDTO`)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Optional
}
```

---

## 🎮 Controller Pattern

### Cấu trúc cơ bản

```java
@RestController
@RequestMapping("/resources")  // Base path
@Tag(name = "Resource", description = "Mô tả resource")
@SecurityRequirement(name = "Bearer Authentication")  // Yêu cầu JWT
public class ResourceController {

    private final ResourceService resourceService;

    // Constructor injection
    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    // CRUD operations...
}
```

### 1. CREATE - POST

```java
@Operation(
    summary = "Tạo mới resource",
    description = "Mô tả chi tiết..."
)
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Thành công",
        content = @Content(schema = @Schema(implementation = ResourceDTO.class))),
    @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ",
        content = @Content(schema = @Schema(implementation = APIResponse.class))),
    @ApiResponse(responseCode = "403", description = "Không có quyền",
        content = @Content(schema = @Schema(implementation = APIResponse.class)))
})
@PostMapping
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")  // Role-based access
public ResourceDTO create(
    @Validated(CreateValidation.class) @RequestBody Resource input
) {
    Resource resource = this.resourceService.createResource(input);
    return toDTO(resource);
}
```

### 2. READ - GET (Single)

```java
@Operation(summary = "Lấy resource theo ID")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Thành công"),
    @ApiResponse(responseCode = "404", description = "Không tìm thấy")
})
@GetMapping("/{id}")
public ResourceDTO getById(
    @Parameter(description = "ID của resource", example = "1")
    @PathVariable("id") Long id
) {
    Resource resource = resourceService.getResourceById(id)
        .orElseThrow(() -> new NoSuchElementException("Resource not found with id " + id));
    return toDTO(resource);
}
```

### 3. READ - GET (List với Pagination)

```java
@Operation(summary = "Lấy danh sách với phân trang và filter")
@GetMapping("/advanced")
public PaginatedResponseDTO<ResourceDTO> getAdvanced(
    @Parameter(description = "Trang hiện tại", example = "1")
    @RequestParam(name = "page", defaultValue = "1") int page,
    
    @Parameter(description = "Số lượng mỗi trang", example = "10")
    @RequestParam(name = "size", defaultValue = "10") int size,
    
    @Parameter(description = "Trường để sort", example = "name")
    @RequestParam(name = "sort", defaultValue = "id") String sortField,
    
    @Parameter(description = "Hướng sort (asc/desc)", example = "asc")
    @RequestParam(name = "direction", defaultValue = "asc") String direction,
    
    @Parameter(description = "ID để filter", example = "1")
    @RequestParam(name = "id", required = false) Long id,
    
    @Parameter(description = "Tên để filter", example = "test")
    @RequestParam(name = "name", required = false) String name,
    
    @Parameter(description = "Trạng thái active", example = "true")
    @RequestParam(name = "isActive", required = false) Boolean isActive,
    
    @Parameter(description = "Search term", example = "keyword")
    @RequestParam(name = "search", required = false) String search
) {
    // Validate parameters
    page = Math.max(1, page);
    size = Math.min(Math.max(5, size), 100); // Min 5, Max 100
    
    // Validate sort field
    String[] allowedSortFields = {"id", "name", "createdAt", "updatedAt"};
    String validSortField = sortField;
    if (!java.util.Arrays.asList(allowedSortFields).contains(sortField)) {
        validSortField = "id"; // Default fallback
    }
    
    // Build sort
    Sort.Direction sortDirection = direction.equalsIgnoreCase("desc") 
        ? Sort.Direction.DESC 
        : Sort.Direction.ASC;
    Sort sort = Sort.by(sortDirection, validSortField);
    Pageable pageable = PageRequest.of(page - 1, size, sort);
    
    // Get data
    Page<ResourceDTO> resourcePage = resourceService
        .getResourcesPageWithFilters(pageable, id, name, isActive, search)
        .map(this::toDTO);
    
    // Build metadata
    MetadataDTO metadata = MetadataDTO.builder()
        .page(page)
        .size(size)
        .totalElements(resourcePage.getTotalElements())
        .totalPages(resourcePage.getTotalPages())
        .first(resourcePage.isFirst())
        .last(resourcePage.isLast())
        .empty(resourcePage.isEmpty())
        .sortField(validSortField)
        .sortDirection(direction)
        .numberOfElements(resourcePage.getNumberOfElements())
        .build();
    
    return PaginatedResponseDTO.<ResourceDTO>builder()
        .metadata(metadata)
        .result(resourcePage.getContent())
        .build();
}
```

### 4. UPDATE - PUT

```java
@Operation(summary = "Cập nhật resource")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
    @ApiResponse(responseCode = "404", description = "Không tìm thấy"),
    @ApiResponse(responseCode = "403", description = "Không có quyền")
})
@PutMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
public ResourceDTO update(
    @Parameter(description = "ID của resource", example = "1")
    @PathVariable("id") Long id,
    
    @Valid @RequestBody Resource resource
) {
    Resource updatedResource = resourceService.updateResource(id, resource);
    return toDTO(updatedResource);
}
```

### 5. DELETE - DELETE (Soft Delete)

```java
@Operation(summary = "Xóa resource (soft delete)")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Xóa thành công"),
    @ApiResponse(responseCode = "404", description = "Không tìm thấy"),
    @ApiResponse(responseCode = "403", description = "Không có quyền")
})
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public void delete(
    @Parameter(description = "ID của resource", example = "1")
    @PathVariable("id") Long id
) {
    resourceService.deleteResource(id);
}
```

### 6. DTO Converter (Private method trong Controller)

```java
// Chuyển Entity sang DTO (không trả về password, sensitive data)
private ResourceDTO toDTO(Resource resource) {
    if (resource == null) return null;
    return ResourceDTO.builder()
        .id(resource.getId())
        .name(resource.getName())
        .description(resource.getDescription())
        .isActive(resource.getIsActive())
        .createdAt(resource.getCreatedAt())
        .updatedAt(resource.getUpdatedAt())
        .createdBy(resource.getCreatedBy())
        .updatedBy(resource.getUpdatedBy())
        .deletedBy(resource.getDeletedBy())
        .build();
}
```

---

## 🔧 Service Pattern

### 1. Service Interface

```java
public interface ResourceService {
    Resource createResource(Resource resource);
    
    Page<Resource> getResourcesPage(Pageable pageable);
    
    Page<Resource> getResourcesPageWithFilters(
        Pageable pageable, 
        Long id, 
        String name, 
        Boolean isActive, 
        String search
    );
    
    List<Resource> getResourcesWithFilters(String name, Boolean isActive);
    
    Optional<Resource> getResourceById(Long id);
    
    Resource updateResource(Long id, Resource resource);
    
    void deleteResource(Long id);
}
```

### 2. Service Implementation

```java
@Service
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    // Constructor injection
    public ResourceServiceImpl(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Override
    public Resource createResource(Resource resource) {
        // Validation
        if (resourceRepository.existsByName(resource.getName())) {
            throw new IllegalArgumentException("Tên resource đã tồn tại");
        }
        
        // Business logic
        // Entity tự động set audit fields qua @PrePersist
        return resourceRepository.save(resource);
    }

    @Override
    public Page<Resource> getResourcesPage(Pageable pageable) {
        // Chỉ lấy active resources
        return resourceRepository.findByIsActiveTrue(pageable);
    }

    @Override
    public Page<Resource> getResourcesPageWithFilters(
        Pageable pageable, 
        Long id, 
        String name, 
        Boolean isActive, 
        String search
    ) {
        // ID filter có priority cao nhất
        if (id != null) {
            return resourceRepository.findResourcesByIdOnly(String.valueOf(id), pageable);
        }
        
        // Dynamic query với filters
        return resourceRepository.findResourcesWithFiltersPaged(
            name, isActive, search, pageable
        );
    }

    @Override
    public List<Resource> getResourcesWithFilters(String name, Boolean isActive) {
        return resourceRepository.findResourcesWithFilters(name, isActive);
    }

    @Override
    public Optional<Resource> getResourceById(Long id) {
        return resourceRepository.findById(id);
    }

    @Override
    public Resource updateResource(Long id, Resource resource) {
        return resourceRepository.findById(id).map(existing -> {
            // Update fields
            existing.setName(resource.getName());
            existing.setDescription(resource.getDescription());
            existing.setIsActive(resource.getIsActive());
            
            // Entity tự động set updatedBy, updatedAt qua @PreUpdate
            return resourceRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Resource not found with id " + id));
    }

    @Override
    public void deleteResource(Long id) {
        Resource resource = resourceRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Resource not found with id " + id));
        
        // Soft delete
        resource.softDelete();
        resourceRepository.save(resource);
    }
}
```

### 3. Complex Service (với Transaction)

```java
@Service
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional  // Đảm bảo atomicity
    public Promotion createPromotion(PromotionRequestDTO request) {
        // Validate
        PromotionRequestDTO safeRequest = Objects.requireNonNull(request, "promotion payload is required");

        // Build entity
        Promotion promotion = Promotion.builder()
            .name(safeRequest.getName())
            .discountType(safeRequest.getDiscountType())
            .discountAmount(resolveDiscountAmount(safeRequest))
            .build();

        // Build relationships
        buildConditions(promotion, safeRequest.getConditions());
        buildGiftItems(promotion, safeRequest);

        return promotionRepository.save(promotion);
    }

    private void buildConditions(Promotion promotion, List<ConditionGroupDTO> conditionGroups) {
        if (conditionGroups == null || conditionGroups.isEmpty()) {
            throw new IllegalArgumentException("At least one condition group is required");
        }

        for (ConditionGroupDTO groupDTO : conditionGroups) {
            PromotionCondition condition = PromotionCondition.builder()
                .operator(groupDTO.getOperator())
                .build();
            promotion.addCondition(condition);

            for (ConditionDetailDTO detailDTO : groupDTO.getDetails()) {
                Product product = productRepository.findById(detailDTO.getProductId())
                    .orElseThrow(() -> new NoSuchElementException("Product not found"));
                
                PromotionConditionDetail detail = PromotionConditionDetail.builder()
                    .product(product)
                    .requiredQuantity(detailDTO.getRequiredQuantity())
                    .build();
                condition.addDetail(detail);
            }
        }
    }
}
```

---

## 💾 Repository Pattern

### 1. Basic Repository

```java
@Repository
public interface ResourceRepository 
    extends JpaRepository<Resource, Long>, 
            JpaSpecificationExecutor<Resource> {

    // Spring Data JPA tự động implement
    Optional<Resource> findByName(String name);
    boolean existsByName(String name);
    
    // Filter by isActive
    List<Resource> findByIsActiveTrue();
    Page<Resource> findByIsActiveTrue(Pageable pageable);
}
```

### 2. Custom Query với @Query

```java
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    // Custom query với filters (không pagination)
    @Query("SELECT r FROM Resource r WHERE " +
           "(:name IS NULL OR r.name LIKE %:name%) AND " +
           "(:isActive IS NULL OR r.isActive = :isActive) AND " +
           "(r.deletedBy IS NULL)")
    List<Resource> findResourcesWithFilters(
        @Param("name") String name, 
        @Param("isActive") Boolean isActive
    );

    // Custom query với filters + pagination
    @Query("SELECT r FROM Resource r WHERE " +
           "(:name IS NULL OR r.name LIKE %:name%) AND " +
           "(:isActive IS NULL OR r.isActive = :isActive) AND " +
           "(:search IS NULL OR r.name LIKE %:search% OR CAST(r.id AS string) LIKE %:search%) AND " +
           "(r.deletedBy IS NULL)")
    Page<Resource> findResourcesWithFiltersPaged(
        @Param("name") String name, 
        @Param("isActive") Boolean isActive,
        @Param("search") String search,
        Pageable pageable
    );

    // ID filter có priority cao nhất
    @Query("SELECT r FROM Resource r WHERE " +
           "CAST(r.id AS string) LIKE %:id% AND " +
           "(r.deletedBy IS NULL)")
    Page<Resource> findResourcesByIdOnly(
        @Param("id") String id, 
        Pageable pageable
    );
}
```

### 3. Complex Query với JOIN

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Query với JOIN để filter theo category
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN p.categories c WHERE " +
           "(:name IS NULL OR p.name LIKE %:name%) AND " +
           "(:categoryId IS NULL OR c.id = :categoryId) AND " +
           "(:isActive IS NULL OR p.isActive = :isActive) AND " +
           "(p.deletedBy IS NULL)")
    Page<Product> findProductsWithFiltersPaged(
        @Param("name") String name,
        @Param("categoryId") Long categoryId,
        @Param("isActive") Boolean isActive,
        Pageable pageable
    );

    // Query với JOIN FETCH để load eager relationships
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id = :id")
    Optional<Product> findByIdWithImages(@Param("id") Long id);
}
```

---

## 📝 DTO Pattern

### 1. Request DTO (Input)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceRequestDTO {
    
    @NotBlank(message = "name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "isActive is required")
    private Boolean isActive;
    
    // Nested DTOs
    @Builder.Default
    @Valid
    private List<SubResourceDTO> subResources = new ArrayList<>();
}
```

### 2. Response DTO (Output)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceDTO {
    private Long id;
    private String name;
    private String description;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    private String deletedBy;
}
```

### 3. Complex Response DTO với Static Factory

```java
public class PromotionResponseDTO {
    private Long id;
    private String name;
    private List<ConditionDTO> conditions;
    private List<GiftItemDTO> giftItems;

    // Static factory method
    public static PromotionResponseDTO fromEntity(Promotion promotion) {
        if (promotion == null) {
            return null;
        }

        List<ConditionDTO> conditionDTOs = promotion.getConditions().stream()
            .map(ConditionDTO::fromEntity)
            .toList();

        List<GiftItemDTO> giftDTOs = promotion.getGiftItems().stream()
            .map(GiftItemDTO::fromEntity)
            .toList();

        return new PromotionResponseDTO(
            promotion.getId(),
            promotion.getName(),
            conditionDTOs,
            giftDTOs
        );
    }

    // Nested DTOs
    public static class ConditionDTO {
        private Long id;
        private String operator;
        private List<ConditionDetailDTO> details;

        public static ConditionDTO fromEntity(PromotionCondition condition) {
            // Convert logic...
        }
    }
}
```

---

## 📋 Ví dụ hoàn chỉnh

### Entity: Category

```java
@Entity
@Table(name = "categories")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "name is required")
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String description;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Audit fields
    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Column(name = "created_by", length = 100, updatable = false)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    @PrePersist
    public void prePersist() {
        String user = SecurityUtil.getCurrentUserLogin().orElse("system");
        this.createdBy = user;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        String user = SecurityUtil.getCurrentUserLogin().orElse("system");
        this.updatedBy = user;
        this.updatedAt = Instant.now();
    }

    public void softDelete() {
        String user = SecurityUtil.getCurrentUserLogin().orElse("system");
        this.deletedBy = user;
        this.isActive = false;
    }
}
```

### Repository: CategoryRepository

```java
@Repository
public interface CategoryRepository 
    extends JpaRepository<Category, Long>, 
            JpaSpecificationExecutor<Category> {

    Optional<Category> findByName(String name);
    boolean existsByName(String name);
    
    List<Category> findByIsActiveTrue();
    Page<Category> findByIsActiveTrue(Pageable pageable);
    
    @Query("SELECT c FROM Category c WHERE " +
           "(:name IS NULL OR c.name LIKE %:name%) AND " +
           "(:isActive IS NULL OR c.isActive = :isActive) AND " +
           "(c.deletedBy IS NULL)")
    List<Category> findCategoriesWithFilters(
        @Param("name") String name, 
        @Param("isActive") Boolean isActive
    );

    @Query("SELECT c FROM Category c WHERE " +
           "(:name IS NULL OR c.name LIKE %:name%) AND " +
           "(:isActive IS NULL OR c.isActive = :isActive) AND " +
           "(:search IS NULL OR c.name LIKE %:search% OR CAST(c.id AS string) LIKE %:search%) AND " +
           "(c.deletedBy IS NULL)")
    Page<Category> findCategoriesWithFiltersPaged(
        @Param("name") String name, 
        @Param("isActive") Boolean isActive,
        @Param("search") String search,
        Pageable pageable
    );

    @Query("SELECT c FROM Category c WHERE " +
           "CAST(c.id AS string) LIKE %:id% AND " +
           "(c.deletedBy IS NULL)")
    Page<Category> findCategoriesByIdOnly(
        @Param("id") String id, 
        Pageable pageable
    );
}
```

### Service: CategoryService & CategoryServiceImpl

```java
// Interface
public interface CategoryService {
    Category createCategory(Category category);
    Page<Category> getCategoriesPage(Pageable pageable);
    Page<Category> getCategoriesPageWithFilters(Pageable pageable, Long id, String name, Boolean isActive, String search);
    List<Category> getCategoriesWithFilters(String name, Boolean isActive);
    Optional<Category> getCategoryById(Long id);
    Category updateCategory(Long id, Category category);
    void deleteCategory(Long id);
}

// Implementation
@Service
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Category createCategory(Category category) {
        if (categoryRepository.existsByName(category.getName())) {
            throw new IllegalArgumentException("Tên category đã tồn tại");
        }
        return categoryRepository.save(category);
    }

    @Override
    public Page<Category> getCategoriesPage(Pageable pageable) {
        return categoryRepository.findByIsActiveTrue(pageable);
    }

    @Override
    public Page<Category> getCategoriesPageWithFilters(Pageable pageable, Long id, String name, Boolean isActive, String search) {
        if (id != null) {
            return categoryRepository.findCategoriesByIdOnly(String.valueOf(id), pageable);
        }
        return categoryRepository.findCategoriesWithFiltersPaged(name, isActive, search, pageable);
    }

    @Override
    public List<Category> getCategoriesWithFilters(String name, Boolean isActive) {
        return categoryRepository.findCategoriesWithFilters(name, isActive);
    }

    @Override
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    @Override
    public Category updateCategory(Long id, Category category) {
        return categoryRepository.findById(id).map(existing -> {
            existing.setName(category.getName());
            existing.setDescription(category.getDescription());
            existing.setIsActive(category.getIsActive());
            return categoryRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Category not found with id " + id));
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Category not found with id " + id));
        category.softDelete();
        categoryRepository.save(category);
    }
}
```

### Controller: CategoryController

```java
@RestController
@RequestMapping("/categories")
@Tag(name = "Category", description = "Quản lý danh mục")
@SecurityRequirement(name = "Bearer Authentication")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public CategoryDTO createNewCategory(@Validated(CreateValidation.class) @RequestBody Category input) {
        Category category = this.categoryService.createCategory(input);
        return toDTO(category);
    }

    @GetMapping("/advanced")
    public PaginatedResponseDTO<CategoryDTO> getCategoriesAdvanced(
        @RequestParam(name = "page", defaultValue = "1") int page,
        @RequestParam(name = "size", defaultValue = "10") int size,
        @RequestParam(name = "sort", defaultValue = "id") String sortField,
        @RequestParam(name = "direction", defaultValue = "asc") String direction,
        @RequestParam(name = "id", required = false) Long id,
        @RequestParam(name = "name", required = false) String name,
        @RequestParam(name = "isActive", required = false) Boolean isActive,
        @RequestParam(name = "search", required = false) String search
    ) {
        // Validate & build pageable
        page = Math.max(1, page);
        size = Math.min(Math.max(5, size), 100);
        
        String[] allowedSortFields = {"id", "name", "createdAt", "updatedAt"};
        String validSortField = java.util.Arrays.asList(allowedSortFields).contains(sortField) 
            ? sortField : "id";
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("desc") 
            ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(sortDirection, validSortField);
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        
        // Get data
        Page<CategoryDTO> categoryPage = categoryService
            .getCategoriesPageWithFilters(pageable, id, name, isActive, search)
            .map(this::toDTO);
        
        // Build metadata
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

    @GetMapping("/{id}")
    public CategoryDTO getCategoryById(@PathVariable("id") Long id) {
        Category category = categoryService.getCategoryById(id)
            .orElseThrow(() -> new NoSuchElementException("Category not found with id " + id));
        return toDTO(category);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public CategoryDTO updateCategory(@PathVariable("id") Long id, @Valid @RequestBody Category category) {
        Category updatedCategory = categoryService.updateCategory(id, category);
        return toDTO(updatedCategory);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCategory(@PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
    }

    private CategoryDTO toDTO(Category category) {
        if (category == null) return null;
        return CategoryDTO.builder()
            .id(category.getId())
            .name(category.getName())
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
```

---

## ✅ Best Practices

### 1. Security
- ✅ Luôn dùng `@PreAuthorize` cho role-based access
- ✅ Validate input với `@Valid` và `@Validated`
- ✅ Không trả về password trong DTO
- ✅ Dùng `SecurityUtil.getCurrentUserLogin()` cho audit fields

### 2. Error Handling
- ✅ Dùng `GlobalException` handler
- ✅ Throw specific exceptions: `NoSuchElementException`, `IllegalArgumentException`
- ✅ Trả về `APIResponse<T>` với status, message, errorCode

### 3. Database
- ✅ Luôn dùng Soft Delete (không xóa thực sự)
- ✅ Filter `deletedBy IS NULL` trong queries
- ✅ Dùng `@PrePersist` và `@PreUpdate` cho audit fields
- ✅ Dùng `@Transactional` cho complex operations

### 4. Pagination
- ✅ Validate page và size (min/max)
- ✅ Validate sort fields (whitelist)
- ✅ ID filter có priority cao nhất
- ✅ Luôn trả về metadata đầy đủ

### 5. Code Organization
- ✅ Tách Interface và Implementation cho Service
- ✅ Dùng DTO để tách biệt Entity và API contract
- ✅ Private method `toDTO()` trong Controller
- ✅ Static factory methods cho complex DTOs

### 6. Swagger Documentation
- ✅ `@Operation` cho mỗi endpoint
- ✅ `@ApiResponses` cho các response codes
- ✅ `@Parameter` cho request parameters
- ✅ `@Tag` để group endpoints

### 7. Validation
- ✅ `@NotBlank`, `@NotNull`, `@Email` cho Entity
- ✅ `@Validated(CreateValidation.class)` cho create operations
- ✅ Custom validation trong Service layer

---

## 🎯 Tóm tắt Checklist

Khi tạo API mới, làm theo thứ tự:

1. ✅ Tạo Entity với audit fields và soft delete
2. ✅ Tạo Repository với custom queries
3. ✅ Tạo Service Interface
4. ✅ Tạo Service Implementation
5. ✅ Tạo DTOs (Request & Response)
6. ✅ Tạo Controller với CRUD operations
7. ✅ Thêm Swagger annotations
8. ✅ Thêm Security annotations
9. ✅ Test với Swagger UI

---

**Happy Coding! 🚀**


