package com.example.learnspring1.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MultipartFile;

import com.example.learnspring1.domain.APIResponse;
import com.example.learnspring1.domain.dto.UploadResponseDTO;
import com.example.learnspring1.service.UploadService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/uploads")
@Tag(name = "Uploads", description = "Upload files to Cloudinary (image/video/raw)")
public class UploadController {

    private static final Logger logger = LoggerFactory.getLogger(UploadController.class);
    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @Operation(summary = "Upload file", description = "Upload a file to Cloudinary. Supports image, video, raw.")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public APIResponse<UploadResponseDTO> upload(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "resourceType", required = false, defaultValue = "image") String resourceType,
        @RequestParam(value = "module", required = false, defaultValue = "shared") String module,
        @RequestParam(value = "entityId", required = false) String entityId,
        @RequestParam(value = "purpose", required = false, defaultValue = "file") String purpose
    ) {
        try {
            logger.info("Upload request - resourceType: {}, module: {}, entityId: {}, filename: {}", 
                resourceType, module, entityId, file.getOriginalFilename());
            
            UploadResponseDTO dto = uploadService.upload(file, resourceType, module, entityId, purpose);
            logger.info("Upload completed successfully - publicId: {}, url: {}", dto.getPublicId(), dto.getSecureUrl());
            
            return new APIResponse<>(HttpStatus.OK, "Upload thành công", dto, null);
        } catch (IllegalArgumentException e) {
            logger.warn("Validation error during upload: {}", e.getMessage());
            return new APIResponse<>(HttpStatus.BAD_REQUEST, e.getMessage(), null, null);
        } catch (RuntimeException e) {
            logger.error("Upload error: {}", e.getMessage(), e);
            return new APIResponse<>(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), null, null);
        } catch (Exception e) {
            logger.error("Unexpected error during upload", e);
            return new APIResponse<>(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi server không mong muốn", null, null);
        }
    }
}


