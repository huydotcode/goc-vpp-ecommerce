package www.java.client.service;

import www.java.client.model.LoginRequest;
import www.java.client.model.LoginResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

@Service
public class AuthService {
    
    private final RestTemplate restTemplate;
    private final String BASE_URL = "http://localhost:8080/api/v1";
    private final TokenService tokenService;
    
    public AuthService(RestTemplate restTemplate, TokenService tokenService) {
        this.restTemplate = restTemplate;
        this.tokenService = tokenService;
        System.out.println("========================================");
        System.out.println("AuthService initialized with BASE_URL: " + BASE_URL);
        System.out.println("========================================");
    }
    
    public LoginResponse login(String username, String password) {
        try {
            String loginUrl = BASE_URL + "/login";
            System.out.println("========================================");
            System.out.println("Attempting login...");
            System.out.println("URL: " + loginUrl);
            System.out.println("Username: " + username);
            System.out.println("========================================");
            
            LoginRequest loginRequest = new LoginRequest(username, password);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<LoginRequest> request = new HttpEntity<>(loginRequest, headers);
            
            // Sử dụng String response để tránh compilation error
            ResponseEntity<String> response = restTemplate.exchange(
                loginUrl,
                HttpMethod.POST,
                request,
                String.class
            );
            
            System.out.println("Login response status: " + response.getStatusCode());
            
            // Parse JSON response manually
            String responseBody = response.getBody();
            if (responseBody != null && !responseBody.trim().isEmpty()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(responseBody);
                    
                    String status = root.get("status").asText();
                    if ("success".equals(status)) {
                        com.fasterxml.jackson.databind.JsonNode dataNode = root.get("data");
                        if (dataNode != null) {
                            LoginResponse loginResponse = mapper.treeToValue(dataNode, LoginResponse.class);
                            if (loginResponse != null && loginResponse.getAccessToken() != null) {
                                tokenService.saveToken(loginResponse.getAccessToken());
                                System.out.println("Token saved successfully!");
                                System.out.println("Token: " + loginResponse.getAccessToken().substring(0, 20) + "...");
                                return loginResponse;
                            }
                        }
                    }
                } catch (Exception parseException) {
                    System.err.println("Error parsing login response: " + parseException.getMessage());
                }
            }
            
            System.err.println("Login failed: Invalid response structure");
            return null;
        } catch (Exception e) {
            System.err.println("========================================");
            System.err.println("LOGIN ERROR:");
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("========================================");
            return null;
        }
    }
    
    public void logout() {
        tokenService.clearToken();
    }
}
