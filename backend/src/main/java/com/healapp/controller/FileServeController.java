package com.healapp.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

/**
 * Controller for serving uploaded files on Render
 * Since Render free plan doesn't have persistent storage,
 * this serves files from the temporary upload directories
 */
@Slf4j
@RestController
@RequestMapping("/uploads")
public class FileServeController {

    private static final String UPLOAD_BASE_PATH = "/app/uploads";

    @GetMapping("/avatar/{filename:.+}")
    public ResponseEntity<Resource> serveAvatar(@PathVariable String filename) {
        return serveFile("avatar", filename);
    }

    @GetMapping("/blog/{filename:.+}")
    public ResponseEntity<Resource> serveBlogImage(@PathVariable String filename) {
        return serveFile("blog", filename);
    }

    @GetMapping("/config/{filename:.+}")
    public ResponseEntity<Resource> serveConfig(@PathVariable String filename) {
        return serveFile("config", filename);
    }

    private ResponseEntity<Resource> serveFile(String category, String filename) {
        try {
            // Security check: prevent directory traversal
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                log.warn("🚨 Security violation: Invalid filename attempted: {}", filename);
                return ResponseEntity.badRequest().build();
            }

            Path filePath = Paths.get(UPLOAD_BASE_PATH, category, filename);
            
            // Check if file exists
            if (!Files.exists(filePath)) {
                log.debug("📁 File not found: {}", filePath);
                // For avatar, try to serve default
                if ("avatar".equals(category) && "default.jpg".equals(filename)) {
                    return serveDefaultAvatar();
                }
                return ResponseEntity.notFound().build();
            }

            // Check if it's a file (not directory)
            if (!Files.isRegularFile(filePath)) {
                log.warn("🚨 Attempted to serve non-file: {}", filePath);
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new FileSystemResource(filePath);
            
            // Determine content type
            String contentType = determineContentType(filename);
            
            // Set cache headers for better performance
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setCacheControl("public, max-age=31536000"); // 1 year cache
            
            log.debug("📄 Serving file: {} ({})", filename, contentType);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            log.error("❌ Error serving file {}/{}: {}", category, filename, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    private ResponseEntity<Resource> serveDefaultAvatar() {
        try {
            // Try to serve from classpath
            org.springframework.core.io.ClassPathResource classPathResource = 
                new org.springframework.core.io.ClassPathResource("static/img/default-avatar.jpg");
            
            if (classPathResource.exists()) {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.IMAGE_JPEG);
                headers.setCacheControl("public, max-age=86400"); // 1 day cache for default
                
                log.debug("📸 Serving default avatar from classpath");
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(classPathResource);
            }
            
            log.warn("⚠️ Default avatar not found in classpath");
            return ResponseEntity.notFound().build();
            
        } catch (Exception e) {
            log.error("❌ Error serving default avatar: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    private String determineContentType(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        
        switch (extension) {
            case ".jpg":
            case ".jpeg":
                return "image/jpeg";
            case ".png":
                return "image/png";
            case ".gif":
                return "image/gif";
            case ".webp":
                return "image/webp";
            case ".svg":
                return "image/svg+xml";
            case ".pdf":
                return "application/pdf";
            case ".txt":
                return "text/plain";
            case ".css":
                return "text/css";
            case ".js":
                return "application/javascript";
            default:
                return "application/octet-stream";
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        
        return filename.substring(lastDotIndex);
    }

    /**
     * Health check endpoint for file serving
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        try {
            Path uploadPath = Paths.get(UPLOAD_BASE_PATH);
            boolean uploadsExist = Files.exists(uploadPath);
            
            String status = uploadsExist ? 
                "✅ File serving is operational" : 
                "⚠️ Upload directory not found (will be created on first upload)";
                
            log.debug("🔍 File serving health check: {}", status);
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            log.error("❌ File serving health check failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body("❌ File serving is not operational: " + e.getMessage());
        }
    }
}
