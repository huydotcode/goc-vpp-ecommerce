package com.example.learnspring1.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.learnspring1.domain.APIResponse;
import com.example.learnspring1.domain.dto.UploadResponseDTO;
import com.example.learnspring1.service.UploadService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/uploads")
@Tag(name = "Uploads", description = "Upload files to Cloudinary (image/video/raw)")
public class UploadController {

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
        UploadResponseDTO dto = uploadService.upload(file, resourceType, module, entityId, purpose);
        return new APIResponse<>(HttpStatus.OK, "Uploaded successfully", dto, null);
    }
}


