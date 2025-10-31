package com.example.learnspring1.service;

import org.springframework.web.multipart.MultipartFile;

import com.example.learnspring1.domain.dto.UploadResponseDTO;

public interface UploadService {

    UploadResponseDTO upload(
        MultipartFile file,
        String resourceType, // image | video | raw
        String module,
        String entityId,
        String purpose
    );
}


