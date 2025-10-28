package www.java.client.service;

import www.java.client.model.User;
import www.java.client.model.PaginatedResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.util.List;
import java.util.ArrayList;

@Service
public class UserService {
    
    private final RestTemplate restTemplate;
    private final String BASE_URL = "http://localhost:8080/api/v1/users";
    private final TokenService tokenService;
    
    public UserService(RestTemplate restTemplate, TokenService tokenService) {
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
    
    /**
     * Lấy danh sách users với pagination và filtering từ server
     * @param page Trang hiện tại (bắt đầu từ 1)
     * @param size Số items per page
     * @param sort Trường để sort
     * @param direction Hướng sort (asc/desc)
     * @param role Filter theo role
     * @param username Filter theo username
     * @param email Filter theo email
     * @param isActive Filter theo trạng thái active
     * @param search Search term
     * @return PaginatedResponse chứa dữ liệu và metadata
     */
    public PaginatedResponse<User> getUsersWithPagination(int page, int size, String sort, 
                                                          String direction, String role, 
                                                          String username, String email, 
                                                          Boolean isActive, String search) {
        try {
            StringBuilder urlBuilder = new StringBuilder(BASE_URL + "/advanced");
            urlBuilder.append("?page=").append(page)
                     .append("&size=").append(size)
                     .append("&sort=").append(sort)
                     .append("&direction=").append(direction);
            
            // Thêm filters nếu có
            if (role != null && !role.trim().isEmpty()) {
                urlBuilder.append("&role=").append(role);
            }
            if (username != null && !username.trim().isEmpty()) {
                urlBuilder.append("&username=").append(username);
            }
            if (email != null && !email.trim().isEmpty()) {
                urlBuilder.append("&email=").append(email);
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
            handleServiceError("Error getting users with pagination", e);
            return createEmptyPaginatedResponse();
        }
    }

    /**
     * Lấy tất cả users (sử dụng API /advanced với pagination)
     */
    public List<User> getAllUsers() {
        try {
            PaginatedResponse<User> response = getUsersWithPagination(1, 100, "id", "asc", 
                                                                     null, null, null, null, null);
            return response != null && response.getResult() != null ? response.getResult() : new ArrayList<>();
        } catch (Exception e) {
            handleServiceError("Error getting all users", e);
            return new ArrayList<>();
        }
    }
    
    public User getUserById(Long id) {
        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            
            // Backend trả về UserDTO, cần parse JSON manually
            ResponseEntity<String> response = restTemplate.exchange(
                BASE_URL + "/" + id,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            System.out.println("Response status: " + response.getStatusCode());
            String responseBody = response.getBody();
            System.out.println("Raw response: " + responseBody);
            
            if (responseBody != null && !responseBody.trim().isEmpty()) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.registerModule(new JavaTimeModule());
                    
                    // Parse ApiResponse wrapper first
                    JsonNode root = mapper.readTree(responseBody);
                    String status = root.get("status").asText();
                    
                    if ("success".equals(status)) {
                        JsonNode dataNode = root.get("data");
                        if (dataNode != null) {
                            User user = mapper.treeToValue(dataNode, User.class);
                            System.out.println("User parsed successfully: " + user.getUsername());
                            System.out.println("========================================");
                            return user;
                        }
                    }
                    
                    System.err.println("Invalid response structure or status: " + status);
                } catch (Exception parseException) {
                    System.err.println("Error parsing JSON response: " + parseException.getMessage());
                    System.err.println("Response body: " + responseBody);
                }
            }
            
            System.out.println("User is NULL from backend!");
            System.out.println("========================================");
            return null;
        } catch (Exception e) {
            System.err.println("ERROR getting user by ID:");
            e.printStackTrace();
            return null;
        }
    }
    
    public User createUser(User user) {
        try {
            System.out.println("========================================");
            System.out.println("UserService.createUser() called");
            System.out.println("Creating user: " + user.getUsername());
            System.out.println("User details:");
            System.out.println("Username: " + user.getUsername());
            System.out.println("Email: " + user.getEmail());
            System.out.println("Role: " + user.getRole());
            System.out.println("IsActive: " + user.getIsActive());
            System.out.println("CreatedAt: " + user.getCreatedAt());
            System.out.println("UpdatedAt: " + user.getUpdatedAt());
            System.out.println("CreatedBy: " + user.getCreatedBy());
            System.out.println("UpdatedBy: " + user.getUpdatedBy());
            System.out.println("========================================");
            
            HttpEntity<User> request = new HttpEntity<>(user, createHeaders());
            ResponseEntity<User> response = restTemplate.exchange(
                BASE_URL,
                HttpMethod.POST,
                request,
                User.class
            );
            
            System.out.println("User created successfully!");
            return response.getBody();
        } catch (Exception e) {
            System.err.println("ERROR creating user:");
            e.printStackTrace();
            return null;
        }
    }
    
    public User updateUser(Long id, User user) {
        try {
            System.out.println("========================================");
            System.out.println("UserService.updateUser() called");
            System.out.println("Updating user ID: " + id);
            System.out.println("URL: " + BASE_URL + "/" + id);
            System.out.println("========================================");
            
            HttpEntity<User> request = new HttpEntity<>(user, createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(
                BASE_URL + "/" + id,
                HttpMethod.PUT,
                request,
                String.class
            );
            
            System.out.println("Response status: " + response.getStatusCode());
            String responseBody = response.getBody();
            System.out.println("Raw response: " + responseBody);
            
            if (responseBody != null && !responseBody.trim().isEmpty()) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.registerModule(new JavaTimeModule());
                    
                    // Parse ApiResponse wrapper first
                    JsonNode root = mapper.readTree(responseBody);
                    String status = root.get("status").asText();
                    
                    if ("success".equals(status)) {
                        JsonNode dataNode = root.get("data");
                        if (dataNode != null) {
                            User updatedUser = mapper.treeToValue(dataNode, User.class);
                            System.out.println("User updated successfully: " + updatedUser.getUsername());
                            System.out.println("========================================");
                            return updatedUser;
                        }
                    }
                    
                    System.err.println("Invalid response structure or status: " + status);
                } catch (Exception parseException) {
                    System.err.println("Error parsing JSON response: " + parseException.getMessage());
                    System.err.println("Response body: " + responseBody);
                }
            }
            
            System.out.println("User update failed!");
            System.out.println("========================================");
            return null;
        } catch (Exception e) {
            System.err.println("ERROR updating user:");
            e.printStackTrace();
            return null;
        }
    }
    
    public void deleteUser(Long id) {
        try {
            System.out.println("Deleting user ID: " + id);
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            restTemplate.exchange(
                BASE_URL + "/" + id,
                HttpMethod.DELETE,
                entity,
                Void.class
            );
            System.out.println("User deleted successfully!");
        } catch (Exception e) {
            System.err.println("ERROR deleting user:");
            e.printStackTrace();
        }
    }
    
    /**
     * Parse JSON response thành PaginatedResponse
     */
    private PaginatedResponse<User> parsePaginatedResponse(String responseBody) {
        if (responseBody == null || responseBody.trim().isEmpty()) {
            return createEmptyPaginatedResponse();
        }
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            JsonNode root = mapper.readTree(responseBody);
            
            // Kiểm tra nếu response được wrap trong ApiResponse
            if (root.has("status") && root.has("data")) {
                JsonNode dataNode = root.get("data");
                return mapper.readValue(
                    mapper.treeAsTokens(dataNode),
                    mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, User.class)
                );
            }
            
            // Parse trực tiếp PaginatedResponse
            return mapper.readValue(
                responseBody,
                mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, User.class)
            );
            
        } catch (Exception e) {
            System.err.println("Error parsing paginated response: " + e.getMessage());
            return createEmptyPaginatedResponse();
        }
    }

    /**
     * Tạo PaginatedResponse rỗng
     */
    private PaginatedResponse<User> createEmptyPaginatedResponse() {
        PaginatedResponse<User> response = new PaginatedResponse<>();
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

    /**
     * Xử lý lỗi chung cho service
     */
    private void handleServiceError(String message, Exception e) {
        System.err.println(message + ": " + e.getMessage());
        
        // Nếu token hết hạn, clear token
        if (e.getMessage() != null && (e.getMessage().contains("401") || 
                                     e.getMessage().contains("Unauthorized"))) {
            System.out.println("Token expired, clearing token");
            tokenService.clearToken();
        }
    }
}
