package www.java.client.controller;

import www.java.client.service.UploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/api/upload")
public class UploadController {
    
    private static final Logger logger = LoggerFactory.getLogger(UploadController.class);
    private final UploadService uploadService;
    
    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }
    
    @PostMapping
    @ResponseBody
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "resourceType", required = false, defaultValue = "image") String resourceType,
            @RequestParam(value = "module", required = false, defaultValue = "shared") String module,
            @RequestParam(value = "entityId", required = false) String entityId,
            @RequestParam(value = "purpose", required = false, defaultValue = "file") String purpose) {
        
        logger.info("UploadController.upload() called");
        logger.info("File: {}, resourceType: {}, module: {}, entityId: {}, purpose: {}", 
                   file.getOriginalFilename(), resourceType, module, entityId, purpose);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (file == null || file.isEmpty()) {
                response.put("status", "error");
                response.put("message", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }
            
            String secureUrl = uploadService.uploadFile(file, resourceType, module, entityId, purpose);
            
            if (secureUrl != null && !secureUrl.trim().isEmpty()) {
                response.put("status", "success");
                response.put("message", "Upload successful");
                response.put("url", secureUrl);
                logger.info("Upload successful: {}", secureUrl);
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "error");
                response.put("message", "Upload failed - no URL returned");
                logger.error("Upload failed - no URL returned");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
        } catch (Exception e) {
            logger.error("Exception during upload: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "Upload failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

