package www.java.client.service;

import www.java.client.model.Category;
import www.java.client.model.PaginatedResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.ArrayList;

@Service
public class CategoryService {
    
    private static final Logger logger = LoggerFactory.getLogger(CategoryService.class);
    private final RestTemplate restTemplate;
    private final String BASE_URL = "http://localhost:8080/api/v1/categories";
    private final TokenService tokenService;
    
    public CategoryService(RestTemplate restTemplate, TokenService tokenService) {
        this.restTemplate = restTemplate;
        this.tokenService = tokenService;
    }
    
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String token = tokenService.getToken();
        if (token != null && !token.isEmpty()) {
            headers.setBearerAuth(token);
        }
        return headers;
    }
    
    public PaginatedResponse<Category> getCategoriesWithPagination(int page, int size, String sort, 
                                                                   String direction, String id, String name, 
                                                                   Boolean isActive, String search) {
        try {
            StringBuilder urlBuilder = new StringBuilder(BASE_URL + "/advanced");
            urlBuilder.append("?page=").append(page)
                     .append("&size=").append(size)
                     .append("&sort=").append(sort)
                     .append("&direction=").append(direction);
            
            if (id != null && !id.trim().isEmpty()) {
                urlBuilder.append("&id=").append(id);
            }
            if (name != null && !name.trim().isEmpty()) {
                urlBuilder.append("&name=").append(name);
            }
            if (isActive != null) {
                urlBuilder.append("&isActive=").append(isActive);
            }
            if (search != null && !search.trim().isEmpty()) {
                urlBuilder.append("&search=").append(search);
            }
            
            String url = urlBuilder.toString();
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, String.class
            );
            
            return parsePaginatedResponse(response.getBody());
            
        } catch (Exception e) {
            handleServiceError("Error getting categories with pagination", e);
            return createEmptyPaginatedResponse();
        }
    }

    /**
     * @deprecated Use {@link #getCategoriesWithPagination(int, int, String, String, String, String, Boolean, String)} instead
     */
    public PaginatedResponse<Category> getCategoriesWithPagination(int page, int size, String sort, 
                                                                   String direction, String name, 
                                                                   Boolean isActive, String search) {
        return getCategoriesWithPagination(page, size, sort, direction, null, name, isActive, search);
    }

    public List<Category> getAllCategories() {
        try {
            PaginatedResponse<Category> response = getCategoriesWithPagination(1, 100, "id", "asc", 
                                                                     null, null, null);
            return response != null && response.getResult() != null ? response.getResult() : new ArrayList<>();
        } catch (Exception e) {
            handleServiceError("Error getting all categories", e);
            return new ArrayList<>();
        }
    }
    
    public Category getCategoryById(Long id) {
        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(
                BASE_URL + "/" + id,
                HttpMethod.GET,
                entity,
                String.class
            );
            String responseBody = response.getBody();
            if (responseBody != null && !responseBody.trim().isEmpty()) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.registerModule(new JavaTimeModule());
                    JsonNode root = mapper.readTree(responseBody);
                    if (root.has("status") && "success".equals(root.get("status").asText())) {
                        JsonNode dataNode = root.get("data");
                        if (dataNode != null) {
                            return mapper.treeToValue(dataNode, Category.class);
                        }
                    }
                } catch (Exception parseException) {
                    System.err.println("Error parsing JSON response: " + parseException.getMessage());
                }
            }
            return null;
        } catch (Exception e) {
            System.err.println("ERROR getting category by ID:");
            e.printStackTrace();
            return null;
        }
    }
    
    public Category createCategory(Category category) {
        logger.info("========================================");
        logger.info("CategoryService.createCategory() called");
        logger.info("Creating category: {}", category.getName());
        logger.info("Category details:");
        logger.info("Name: {}", category.getName());
        logger.info("Description: {}", category.getDescription());
        logger.info("ThumbnailUrl: {}", category.getThumbnailUrl());
        logger.info("IsActive: {}", category.getIsActive());
        logger.info("CreatedAt: {}", category.getCreatedAt());
        logger.info("UpdatedAt: {}", category.getUpdatedAt());
        logger.info("CreatedBy: {}", category.getCreatedBy());
        logger.info("UpdatedBy: {}", category.getUpdatedBy());
        logger.info("========================================");
        
        try {
            HttpEntity<Category> request = new HttpEntity<>(category, createHeaders());
            ResponseEntity<Category> response = restTemplate.exchange(
                BASE_URL,
                HttpMethod.POST,
                request,
                Category.class
            );
            
            Category created = response.getBody();
            if (created != null) {
                logger.info("Category created successfully with ID: {}", created.getId());
            } else {
                logger.warn("Category creation response body is null");
            }
            return created;
        } catch (Exception e) {
            logger.error("ERROR creating category:", e);
            return null;
        }
    }
    
    public Category updateCategory(Long id, Category category) {
        logger.info("========================================");
        logger.info("CategoryService.updateCategory() called with ID: {}", id);
        logger.info("Updating category: {}", category.getName());
        logger.info("Category update details:");
        logger.info("Name: {}", category.getName());
        logger.info("Description: {}", category.getDescription());
        logger.info("ThumbnailUrl: {}", category.getThumbnailUrl());
        logger.info("IsActive: {}", category.getIsActive());
        logger.info("UpdatedAt: {}", category.getUpdatedAt());
        logger.info("UpdatedBy: {}", category.getUpdatedBy());
        logger.info("========================================");
        
        try {
            HttpEntity<Category> request = new HttpEntity<>(category, createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(
                BASE_URL + "/" + id,
                HttpMethod.PUT,
                request,
                String.class
            );
            String responseBody = response.getBody();
            if (responseBody != null && !responseBody.trim().isEmpty()) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.registerModule(new JavaTimeModule());
                    JsonNode root = mapper.readTree(responseBody);
                    if (root.has("status") && "success".equals(root.get("status").asText())) {
                        JsonNode dataNode = root.get("data");
                        if (dataNode != null) {
                            Category updated = mapper.treeToValue(dataNode, Category.class);
                            logger.info("Category updated successfully with ID: {}", updated.getId());
                            return updated;
                        }
                    }
                } catch (Exception parseException) {
                    logger.error("Error parsing JSON response: {}", parseException.getMessage());
                }
            }
            logger.warn("Category update response body is null or empty");
            return null;
        } catch (Exception e) {
            logger.error("ERROR updating category with ID: {}", id, e);
            return null;
        }
    }
    
    public void deleteCategory(Long id) {
        logger.info("========================================");
        logger.info("CategoryService.deleteCategory() called with ID: {}", id);
        logger.info("========================================");
        
        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            restTemplate.exchange(
                BASE_URL + "/" + id,
                HttpMethod.DELETE,
                entity,
                Void.class
            );
            logger.info("Category deleted successfully with ID: {}", id);
        } catch (Exception e) {
            logger.error("ERROR deleting category with ID: {}", id, e);
            throw e; // Re-throw để controller có thể handle
        }
    }
    
    private PaginatedResponse<Category> parsePaginatedResponse(String responseBody) {
        if (responseBody == null || responseBody.trim().isEmpty()) {
            return createEmptyPaginatedResponse();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            JsonNode root = mapper.readTree(responseBody);
            if (root.has("status") && root.has("data")) {
                JsonNode dataNode = root.get("data");
                return mapper.readValue(
                    mapper.treeAsTokens(dataNode),
                    mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, Category.class)
                );
            }
            return mapper.readValue(
                responseBody,
                mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, Category.class)
            );
        } catch (Exception e) {
            System.err.println("Error parsing paginated response: " + e.getMessage());
            return createEmptyPaginatedResponse();
        }
    }

    private PaginatedResponse<Category> createEmptyPaginatedResponse() {
        PaginatedResponse<Category> response = new PaginatedResponse<>();
        response.setResult(new ArrayList<>());
        PaginatedResponse.Metadata metadata = new PaginatedResponse.Metadata();
        metadata.setPage(1);
        metadata.setSize(10);
        metadata.setTotalElements(0);
        metadata.setTotalPages(1);
        metadata.setFirst(true);
        metadata.setLast(true);
        metadata.setIsEmpty(true);
        response.setMetadata(metadata);
        return response;
    }

    private void handleServiceError(String message, Exception e) {
        System.err.println(message + ": " + e.getMessage());
        if (e.getMessage() != null && (e.getMessage().contains("401") || 
                                     e.getMessage().contains("Unauthorized"))) {
            tokenService.clearToken();
        }
    }
}


