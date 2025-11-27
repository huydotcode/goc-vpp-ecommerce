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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UploadServiceImpl implements UploadService {

    private static final Logger logger = LoggerFactory.getLogger(UploadServiceImpl.class);
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
        try {
            // Validate file exists
            if (file == null || file.isEmpty()) {
                logger.warn("Upload attempt with empty file");
                throw new IllegalArgumentException("File không được để trống");
            }

            // Validate filename
            String filename = file.getOriginalFilename();
            if (filename == null || filename.trim().isEmpty()) {
                logger.warn("Upload attempt with missing filename");
                throw new IllegalArgumentException("Tên file không hợp lệ");
            }

            String type = normalizeResourceType(resourceType);
            validateFile(file, type);

            String folder = buildFolder(module, entityId);
            String publicId = buildPublicId(purpose);

            logger.debug("Starting upload: folder={}, publicId={}, type={}, filename={}", folder, publicId, type, filename);

            Map options = ObjectUtils.asMap(
                "folder", folder,
                "public_id", publicId,
                "overwrite", false,
                "resource_type", type
            );

            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> res = (Map<String, Object>) cloudinary.uploader().upload(file.getBytes(), options);

                logger.info("File uploaded successfully: publicId={}, url={}", publicId, res.get("secure_url"));

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
                logger.error("Cloudinary upload failed for file: " + filename, ex);
                throw new RuntimeException("Lỗi khi upload lên Cloudinary: " + ex.getMessage(), ex);
            }
        } catch (IllegalArgumentException e) {
            logger.warn("Validation error during upload: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during upload", e);
            throw new RuntimeException("Lỗi không mong muốn khi upload: " + e.getMessage(), e);
        }
    }

    private String normalizeResourceType(String resourceType) {
        String type = (resourceType == null || resourceType.isBlank()) ? "image" : resourceType.toLowerCase().trim();
        if (!type.equals("image") && !type.equals("video") && !type.equals("raw")) {
            logger.warn("Invalid resource type: {}", resourceType);
            throw new IllegalArgumentException("Loại tài nguyên phải là: image | video | raw");
        }
        return type;
    }

    private void validateFile(MultipartFile file, String type) {
        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains(".")) 
            ? original.substring(original.lastIndexOf('.') + 1).toLowerCase().trim() 
            : "";
        long size = file.getSize();

        // Validate extension
        if (ext.isEmpty()) {
            logger.warn("File without extension: {}", original);
            throw new IllegalArgumentException("File phải có đuôi mở rộng hợp lệ");
        }

        if (type.equals("image")) {
            ensureAllowed(ext, allowedImageFormats, "Định dạng ảnh");
            if (size > maxImageBytes) {
                long maxMB = maxImageBytes / (1024 * 1024);
                logger.warn("Image file too large: {} bytes (max: {} bytes)", size, maxImageBytes);
                throw new IllegalArgumentException("Kích thước ảnh không được vượt quá " + maxMB + "MB");
            }
        } else if (type.equals("video")) {
            ensureAllowed(ext, allowedVideoFormats, "Định dạng video");
            if (size > maxVideoBytes) {
                long maxMB = maxVideoBytes / (1024 * 1024);
                logger.warn("Video file too large: {} bytes (max: {} bytes)", size, maxVideoBytes);
                throw new IllegalArgumentException("Kích thước video không được vượt quá " + maxMB + "MB");
            }
        } else {
            ensureAllowed(ext, allowedRawFormats, "Định dạng file");
            if (size > maxRawBytes) {
                long maxMB = maxRawBytes / (1024 * 1024);
                logger.warn("File too large: {} bytes (max: {} bytes)", size, maxRawBytes);
                throw new IllegalArgumentException("Kích thước file không được vượt quá " + maxMB + "MB");
            }
        }
    }

    private void ensureAllowed(String ext, String allowedCsv, String fileTypeName) {
        List<String> allowed = Arrays.stream(allowedCsv.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
        
        if (!allowed.contains(ext)) {
            logger.warn("File extension not allowed: {} (allowed: {})", ext, allowed);
            throw new IllegalArgumentException(fileTypeName + " không được hỗ trợ: ." + ext + 
                ". Các định dạng được hỗ trợ: " + String.join(", ", allowed));
        }
    }

    private String buildFolder(String module, String entityId) {
        StringBuilder sb = new StringBuilder();
        sb.append(StringUtils.hasText(defaultFolder) ? defaultFolder : "app");
        if (StringUtils.hasText(module)) {
            sb.append('/').append(module.toLowerCase().replaceAll("[^a-z0-9_/-]", ""));
        }
        if (StringUtils.hasText(entityId)) {
            sb.append('/').append(entityId.replaceAll("[^a-z0-9_/-]", ""));
        }
        return sb.toString();
    }

    private String buildPublicId(String purpose) {
        String p = StringUtils.hasText(purpose) 
            ? purpose.toLowerCase().replaceAll("[^a-z0-9_-]", "-") 
            : "file";
        return p + "_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private Long castLong(Object v) { return v == null ? null : ((Number) v).longValue(); }
    private Integer castInt(Object v) { return v == null ? null : ((Number) v).intValue(); }
    private Double castDouble(Object v) { return v == null ? null : ((Number) v).doubleValue(); }
}


