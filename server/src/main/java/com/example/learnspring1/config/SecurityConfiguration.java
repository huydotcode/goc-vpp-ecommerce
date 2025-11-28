package com.example.learnspring1.config;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfiguration {

    @Value("${spring.jwt.base64-secret}")
    private String base64Secret;

    @Value("${spring.jwt.token-validity-in-seconds}")
    private String jwtExpiration;

    private static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS256;

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(getSecretKey()));
    }

    public SecretKey getSecretKey() {
        byte[] keyBytes = Base64.from(base64Secret).decode();
        return new SecretKeySpec(keyBytes, 0, keyBytes.length, JWT_ALGORITHM.getName());
    }

    @Bean
    JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(
                getSecretKey()).macAlgorithm(JWT_ALGORITHM).build();
        return token -> {
            try {

                return jwtDecoder.decode(token);
            } catch (Exception e) {
                System.out.println("Error decoding JWT: " + e.getMessage());
                throw e;
            }
        };
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        // Custom converter để extract authorities từ nested structure trong JWT
        org.springframework.core.convert.converter.Converter<org.springframework.security.oauth2.jwt.Jwt, java.util.Collection<org.springframework.security.core.GrantedAuthority>> customConverter = 
            jwt -> {
                java.util.Collection<org.springframework.security.core.GrantedAuthority> authorities = 
                    new java.util.ArrayList<>();
                
                try {
                    // Lấy claim "truonggiang" chứa authentication object
                    java.util.Map<String, Object> authMap = jwt.getClaimAsMap("truonggiang");
                    if (authMap != null) {
                        // Lấy authorities từ nested structure
                        Object authoritiesObj = authMap.get("authorities");
                        if (authoritiesObj instanceof java.util.List) {
                            @SuppressWarnings("unchecked")
                            java.util.List<Object> authorityList = (java.util.List<Object>) authoritiesObj;
                            for (Object authObj : authorityList) {
                                if (authObj instanceof java.util.Map) {
                                    @SuppressWarnings("unchecked")
                                    java.util.Map<String, String> authMapItem = (java.util.Map<String, String>) authObj;
                                    String role = authMapItem.get("role");
                                    if (role != null) {
                                        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(role));
                                    }
                                } else if (authObj instanceof String) {
                                    authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority((String) authObj));
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    System.out.println("[SecurityConfiguration] Error extracting authorities: " + e.getMessage());
                }
                
                return authorities;
            };

        // Tạo JwtAuthenticationConverter và gán custom converter
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(customConverter);

        return jwtAuthenticationConverter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            CustomAuthenticationEntryPoint customAuthenticationEntryPoint) throws Exception {
        http
                .csrf(c -> c.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(
                        authz -> authz
                                .requestMatchers
                            (
                                "/",
                                "/login",
                                "/register",
                                "/refresh",
                                "/test-refresh",
                                "/test-quick-refresh",
                                "/google/redirect",
                                "/google/test-login",
                                "/google/auth-url",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**"
                                )
                                .permitAll()
                                .anyRequest().authenticated())
                .oauth2ResourceServer(
                        oauth2 -> oauth2.jwt(Customizer
                                .withDefaults())
                                .authenticationEntryPoint(customAuthenticationEntryPoint))
                // .exceptionHandling(
                // exceptions -> exceptions
                // .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint()) // 401
                // .accessDeniedHandler(new BearerTokenAccessDeniedHandler())) // 403
                .formLogin(f -> f.disable())
                .sessionManagement(
                        session -> session
                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }
}
