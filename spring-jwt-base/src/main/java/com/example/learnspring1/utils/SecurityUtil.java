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
import org.springframework.stereotype.Service;

import com.nimbusds.jose.util.Base64;
import com.nimbusds.jwt.JWT;

@Service
public class SecurityUtil {

    // private static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS256;

    @Value("${spring.jwt.base64-secret}")
    private String base64Secret;
    @Value("${spring.jwt.token-validity-in-seconds}")
    private long jwtExpiration;

    private final JwtEncoder jwtEncoder;

    public SecurityUtil(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String createToken(Authentication authentication) {
        Instant now = Instant.now();
        Instant expiration = now.plus(this.jwtExpiration, ChronoUnit.SECONDS);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("learnspring1")
                .issuedAt(now)
                .expiresAt(expiration)
                .claim("truonggiang", authentication)
                .subject(authentication.getName())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public static java.util.Optional<String> getCurrentUserLogin() {
        org.springframework.security.core.context.SecurityContext securityContext = org.springframework.security.core.context.SecurityContextHolder.getContext();
        return java.util.Optional.ofNullable(extractPrincipal(securityContext.getAuthentication()));
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
