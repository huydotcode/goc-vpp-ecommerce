package www.java.client.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UploadService {
    
    private static final Logger logger = LoggerFactory.getLogger(UploadService.class);
    private final RestTemplate restTemplate;
    private final String BASE_URL = "http://localhost:8080/api/v1/uploads";
    private final TokenService tokenService;
    private final ObjectMapper objectMapper;
    
    public UploadService(RestTemplate restTemplate, TokenService tokenService) {
        this.restTemplate = restTemplate;
        this.tokenService = tokenService;
        this.objectMapper = new ObjectMapper();
    }
    
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String token = tokenService.getToken();
        if (token != null && !token.isEmpty()) {
            headers.setBearerAuth(token);
        }
        return headers;
    }
    
    public String uploadFile(MultipartFile file, String resourceType, String module, String entityId, String purpose) {
        try {
            logger.info("UploadService.uploadFile() called");
            logger.info("File name: {}, size: {}, content type: {}", 
                       file.getOriginalFilename(), file.getSize(), file.getContentType());
            logger.info("Resource type: {}, module: {}, entityId: {}, purpose: {}", 
                       resourceType, module, entityId, purpose);
            
            // Tạo multipart form data
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", file.getResource());
            
            if (resourceType != null && !resourceType.trim().isEmpty()) {
                body.add("resourceType", resourceType);
            }
            if (module != null && !module.trim().isEmpty()) {
                body.add("module", module);
            }
            if (entityId != null && !entityId.trim().isEmpty()) {
                body.add("entityId", entityId);
            }
            if (purpose != null && !purpose.trim().isEmpty()) {
                body.add("purpose", purpose);
            }
            
            HttpHeaders headers = createHeaders();
            // Không set Content-Type cho multipart - Spring sẽ tự động set với boundary
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                BASE_URL,
                HttpMethod.POST,
                requestEntity,
                String.class
            );
            
            String responseBody = response.getBody();
            if (responseBody != null && !responseBody.trim().isEmpty()) {
                try {
                    JsonNode root = objectMapper.readTree(responseBody);
                    if (root.has("status") && "success".equals(root.get("status").asText())) {
                        JsonNode dataNode = root.get("data");
                        if (dataNode != null && dataNode.has("secureUrl")) {
                            String secureUrl = dataNode.get("secureUrl").asText();
                            logger.info("Upload successful! URL: {}", secureUrl);
                            return secureUrl;
                        }
                    }
                    logger.error("Upload failed - invalid response: {}", responseBody);
                } catch (Exception parseException) {
                    logger.error("Error parsing upload response: {}", parseException.getMessage());
                }
            }
            logger.error("Upload response body is null or empty");
            return null;
        } catch (Exception e) {
            logger.error("ERROR uploading file: {}", e.getMessage(), e);
            return null;
        }
    }
}

