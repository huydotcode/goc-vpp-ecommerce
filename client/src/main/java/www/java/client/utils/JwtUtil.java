package www.java.client.utils;

import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Base64;
import java.util.List;
import java.util.ArrayList;

@Component
public class JwtUtil {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Decode JWT token và lấy payload
     */
    public JsonNode decodeToken(String token) {
        try {
            if (token == null || token.isEmpty()) {
                return null;
            }
            
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            
            // Decode payload (phần thứ 2)
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            return objectMapper.readTree(payload);
        } catch (Exception e) {
            System.err.println("Error decoding JWT token: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Lấy username từ token
     */
    public String getUsername(String token) {
        JsonNode payload = decodeToken(token);
        if (payload != null && payload.has("sub")) {
            return payload.get("sub").asText();
        }
        return null;
    }
    
    /**
     * Lấy roles từ token
     * JWT có claim "truonggiang" chứa authentication object với authorities
     */
    public List<String> getRoles(String token) {
        List<String> roles = new ArrayList<>();
        try {
            JsonNode payload = decodeToken(token);
            if (payload == null) {
                System.out.println("[JwtUtil] Payload is null");
                return roles;
            }
            
            // Debug: In ra toàn bộ payload để xem cấu trúc
            System.out.println("[JwtUtil] Full payload: " + payload.toString());
            
            // Thử lấy trực tiếp từ claim "roles" hoặc "authorities"
            if (payload.has("roles")) {
                JsonNode rolesNode = payload.get("roles");
                if (rolesNode.isArray()) {
                    for (JsonNode role : rolesNode) {
                        String roleStr = role.isTextual() ? role.asText() : null;
                        if (roleStr != null && !roleStr.isEmpty()) {
                            if (roleStr.startsWith("ROLE_")) {
                                roleStr = roleStr.substring(5);
                            }
                            roles.add(roleStr);
                        }
                    }
                    System.out.println("[JwtUtil] Found roles from 'roles' claim: " + roles);
                    return roles;
                }
            }
            
            if (payload.has("authorities")) {
                JsonNode authorities = payload.get("authorities");
                if (authorities.isArray()) {
                    for (JsonNode authority : authorities) {
                        String authorityStr = null;
                        if (authority.has("authority")) {
                            authorityStr = authority.get("authority").asText();
                        } else if (authority.isTextual()) {
                            authorityStr = authority.asText();
                        }
                        if (authorityStr != null && !authorityStr.isEmpty()) {
                            if (authorityStr.startsWith("ROLE_")) {
                                authorityStr = authorityStr.substring(5);
                            }
                            roles.add(authorityStr);
                        }
                    }
                    System.out.println("[JwtUtil] Found roles from 'authorities' claim: " + roles);
                    return roles;
                }
            }
            
            // Lấy claim "truonggiang" chứa authentication object
            if (payload.has("truonggiang")) {
                JsonNode authNode = payload.get("truonggiang");
                System.out.println("[JwtUtil] Found 'truonggiang' claim: " + authNode.toString());
                
                // Tìm authorities trong authentication object
                // Có thể có nhiều cấu trúc khác nhau
                if (authNode.has("authorities")) {
                    JsonNode authorities = authNode.get("authorities");
                    if (authorities.isArray()) {
                        for (JsonNode authority : authorities) {
                            String authorityStr = null;
                            
                            // Thử lấy từ field "authority"
                            if (authority.has("authority")) {
                                authorityStr = authority.get("authority").asText();
                            }
                            // Thử lấy từ field "role"
                            else if (authority.has("role")) {
                                authorityStr = authority.get("role").asText();
                            }
                            // Nếu là string trực tiếp
                            else if (authority.isTextual()) {
                                authorityStr = authority.asText();
                            }
                            
                            if (authorityStr != null && !authorityStr.isEmpty()) {
                                // Loại bỏ prefix "ROLE_" nếu có
                                if (authorityStr.startsWith("ROLE_")) {
                                    authorityStr = authorityStr.substring(5);
                                }
                                roles.add(authorityStr);
                            }
                        }
                        System.out.println("[JwtUtil] Found roles from 'truonggiang.authorities': " + roles);
                        return roles;
                    }
                }
                // Thử tìm trong principal nếu có
                else if (authNode.has("principal")) {
                    JsonNode principal = authNode.get("principal");
                    System.out.println("[JwtUtil] Found 'principal' in truonggiang: " + principal.toString());
                    if (principal.has("authorities")) {
                        JsonNode authorities = principal.get("authorities");
                        if (authorities.isArray()) {
                            for (JsonNode authority : authorities) {
                                String authorityStr = null;
                                if (authority.has("authority")) {
                                    authorityStr = authority.get("authority").asText();
                                } else if (authority.isTextual()) {
                                    authorityStr = authority.asText();
                                }
                                if (authorityStr != null && !authorityStr.isEmpty()) {
                                    if (authorityStr.startsWith("ROLE_")) {
                                        authorityStr = authorityStr.substring(5);
                                    }
                                    roles.add(authorityStr);
                                }
                            }
                            System.out.println("[JwtUtil] Found roles from 'truonggiang.principal.authorities': " + roles);
                            return roles;
                        }
                    }
                    // Thử tìm roles trực tiếp trong principal
                    if (principal.has("roles")) {
                        JsonNode rolesNode = principal.get("roles");
                        if (rolesNode.isArray()) {
                            for (JsonNode role : rolesNode) {
                                String roleStr = role.isTextual() ? role.asText() : null;
                                if (roleStr != null && !roleStr.isEmpty()) {
                                    if (roleStr.startsWith("ROLE_")) {
                                        roleStr = roleStr.substring(5);
                                    }
                                    roles.add(roleStr);
                                }
                            }
                            System.out.println("[JwtUtil] Found roles from 'truonggiang.principal.roles': " + roles);
                            return roles;
                        }
                    }
                    // Thử tìm role (singular) trong principal
                    if (principal.has("role")) {
                        String roleStr = principal.get("role").asText();
                        if (roleStr != null && !roleStr.isEmpty()) {
                            if (roleStr.startsWith("ROLE_")) {
                                roleStr = roleStr.substring(5);
                            }
                            roles.add(roleStr);
                            System.out.println("[JwtUtil] Found role from 'truonggiang.principal.role': " + roles);
                            return roles;
                        }
                    }
                }
            }
            
            System.out.println("[JwtUtil] No roles found in token. Available claims: " + payload.fieldNames());
        } catch (Exception e) {
            System.err.println("Error extracting roles from token: " + e.getMessage());
            e.printStackTrace();
        }
        return roles;
    }
    
    /**
     * Kiểm tra xem user có role ADMIN không
     */
    public boolean isAdmin(String token) {
        List<String> roles = getRoles(token);
        return roles.contains("ADMIN");
    }
    
    /**
     * Kiểm tra xem token có hợp lệ không (có thể decode được)
     */
    public boolean isValidToken(String token) {
        return decodeToken(token) != null;
    }
}

