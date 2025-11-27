package www.java.client.service;

import www.java.client.model.Promotion;
import www.java.client.model.PaginatedResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Map;

@Service
public class PromotionService {
    
    private static final Logger logger = LoggerFactory.getLogger(PromotionService.class);
    private final RestTemplate restTemplate;
    private final String BASE_URL = "http://localhost:8080/api/v1/promotions";
    private final TokenService tokenService;
    
    public PromotionService(RestTemplate restTemplate, TokenService tokenService) {
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
    
    public PaginatedResponse<Promotion> getPromotionsWithPagination(int page, int size, String sort, 
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
            handleServiceError("Error getting promotions with pagination", e);
            return createEmptyPaginatedResponse();
        }
    }
    
    public Promotion getPromotionById(Long id) {
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
                            return mapper.treeToValue(dataNode, Promotion.class);
                        }
                    }
                    return mapper.treeToValue(root, Promotion.class);
                } catch (Exception parseException) {
                    logger.error("Error parsing JSON response: {}", parseException.getMessage());
                }
            }
            return null;
        } catch (Exception e) {
            logger.error("ERROR getting promotion by ID: {}", id, e);
            return null;
        }
    }
    
    public Promotion createPromotion(Map<String, Object> promotionData) {
        logger.info("Creating promotion: {}", promotionData.get("name"));
        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(promotionData, createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(
                BASE_URL,
                HttpMethod.POST,
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
                            return mapper.treeToValue(dataNode, Promotion.class);
                        }
                    }
                    return mapper.treeToValue(root, Promotion.class);
                } catch (Exception parseException) {
                    logger.error("Error parsing JSON response: {}", parseException.getMessage());
                }
            }
            return null;
        } catch (Exception e) {
            logger.error("ERROR creating promotion", e);
            return null;
        }
    }
    
    public Promotion updatePromotion(Long id, Map<String, Object> promotionData) {
        logger.info("Updating promotion with ID: {}", id);
        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(promotionData, createHeaders());
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
                            return mapper.treeToValue(dataNode, Promotion.class);
                        }
                    }
                    return mapper.treeToValue(root, Promotion.class);
                } catch (Exception parseException) {
                    logger.error("Error parsing JSON response: {}", parseException.getMessage());
                }
            }
            return null;
        } catch (Exception e) {
            logger.error("ERROR updating promotion with ID: {}", id, e);
            return null;
        }
    }
    
    private PaginatedResponse<Promotion> parsePaginatedResponse(String responseBody) {
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
                    mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, Promotion.class)
                );
            }
            return mapper.readValue(
                responseBody,
                mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, Promotion.class)
            );
        } catch (Exception e) {
            logger.error("Error parsing paginated response: {}", e.getMessage());
            return createEmptyPaginatedResponse();
        }
    }

    private PaginatedResponse<Promotion> createEmptyPaginatedResponse() {
        PaginatedResponse<Promotion> response = new PaginatedResponse<>();
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
        logger.error("{}: {}", message, e.getMessage());
        if (e.getMessage() != null && (e.getMessage().contains("401") || 
                                     e.getMessage().contains("Unauthorized"))) {
            tokenService.clearToken();
        }
    }
}

