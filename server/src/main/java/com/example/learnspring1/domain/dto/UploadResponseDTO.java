package com.example.learnspring1.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponseDTO {
    private String secureUrl;
    private String publicId;
    private String resourceType;
    private String format;
    private Long bytes;
    private Integer width;
    private Integer height;
    private Double duration; // for video (seconds), null otherwise
    private String folder;
    private String originalFilename;
    private String etag;
}


