package com.example.learnspring1.utils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;
import com.nimbusds.jwt.JWT;

@Service
public class SecurityUtil {

    @Value("${spring.jwt.base64-secret}")
    private String base64Secret;
    
    @Value("${spring.jwt.token-validity-in-seconds}")
    private long jwtExpiration;

    @Value("${spring.jwt.refresh-token-base64-secret}")
    private String refreshTokenBase64Secret;
    
    @Value("${spring.jwt.refresh-token-validity-in-days}")
    private long refreshTokenExpirationDays;

    private final JwtEncoder jwtEncoder;

    public SecurityUtil(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String createToken(Authentication authentication) {
        Instant now = Instant.now();
        Instant expiration = now.plus(this.jwtExpiration, ChronoUnit.SECONDS);

        // Build full authentication object with authorities (để đồng bộ với token cũ)
        java.util.Map<String, Object> authMap = new java.util.HashMap<>();
        
        // Get UserDetails if available
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            // Extract user details
            java.util.Map<String, Object> principalMap = new java.util.HashMap<>();
            principalMap.put("password", null);
            principalMap.put("username", userDetails.getUsername());
            principalMap.put("enabled", userDetails.isEnabled());
            principalMap.put("accountNonExpired", true);
            principalMap.put("accountNonLocked", true);
            principalMap.put("credentialsNonExpired", true);
            
            // Extract authorities
            java.util.List<java.util.Map<String, String>> authorityList = new java.util.ArrayList<>();
            for (org.springframework.security.core.GrantedAuthority authority : userDetails.getAuthorities()) {
                java.util.Map<String, String> authMap2 = new java.util.HashMap<>();
                authMap2.put("role", authority.getAuthority());
                authorityList.add(authMap2);
            }
            
            principalMap.put("authorities", authorityList);
            authMap.put("principal", principalMap);
            authMap.put("authorities", authorityList);
        } else {
            // Fallback: use authentication object directly
            authMap.put("principal", principal);
            authMap.put("authorities", authentication.getAuthorities());
        }
        
        authMap.put("credentials", null);
        authMap.put("details", authentication.getDetails());
        authMap.put("authenticated", true);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("learnspring1")
                .issuedAt(now)
                .expiresAt(expiration)
                .claim("truonggiang", authMap)
                .subject(authentication.getName())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    /**
     * Create refresh token
     */
    public String createRefreshToken(String username) {
        Instant now = Instant.now();
        Instant expiration = now.plus(this.refreshTokenExpirationDays, ChronoUnit.DAYS);

        // Use different secret for refresh token
        SecretKey refreshKey = new SecretKeySpec(
            Base64.from(refreshTokenBase64Secret).decode(), 
            MacAlgorithm.HS256.getName()
        );
        
        JwtEncoder refreshEncoder = new NimbusJwtEncoder(new ImmutableSecret<>(refreshKey));

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("learnspring1-refresh")
                .issuedAt(now)
                .expiresAt(expiration)
                .subject(username)
                .claim("type", "refresh")
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return refreshEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    /**
     * Validate and decode refresh token
     */
    public String getUsernameFromRefreshToken(String token) {
        try {
            SecretKey refreshKey = new SecretKeySpec(
                Base64.from(refreshTokenBase64Secret).decode(),
                MacAlgorithm.HS256.getName()
            );
            
            NimbusJwtDecoder refreshDecoder = NimbusJwtDecoder
                .withSecretKey(refreshKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
            
            org.springframework.security.oauth2.jwt.Jwt jwt = refreshDecoder.decode(token);
            
            // Verify it's a refresh token
            if (!"refresh".equals(jwt.getClaim("type"))) {
                throw new RuntimeException("Invalid token type");
            }
            
            return jwt.getSubject();
        } catch (Exception e) {
            System.out.println("[SecurityUtil] Invalid refresh token: " + e.getMessage());
            throw new RuntimeException("Invalid refresh token", e);
        }
    }

    /**
     * Get username from access token
     */
    public String getUsernameFromToken(String token) {
        try {
            SecretKey key = new SecretKeySpec(
                Base64.from(base64Secret).decode(),
                MacAlgorithm.HS256.getName()
            );
            
            NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
            
            org.springframework.security.oauth2.jwt.Jwt jwt = decoder.decode(token);
            return jwt.getSubject();
        } catch (Exception e) {
            throw new RuntimeException("Invalid access token", e);
        }
    }

    /**
     * Get remaining time in seconds for access token
     */
    public long getExpiresInFromToken(String token) {
        try {
            SecretKey key = new SecretKeySpec(
                Base64.from(base64Secret).decode(),
                MacAlgorithm.HS256.getName()
            );
            
            NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
            
            org.springframework.security.oauth2.jwt.Jwt jwt = decoder.decode(token);
            Instant expiresAt = jwt.getExpiresAt();
            Instant now = Instant.now();
            
            if (expiresAt == null) {
                return -1L;
            }
            
            return Math.max(0, expiresAt.getEpochSecond() - now.getEpochSecond());
        } catch (Exception e) {
            throw new RuntimeException("Invalid access token", e);
        }
    }

    /**
     * Get remaining time in seconds for refresh token
     */
    public long getExpiresInFromRefreshToken(String token) {
        try {
            SecretKey refreshKey = new SecretKeySpec(
                Base64.from(refreshTokenBase64Secret).decode(),
                MacAlgorithm.HS256.getName()
            );
            
            NimbusJwtDecoder refreshDecoder = NimbusJwtDecoder
                .withSecretKey(refreshKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
            
            org.springframework.security.oauth2.jwt.Jwt jwt = refreshDecoder.decode(token);
            Instant expiresAt = jwt.getExpiresAt();
            Instant now = Instant.now();
            
            if (expiresAt == null) {
                return -1L;
            }
            
            return Math.max(0, expiresAt.getEpochSecond() - now.getEpochSecond());
        } catch (Exception e) {
            throw new RuntimeException("Invalid refresh token", e);
        }
    }

    public static java.util.Optional<String> getCurrentUserLogin() {
        org.springframework.security.core.context.SecurityContext securityContext = org.springframework.security.core.context.SecurityContextHolder.getContext();
        return java.util.Optional.ofNullable(extractPrincipal(securityContext.getAuthentication()));
    }

    /**
     * Get current user role from SecurityContext
     */
    public static java.util.Optional<String> getCurrentUserRole() {
        org.springframework.security.core.context.SecurityContext securityContext = org.springframework.security.core.context.SecurityContextHolder.getContext();
        org.springframework.security.core.Authentication authentication = securityContext.getAuthentication();
        
        if (authentication == null) {
            return java.util.Optional.empty();
        }
        
        // Get authorities from authentication
        java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> authorities = authentication.getAuthorities();
        if (authorities != null && !authorities.isEmpty()) {
            // Get first authority (role)
            org.springframework.security.core.GrantedAuthority firstAuthority = authorities.iterator().next();
            String authority = firstAuthority.getAuthority();
            
            // Remove ROLE_ prefix if present
            if (authority.startsWith("ROLE_")) {
                authority = authority.substring(5);
            }
            
            return java.util.Optional.of(authority);
        }
        
        return java.util.Optional.empty();
    }

    private static String extractPrincipal(org.springframework.security.core.Authentication authentication) {
        if (authentication == null) {
            return null;
        } else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails springSecurityUser) {
            return springSecurityUser.getUsername();
        } else if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            // Lấy sub hoặc email từ claim, tuỳ cấu hình token
            String email = jwt.getClaimAsString("email");
            if (email == null) {
                email = jwt.getSubject();
            }
            return email;
        } else if (authentication.getPrincipal() instanceof String s) {
            return s;
        }
        return null;
    }
}
