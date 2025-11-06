package www.java.client.service;

import www.java.client.model.Product;
import www.java.client.model.ProductImage;
import www.java.client.model.PaginatedResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.DeserializationFeature;

@Service
public class ProductService {
    private final RestTemplate restTemplate;
    private final TokenService tokenService;
    private final String BASE_URL = "http://localhost:8080/api/v1/products";
    private final String IMAGE_URL = "http://localhost:8080/api/v1/product-images";

    public ProductService(RestTemplate restTemplate, TokenService tokenService) {
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

    public PaginatedResponse<Product> getProductsWithPagination(int page, int size, String sort,
                                                                String direction, String id,
                                                                String name, String sku, String brand,
                                                                Boolean isActive, String search) {
        try {
            StringBuilder url = new StringBuilder(BASE_URL + "/advanced");
            url.append("?page=").append(page)
               .append("&size=").append(size)
               .append("&sort=").append(sort)
               .append("&direction=").append(direction);
            if (id != null && !id.trim().isEmpty()) url.append("&id=").append(id);
            if (name != null && !name.trim().isEmpty()) url.append("&name=").append(name);
            if (sku != null && !sku.trim().isEmpty()) url.append("&sku=").append(sku);
            if (brand != null && !brand.trim().isEmpty()) url.append("&brand=").append(brand);
            if (isActive != null) url.append("&isActive=").append(isActive);
            if (search != null && !search.trim().isEmpty()) url.append("&search=").append(search);

            System.out.println("[FE/ProductService] GET " + url);
            ResponseEntity<String> response = restTemplate.exchange(
                url.toString(), HttpMethod.GET, new HttpEntity<>(createHeaders()), String.class
            );
            String body = response.getBody();
            System.out.println("[FE/ProductService] status=" + response.getStatusCode());
            if (body != null) {
                String preview = body.length() > 400 ? body.substring(0, 400) + "..." : body;
                System.out.println("[FE/ProductService] response body preview: " + preview);
            } else {
                System.out.println("[FE/ProductService] response body is null");
            }
            PaginatedResponse<Product> parsed = parsePaginatedResponse(body);
            System.out.println("[FE/ProductService] parsed result size=" + (parsed != null && parsed.getResult() != null ? parsed.getResult().size() : -1));
            return parsed;
        } catch (Exception e) {
            System.out.println("[FE/ProductService] ERROR: " + e.getMessage());
            return createEmptyPaginatedResponse();
        }
    }

    public Product createProduct(Product product) {
        ResponseEntity<String> response = restTemplate.exchange(
            BASE_URL, HttpMethod.POST, new HttpEntity<>(product, createHeaders()), String.class
        );
        return extractData(response.getBody(), Product.class);
    }

    public Product updateProduct(Long id, Product product) {
        ResponseEntity<String> response = restTemplate.exchange(
            BASE_URL + "/" + id, HttpMethod.PUT, new HttpEntity<>(product, createHeaders()), String.class
        );
        return extractData(response.getBody(), Product.class);
    }

    public void deleteProduct(Long id) {
        restTemplate.exchange(
            BASE_URL + "/" + id, HttpMethod.DELETE, new HttpEntity<>(createHeaders()), Void.class
        );
    }

    public ProductImage createProductImage(ProductImage image) {
        ResponseEntity<String> response = restTemplate.exchange(
            IMAGE_URL, HttpMethod.POST, new HttpEntity<>(image, createHeaders()), String.class
        );
        return extractData(response.getBody(), ProductImage.class);
    }

    private <T> T extractData(String responseBody, Class<T> clazz) {
        try {
            if (responseBody == null || responseBody.isBlank()) return null;
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            JsonNode root = mapper.readTree(responseBody);
            if (root.has("status") && "success".equals(root.get("status").asText())) {
                JsonNode data = root.get("data");
                if (data != null) return mapper.treeToValue(data, clazz);
            }
            return mapper.readValue(responseBody, clazz);
        } catch (Exception e) { return null; }
    }

    private PaginatedResponse<Product> parsePaginatedResponse(String responseBody) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            JsonNode root = mapper.readTree(responseBody);
            if (root.has("status") && root.has("data")) {
                JsonNode dataNode = root.get("data");
                // Try direct mapping first
                try {
                    return mapper.readValue(
                        mapper.treeAsTokens(dataNode),
                        mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, Product.class)
                    );
                } catch (Exception ignored) {
                    // Manual mapping fallback
                    PaginatedResponse<Product> resp = new PaginatedResponse<>();
                    if (dataNode.has("result")) {
                        resp.setResult(mapper.readerForListOf(Product.class).readValue(dataNode.get("result")));
                    }
                    PaginatedResponse.Metadata md = new PaginatedResponse.Metadata();
                    JsonNode metaNode = dataNode.get("metadata");
                    if (metaNode != null) {
                        md.setPage(metaNode.path("page").asInt(1));
                        md.setSize(metaNode.path("size").asInt(10));
                        md.setTotalElements(metaNode.path("totalElements").asLong(0));
                        md.setTotalPages(metaNode.path("totalPages").asInt(1));
                        md.setFirst(metaNode.path("first").asBoolean(false));
                        md.setLast(metaNode.path("last").asBoolean(false));
                        // hỗ trợ cả "empty" và "isEmpty"
                        boolean emptyVal = metaNode.has("isEmpty") ? metaNode.path("isEmpty").asBoolean(false)
                                                                   : metaNode.path("empty").asBoolean(false);
                        md.setIsEmpty(emptyVal);
                        md.setSortField(metaNode.path("sortField").asText(null));
                        md.setSortDirection(metaNode.path("sortDirection").asText(null));
                    }
                    resp.setMetadata(md);
                    if (resp.getResult() == null) resp.setResult(new java.util.ArrayList<>());
                    return resp;
                }
            }
            // Non-wrapped fallback
            return mapper.readValue(
                responseBody,
                mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, Product.class)
            );
        } catch (Exception e) { return createEmptyPaginatedResponse(); }
    }

    private PaginatedResponse<Product> createEmptyPaginatedResponse() {
        PaginatedResponse<Product> response = new PaginatedResponse<>();
        response.setResult(new java.util.ArrayList<>());
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
}