package www.java.client.service;

import www.java.client.model.User;
import www.java.client.model.ApiResponse;
import www.java.client.model.PaginatedResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
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
        System.out.println("========================================");
        System.out.println("UserService initialized with BASE_URL: " + BASE_URL);
        System.out.println("========================================");
    }
    
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String token = tokenService.getToken();
        if (token != null && !token.isEmpty()) {
            headers.setBearerAuth(token);
            System.out.println("Added Bearer token to request headers");
            System.out.println("Token (first 20 chars): " + token.substring(0, Math.min(20, token.length())) + "...");
        } else {
            System.out.println("WARNING: No token available!");
        }
        return headers;
    }
    
    public List<User> getAllUsers() {
        try {
            String url = BASE_URL + "/page?page=1&size=100";
            System.out.println("========================================");
            System.out.println("Getting all users from: " + url);
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            
            // Backend trả về PaginatedResponse<User>
            ResponseEntity<PaginatedResponse<User>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<PaginatedResponse<User>>() {}
            );
            
            PaginatedResponse<User> paginatedResponse = response.getBody();
            if (paginatedResponse != null && paginatedResponse.getResult() != null) {
                List<User> users = paginatedResponse.getResult();
                System.out.println("Got " + users.size() + " users (Total: " + paginatedResponse.getMetadata().getTotalElements() + ")");
                System.out.println("========================================");
                return users;
            }
            
            System.err.println("Failed to get users: Invalid response structure");
            System.out.println("========================================");
            return new ArrayList<>();
        } catch (Exception e) {
            System.err.println("ERROR getting all users:");
            e.printStackTrace();
            
            // Nếu token hết hạn, clear token
            if (e.getMessage().contains("401") || e.getMessage().contains("Unauthorized")) {
                System.out.println("Token expired, clearing token");
                tokenService.clearToken();
            }
            
            return new ArrayList<>();
        }
    }

    public PaginatedResponse<User> getUsersAdvanced(int page, int size, String sort, String direction) {
        try {
            String url = BASE_URL + "/advanced?page=" + page + "&size=" + size + "&sort=" + sort + "&direction=" + direction;
            System.out.println("========================================");
            System.out.println("Getting users (server-side pagination) from: " + url);
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());

            // Lấy String để tương thích cả 2 dạng: trực tiếp hoặc bọc ApiResponse
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );

            String body = response.getBody();
            if (body == null || body.isBlank()) return null;

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());

            // Nếu là wrapper ApiResponse => có field "status" và "data"
            if (body.trim().startsWith("{")) {
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(body);
                if (root.has("status") && root.has("data")) {
                    com.fasterxml.jackson.databind.JsonNode dataNode = root.get("data");
                    PaginatedResponse<User> paginated = mapper.readValue(
                        mapper.treeAsTokens(dataNode),
                        mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, User.class)
                    );
                    logPaginated(paginated);
                    return paginated;
                }
            }

            // Ngược lại: parse trực tiếp PaginatedResponse
            PaginatedResponse<User> paginated = mapper.readValue(
                body,
                mapper.getTypeFactory().constructParametricType(PaginatedResponse.class, User.class)
            );
            logPaginated(paginated);
            return paginated;
        } catch (Exception e) {
            System.err.println("ERROR getting users (server-side pagination):");
            e.printStackTrace();
            if (e.getMessage() != null && (e.getMessage().contains("401") || e.getMessage().contains("Unauthorized"))) {
                System.out.println("Token expired, clearing token");
                tokenService.clearToken();
            }
            return null;
        }
    }

    private void logPaginated(PaginatedResponse<User> p) {
        if (p == null || p.getMetadata() == null) return;
        System.out.println("Got " + (p.getResult() != null ? p.getResult().size() : 0)
            + " users (Total: " + p.getMetadata().getTotalElements()
            + ", Page: " + p.getMetadata().getPage()
            + "/" + p.getMetadata().getTotalPages() + ")");
        System.out.println("========================================");
    }
    
    public List<User> getUsersWithFilters(String role, String username, String email, Boolean isActive) {
        try {
            // Sử dụng backend API /filter endpoint
            StringBuilder urlBuilder = new StringBuilder(BASE_URL + "/filter?");
            boolean hasParam = false;
            
            if (role != null && !role.trim().isEmpty()) {
                urlBuilder.append("role=").append(role);
                hasParam = true;
            }
            if (username != null && !username.trim().isEmpty()) {
                if (hasParam) urlBuilder.append("&");
                urlBuilder.append("username=").append(username);
                hasParam = true;
            }
            if (email != null && !email.trim().isEmpty()) {
                if (hasParam) urlBuilder.append("&");
                urlBuilder.append("email=").append(email);
                hasParam = true;
            }
            if (isActive != null) {
                if (hasParam) urlBuilder.append("&");
                urlBuilder.append("isActive=").append(isActive);
                hasParam = true;
            }
            
            String url = urlBuilder.toString();
            System.out.println("========================================");
            System.out.println("Getting filtered users from backend API: " + url);
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            
            // Backend trả về List<UserDTO> trực tiếp, nhưng client model là User
            // Sử dụng String response và parse manually
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            System.out.println("Raw response: " + response.getBody());
            
            // Parse JSON response manually
            String responseBody = response.getBody();
            if (responseBody != null && !responseBody.trim().isEmpty()) {
                try {
                    // Parse wrapper object and extract "data" array then map to List<User>
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    // Support Java time types like Instant
                    mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
                    com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(responseBody);
                    com.fasterxml.jackson.databind.JsonNode dataNode = root.get("data");
                    if (dataNode != null && dataNode.isArray()) {
                        List<User> users = mapper.readValue(
                            dataNode.traverse(),
                            mapper.getTypeFactory().constructCollectionType(List.class, User.class)
                        );
                        System.out.println("Got " + users.size() + " filtered users from backend API");
                        System.out.println("========================================");
                        return users;
                    } else {
                        System.err.println("Response does not contain an array 'data' field");
                    }
                } catch (Exception parseException) {
                    System.err.println("Error parsing JSON response: " + parseException.getMessage());
                    System.err.println("Response body: " + responseBody);
                }
            }
            
            System.err.println("Failed to get filtered users: Invalid response structure");
            System.out.println("========================================");
            return new ArrayList<>();
        } catch (Exception e) {
            System.err.println("ERROR getting filtered users from backend API:");
            e.printStackTrace();
            
            // Nếu token hết hạn, clear token
            if (e.getMessage().contains("401") || e.getMessage().contains("Unauthorized")) {
                System.out.println("Token expired, clearing token");
                tokenService.clearToken();
            }
            
            return new ArrayList<>();
        }
    }
    
    public User getUserById(Long id) {
        try {
            System.out.println("========================================");
            System.out.println("UserService.getUserById() called");
            System.out.println("Getting user by ID: " + id);
            System.out.println("URL: " + BASE_URL + "/" + id);
            System.out.println("========================================");
            
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            
            // Backend trả về UserDTO, cần parse JSON manually
            ResponseEntity<String> response = restTemplate.exchange(
                BASE_URL + "/" + id,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            System.out.println("Response status: " + response.getStatusCode());
            System.out.println("Raw response: " + response.getBody());
            
            if (response.getBody() != null && !response.getBody().trim().isEmpty()) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.registerModule(new JavaTimeModule());
                    
                    // Parse ApiResponse wrapper first
                    JsonNode root = mapper.readTree(response.getBody());
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
                    System.err.println("Response body: " + response.getBody());
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
            System.out.println("Raw response: " + response.getBody());
            
            if (response.getBody() != null && !response.getBody().trim().isEmpty()) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.registerModule(new JavaTimeModule());
                    
                    // Parse ApiResponse wrapper first
                    JsonNode root = mapper.readTree(response.getBody());
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
                    System.err.println("Response body: " + response.getBody());
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
    
    public List<User> sortUsers(List<User> users, String sortField, String direction) {
        if (users == null || users.isEmpty()) {
            return users;
        }
        
        boolean isAscending = "asc".equalsIgnoreCase(direction);
        
        switch (sortField.toLowerCase()) {
            case "id":
                users.sort((u1, u2) -> isAscending ? 
                    u1.getId().compareTo(u2.getId()) : 
                    u2.getId().compareTo(u1.getId()));
                break;
            case "username":
                users.sort((u1, u2) -> isAscending ? 
                    u1.getUsername().compareToIgnoreCase(u2.getUsername()) : 
                    u2.getUsername().compareToIgnoreCase(u1.getUsername()));
                break;
            case "email":
                users.sort((u1, u2) -> isAscending ? 
                    u1.getEmail().compareToIgnoreCase(u2.getEmail()) : 
                    u2.getEmail().compareToIgnoreCase(u1.getEmail()));
                break;
            case "role":
                users.sort((u1, u2) -> isAscending ? 
                    u1.getRole().compareToIgnoreCase(u2.getRole()) : 
                    u2.getRole().compareToIgnoreCase(u1.getRole()));
                break;
            case "createdat":
                users.sort((u1, u2) -> isAscending ? 
                    u1.getCreatedAt().compareTo(u2.getCreatedAt()) : 
                    u2.getCreatedAt().compareTo(u1.getCreatedAt()));
                break;
            default:
                // Default sort by ID
                users.sort((u1, u2) -> isAscending ? 
                    u1.getId().compareTo(u2.getId()) : 
                    u2.getId().compareTo(u1.getId()));
        }
        
        return users;
    }
}
