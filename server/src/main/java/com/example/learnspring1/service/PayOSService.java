package com.example.learnspring1.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class PayOSService {

    @Value("${payos.client-id:}")
    private String clientId;

    @Value("${payos.api-key:}")
    private String apiKey;

    @Value("${payos.checksum-key:}")
    private String checksumKey;

    @Value("${payos.base-url:https://api-merchant.payos.vn}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> createPaymentLink(
            Long amount,
            String description,
            String orderCode,
            String returnUrl,
            String cancelUrl
    ) {
        String url = baseUrl + "/v2/payment-requests";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("orderCode", Long.parseLong(orderCode));
        requestBody.put("amount", amount);
        requestBody.put("description", description);
        requestBody.put("items", new Object[0]);
        requestBody.put("cancelUrl", cancelUrl);
        requestBody.put("returnUrl", returnUrl);

        String data = String.format(
                "amount=%d&cancelUrl=%s&description=%s&orderCode=%s&returnUrl=%s",
                amount, cancelUrl, description, orderCode, returnUrl
        );

        String signature = hmacSHA256(checksumKey, data);
        requestBody.put("signature", signature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-client-id", clientId);
        headers.set("x-api-key", apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to create payment link: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error creating payment link: " + e.getMessage(), e);
        }
    }

    public boolean verifyWebhook(Map<String, Object> webhookData) {
        try {
            String data = String.format(
                    "amount=%s&code=%s&desc=%s&id=%s&orderCode=%s&status=%s&timestamp=%s",
                    webhookData.get("data").toString(),
                    webhookData.get("code"),
                    webhookData.get("desc"),
                    webhookData.get("id"),
                    webhookData.get("orderCode"),
                    webhookData.get("status"),
                    webhookData.get("timestamp")
            );

            String signature = hmacSHA256(checksumKey, data);
            String receivedSignature = (String) webhookData.get("signature");

            return signature.equals(receivedSignature);
        } catch (Exception e) {
            return false;
        }
    }

    private String hmacSHA256(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * bytes.length);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error calculating HMAC SHA256", e);
        }
    }
}

