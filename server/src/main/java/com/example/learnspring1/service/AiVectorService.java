package com.example.learnspring1.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AiVectorService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${ai.chroma.url:http://127.0.0.1:8000}")
    private String chromaUrl;

    @Value("${ai.chroma.collection:products}")
    private String chromaCollectionName;

    private String getEnv(String key, String defaultValue) {
        String v = System.getenv(key);
        return v != null ? v : defaultValue;
    }

    public List<Double> embedWithGemini(String text) {
        String apiKey = geminiApiKey != null && !geminiApiKey.isEmpty() 
                ? geminiApiKey 
                : getEnv("GEMINI_API_KEY", "");
        if (apiKey.isEmpty()) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured. Set ai.gemini.api-key in application.properties or GEMINI_API_KEY environment variable");
        }
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Text cannot be empty");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" + apiKey;

        Map<String, Object> body = Map.of(
                "model", "models/text-embedding-004",
                "content", Map.of(
                        "parts", Collections.singletonList(Map.of("text", text))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        GeminiEmbedResponse resp = restTemplate.postForObject(url, entity, GeminiEmbedResponse.class);
        if (resp == null || resp.embedding == null || resp.embedding.values == null) {
            throw new IllegalStateException("Invalid embedding response from Gemini");
        }
        return resp.embedding.values;
    }

    public ChromaQueryResponse queryChroma(List<Double> embedding, Long categoryId, int limit) {
        String url = chromaUrl != null && !chromaUrl.isEmpty() 
                ? chromaUrl 
                : System.getenv("CHROMA_URL");
        if (url == null || url.isEmpty()) {
            url = "http://127.0.0.1:8000";
        }
        String collection = chromaCollectionName != null && !chromaCollectionName.isEmpty()
                ? chromaCollectionName
                : System.getenv("CHROMA_COLLECTION");
        if (collection == null || collection.isEmpty()) {
            collection = "products";
        }

        String baseUrl = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;

        Map<String, Object> body;
        if (categoryId != null) {
            body = Map.of(
                    "query_embeddings", Collections.singletonList(embedding),
                    "n_results", limit,
                    "where", Map.of("categoryId", categoryId)
            );
        } else {
            body = Map.of(
                    "query_embeddings", Collections.singletonList(embedding),
                    "n_results", limit
            );
        }

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize request body: " + e.getMessage(), e);
        }
        RequestBody requestBody = RequestBody.create(jsonBody, okhttp3.MediaType.parse("application/json"));
        String lastError = "No attempt made";
        String collectionId = "c628af00-596c-4dd6-877d-67ca7aaca57f";
        
        try {
            String queryUrl = baseUrl + "/api/v2/tenants/default_tenant/databases/default_database/collections/" + collectionId + "/query";
            Request request = new Request.Builder()
                    .url(queryUrl)
                    .post(requestBody)
                    .addHeader("Content-Type", "application/json")
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : null;
                if (response.isSuccessful() && responseBody != null) {
                    ChromaQueryResponse result = objectMapper.readValue(responseBody, ChromaQueryResponse.class);
                    if (result.ids == null) result.ids = Collections.emptyList();
                    if (result.distances == null) result.distances = Collections.emptyList();
                    return result;
                } else {
                    lastError = "v2 API (correct endpoint): " + response.code() + " " + response.message() + " - " + (responseBody != null ? responseBody : "[no body]");
                }
            }
        } catch (IOException e) {
            lastError = "v2 API (correct endpoint): " + e.getMessage();
        }

        throw new IllegalStateException("Failed to query ChromaDB. Last error: " + lastError);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeminiEmbedResponse {
        public Embedding embedding;

        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Embedding {
            public List<Double> values;
        }
    }

    public List<List<Double>> getEmbeddingsByProductIds(List<String> productIds) {
        String url = chromaUrl != null && !chromaUrl.isEmpty() 
                ? chromaUrl 
                : System.getenv("CHROMA_URL");
        if (url == null || url.isEmpty()) {
            url = "http://127.0.0.1:8000";
        }

        String baseUrl = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
        Map<String, Object> body = Map.of(
            "ids", productIds,
            "include", List.of("embeddings")
        );
        String collectionId = "c628af00-596c-4dd6-877d-67ca7aaca57f";

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            RequestBody requestBody = RequestBody.create(jsonBody, okhttp3.MediaType.parse("application/json"));
            String getUrl = baseUrl + "/api/v2/tenants/default_tenant/databases/default_database/collections/" + collectionId + "/get";
            Request request = new Request.Builder()
                    .url(getUrl)
                    .post(requestBody)
                    .addHeader("Content-Type", "application/json")
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : null;
                if (response.isSuccessful() && responseBody != null) {
                    ChromaGetResponse resp = objectMapper.readValue(responseBody, ChromaGetResponse.class);
                    if (resp != null && resp.embeddings != null) {
                        return resp.embeddings.stream()
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());
                    } else {
                        String errorMsg = "ChromaDB response has no embeddings. Response: " + (responseBody != null ? responseBody.substring(0, Math.min(200, responseBody.length())) : "[no body]");
                        throw new IllegalStateException(errorMsg);
                    }
                } else {
                    String errorMsg = "ChromaDB get failed. Code: " + response.code() + ", Body: " + (responseBody != null ? responseBody.substring(0, Math.min(200, responseBody.length())) : "[no body]");
                    throw new IllegalStateException(errorMsg);
                }
            }
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize request body: " + e.getMessage(), e);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to get embeddings from ChromaDB: " + e.getMessage(), e);
        }
    }

    public List<Double> averageVectors(List<List<Double>> vectors) {
        if (vectors == null || vectors.isEmpty()) {
            throw new IllegalArgumentException("Vectors list cannot be empty");
        }

        List<List<Double>> validVectors = vectors.stream()
                .filter(v -> v != null && !v.isEmpty())
                .filter(v -> v.size() == vectors.get(0).size())
                .collect(Collectors.toList());

        if (validVectors.isEmpty()) {
            throw new IllegalArgumentException("No valid vectors found");
        }

        int dimension = validVectors.get(0).size();
        List<Double> average = new java.util.ArrayList<>(Collections.nCopies(dimension, 0.0));

        for (List<Double> vector : validVectors) {
            for (int i = 0; i < dimension; i++) {
                average.set(i, average.get(i) + vector.get(i));
            }
        }

        int count = validVectors.size();
        for (int i = 0; i < dimension; i++) {
            average.set(i, average.get(i) / count);
        }
        double magnitude = Math.sqrt(average.stream().mapToDouble(d -> d * d).sum());
        if (magnitude > 0) {
            for (int i = 0; i < dimension; i++) {
                average.set(i, average.get(i) / magnitude);
            }
        }

        return average;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ChromaQueryResponse {
        public List<List<String>> ids;
        @JsonProperty("distances")
        public List<List<Double>> distances;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ChromaGetResponse {
        public List<List<Double>> embeddings;
    }
}
