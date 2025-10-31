package com.example.learnspring1.service.impl;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.learnspring1.domain.dto.UploadResponseDTO;
import com.example.learnspring1.service.UploadService;

@Service
public class UploadServiceImpl implements UploadService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.default_folder:app/dev}")
    private String defaultFolder;

    @Value("${cloudinary.allowed_image_formats:jpg,png,webp,avif}")
    private String allowedImageFormats;

    @Value("${cloudinary.allowed_video_formats:mp4,webm}")
    private String allowedVideoFormats;

    @Value("${cloudinary.allowed_raw_formats:pdf,docx,zip}")
    private String allowedRawFormats;

    @Value("${cloudinary.max_image_bytes:2097152}")
    private long maxImageBytes;

    @Value("${cloudinary.max_video_bytes:52428800}")
    private long maxVideoBytes;

    @Value("${cloudinary.max_raw_bytes:10485760}")
    private long maxRawBytes;

    public UploadServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public UploadResponseDTO upload(MultipartFile file, String resourceType, String module, String entityId, String purpose) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String type = normalizeResourceType(resourceType);
        validateFile(file, type);

        String folder = buildFolder(module, entityId);
        String publicId = buildPublicId(purpose);

        Map options = ObjectUtils.asMap(
            "folder", folder,
            "public_id", publicId,
            "overwrite", false,
            "resource_type", type
        );

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> res = (Map<String, Object>) cloudinary.uploader().upload(file.getBytes(), options);

            return UploadResponseDTO.builder()
                .secureUrl((String) res.get("secure_url"))
                .publicId((String) res.get("public_id"))
                .resourceType((String) res.get("resource_type"))
                .format((String) res.get("format"))
                .bytes(castLong(res.get("bytes")))
                .width(castInt(res.get("width")))
                .height(castInt(res.get("height")))
                .duration(castDouble(res.get("duration")))
                .folder(folder)
                .originalFilename(file.getOriginalFilename())
                .etag((String) res.get("etag"))
                .build();
        } catch (IOException ex) {
            throw new RuntimeException("Upload to Cloudinary failed: " + ex.getMessage(), ex);
        }
    }

    private String normalizeResourceType(String resourceType) {
        String type = (resourceType == null || resourceType.isBlank()) ? "image" : resourceType.toLowerCase();
        if (!type.equals("image") && !type.equals("video") && !type.equals("raw")) {
            throw new IllegalArgumentException("resourceType must be image|video|raw");
        }
        return type;
    }

    private void validateFile(MultipartFile file, String type) {
        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains(".")) ? original.substring(original.lastIndexOf('.') + 1).toLowerCase() : "";
        long size = file.getSize();

        if (type.equals("image")) {
            ensureAllowed(ext, allowedImageFormats);
            if (size > maxImageBytes) throw new IllegalArgumentException("Image exceeds max size");
        } else if (type.equals("video")) {
            ensureAllowed(ext, allowedVideoFormats);
            if (size > maxVideoBytes) throw new IllegalArgumentException("Video exceeds max size");
        } else {
            ensureAllowed(ext, allowedRawFormats);
            if (size > maxRawBytes) throw new IllegalArgumentException("File exceeds max size");
        }
    }

    private void ensureAllowed(String ext, String allowedCsv) {
        List<String> allowed = Arrays.stream(allowedCsv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (!allowed.contains(ext)) {
            throw new IllegalArgumentException("File type not allowed: ." + ext);
        }
    }

    private String buildFolder(String module, String entityId) {
        StringBuilder sb = new StringBuilder();
        sb.append(StringUtils.hasText(defaultFolder) ? defaultFolder : "app");
        if (StringUtils.hasText(module)) {
            sb.append('/').append(module);
        }
        if (StringUtils.hasText(entityId)) {
            sb.append('/').append(entityId);
        }
        return sb.toString();
    }

    private String buildPublicId(String purpose) {
        String p = StringUtils.hasText(purpose) ? purpose.toLowerCase().replaceAll("[^a-z0-9_-]", "-") : "file";
        return p + "_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private Long castLong(Object v) { return v == null ? null : ((Number) v).longValue(); }
    private Integer castInt(Object v) { return v == null ? null : ((Number) v).intValue(); }
    private Double castDouble(Object v) { return v == null ? null : ((Number) v).doubleValue(); }
}


