package com.example.learnspring1.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.cloudinary.Cloudinary;

@Configuration
public class CloudinaryConfig {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryConfig.class);

    @Value("${cloudinary.cloud_name:}")
    private String cloudName;

    @Value("${cloudinary.api_key:}")
    private String apiKey;

    @Value("${cloudinary.api_secret:}")
    private String apiSecret;

    @Value("${cloudinary.timeout_ms:20000}")
    private int timeoutMs;

    @Bean
    public Cloudinary cloudinary() {
        logger.info("Initializing Cloudinary configuration...");
        
        if (cloudName == null || cloudName.isEmpty()) {
            logger.warn("⚠️ Cloudinary cloud_name is empty!");
        }
        if (apiKey == null || apiKey.isEmpty()) {
            logger.warn("⚠️ Cloudinary api_key is empty!");
        }
        if (apiSecret == null || apiSecret.isEmpty()) {
            logger.warn("⚠️ Cloudinary api_secret is empty!");
        }
        
        Map<String, Object> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        // timeouts (ms)
        config.put("timeout", timeoutMs);
        config.put("upload_preset", null); // not used server-side
        
        Cloudinary cloudinary = new Cloudinary(config);
        logger.info("✅ Cloudinary initialized successfully with cloud_name: {}", cloudName);
        
        return cloudinary;
    }
}


