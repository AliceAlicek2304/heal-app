package com.healapp.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for handling file storage operations Uses local storage with file
 * serving via FileServeController Optimized for Render free tier deployment
 */
@Slf4j
@Service
public class FileStorageService {

    @Value("${app.avatar.storage.location}")
    private String avatarStorageLocation;

    @Value("${app.avatar.url.pattern}")
    private String avatarUrlPattern;

    @Value("${app.blog.storage.location}")
    private String blogStorageLocation;

    @Value("${app.blog.url.pattern}")
    private String blogUrlPattern;

    @Value("${app.config.storage.location}")
    private String configStorageLocation;

    @Value("${app.config.url.pattern}")
    private String configUrlPattern;

    private Path avatarStoragePath;
    private Path blogStoragePath;
    private Path configStoragePath;

    @PostConstruct
    public void init() {
        log.info("💾 Using local file storage for file operations");
        initializeLocalPaths();
    }

    private void initializeLocalPaths() {
        this.avatarStoragePath = Paths.get(avatarStorageLocation).toAbsolutePath().normalize();
        this.blogStoragePath = Paths.get(blogStorageLocation).toAbsolutePath().normalize();
        this.configStoragePath = Paths.get(configStorageLocation).toAbsolutePath().normalize();

        try {
            Files.createDirectories(avatarStoragePath);
            Files.createDirectories(blogStoragePath);
            Files.createDirectories(configStoragePath);
            createDefaultAvatar();
            log.info("✅ Local storage directories created successfully");
        } catch (IOException e) {
            log.error("❌ Could not create local storage directories: {}", e.getMessage());
            throw new RuntimeException("Could not create storage directories", e);
        }
    }

    private void createDefaultAvatar() throws IOException {
        Path defaultAvatarPath = avatarStoragePath.resolve("default.jpg");

        if (!Files.exists(defaultAvatarPath)) {
            try (InputStream inputStream = new ClassPathResource("static/img/default-avatar.jpg").getInputStream()) {
                Files.copy(inputStream, defaultAvatarPath, StandardCopyOption.REPLACE_EXISTING);
                log.debug("📸 Default avatar created");
            } catch (IOException e) {
                // Create empty file as fallback
                Files.createFile(defaultAvatarPath);
                log.warn("⚠️ Created empty default avatar file as fallback: {}", e.getMessage());
            }
        }
    }

    public String storeAvatar(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return avatarUrlPattern + "default.jpg";
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uniqueFileName = UUID.randomUUID().toString().substring(0, 8) + "_" + timestamp + fileExtension;

        // Local storage implementation
        Path targetLocation = avatarStoragePath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        log.debug("💾 Avatar stored locally: {}", uniqueFileName);
        return avatarUrlPattern + uniqueFileName;
    }

    public String storeBlogImage(MultipartFile file, String prefix) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uniqueFileName = prefix + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + timestamp
                + fileExtension;

        // Local storage implementation
        Path targetLocation = blogStoragePath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        log.debug("💾 Blog image stored locally: {}", uniqueFileName);
        return blogUrlPattern + uniqueFileName;
    }

    public String storeBlogThumbnail(MultipartFile file) throws IOException {
        return storeBlogImage(file, "thumb");
    }

    public String storeBlogSectionImage(MultipartFile file, int sectionOrder) throws IOException {
        return storeBlogImage(file, "section" + sectionOrder);
    }

    public String saveAvatarFile(MultipartFile file, Long userId) throws IOException {
        if (file == null || file.isEmpty()) {
            return avatarUrlPattern + "default.jpg";
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uniqueFileName = "user_" + userId + "_" + timestamp + fileExtension;

        // Local storage implementation
        Path targetLocation = avatarStoragePath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        log.debug("💾 User avatar stored locally: {}", uniqueFileName);
        return avatarUrlPattern + uniqueFileName;
    }

    public void deleteFile(String filePath) throws IOException {
        if (filePath == null || filePath.isEmpty()) {
            return;
        }

        // Extract filename
        String fileName = extractFileNameFromPath(filePath);
        if (fileName == null || fileName.equals("default.jpg")) {
            return; // Don't delete default files
        }

        // Local storage deletion
        Path targetPath = null;
        if (filePath.contains(avatarUrlPattern)) {
            targetPath = avatarStoragePath.resolve(fileName);
        } else if (filePath.contains(blogUrlPattern)) {
            targetPath = blogStoragePath.resolve(fileName);
        } else if (filePath.contains(configUrlPattern)) {
            targetPath = configStoragePath.resolve(fileName);
        }

        if (targetPath != null && Files.exists(targetPath)) {
            Files.delete(targetPath);
            log.debug("💾 File deleted locally: {}", fileName);
        }
    }

    private String extractFileNameFromPath(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }

        int lastSlashIndex = filePath.lastIndexOf('/');
        if (lastSlashIndex != -1 && lastSlashIndex < filePath.length() - 1) {
            return filePath.substring(lastSlashIndex + 1);
        }

        return null;
    }

    public String saveImageFile(MultipartFile file, String fileKey) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String fileName = fileKey + "_" + System.currentTimeMillis() + fileExtension;

        // Local storage implementation
        Path targetLocation = configStoragePath.resolve(fileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        log.debug("💾 Config image stored locally: {}", fileName);
        return configUrlPattern + fileName;
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int lastIndexOf = fileName.lastIndexOf(".");
        if (lastIndexOf == -1) {
            return "";
        }
        return fileName.substring(lastIndexOf);
    }

    // Helper method for health checks
    public String getStorageInfo() {
        return "💾 Local File Storage (Render optimized)";
    }
}
