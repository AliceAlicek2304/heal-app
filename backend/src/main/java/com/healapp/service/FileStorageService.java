package com.healapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Service for handling file storage operations
 */
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
        this.avatarStoragePath = Paths.get(avatarStorageLocation).toAbsolutePath().normalize();
        this.blogStoragePath = Paths.get(blogStorageLocation).toAbsolutePath().normalize();
        this.configStoragePath = Paths.get(configStorageLocation).toAbsolutePath().normalize();
        try {
            Files.createDirectories(avatarStoragePath);
            Files.createDirectories(blogStoragePath);
            Files.createDirectories(configStoragePath);
            createDefaultAvatar();
        } catch (IOException e) {
            throw new RuntimeException("Could not create storage directories", e);
        }
    }

    private void createDefaultAvatar() throws IOException {
        Path defaultAvatarPath = avatarStoragePath.resolve("default.jpg");

        if (!Files.exists(defaultAvatarPath)) {
            try {
                ClassPathResource resource = new ClassPathResource("static/img/default-avatar.jpg");
                InputStream inputStream = resource.getInputStream();
                Files.copy(inputStream, defaultAvatarPath, StandardCopyOption.REPLACE_EXISTING);
                inputStream.close();
            } catch (Exception e) {
                Files.createFile(defaultAvatarPath);
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

        Path targetLocation = avatarStoragePath.resolve(uniqueFileName);

        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

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

        Path targetLocation = blogStoragePath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

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

        Path targetLocation = avatarStoragePath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return avatarUrlPattern + uniqueFileName;
    }

    public void deleteFile(String filePath) throws IOException {
        if (filePath == null || filePath.isEmpty()) {
            return;
        }

        // Lấy tên file từ URL path
        String fileName = extractFileNameFromPath(filePath);
        if (fileName == null || fileName.equals("default.jpg")) {
            return; // Không xóa file default
        }

        // Xác định thư mục chứa file
        Path targetPath = null;
        if (filePath.contains(avatarUrlPattern)) {
            targetPath = avatarStoragePath.resolve(fileName);
        } else if (filePath.contains(blogUrlPattern)) {
            targetPath = blogStoragePath.resolve(fileName);
        } else if (filePath.contains(configUrlPattern)) {
            targetPath = configStoragePath.resolve(fileName);
        }

        // Xóa file nếu tồn tại
        if (targetPath != null && Files.exists(targetPath)) {
            Files.delete(targetPath);
        }
    }

    private String extractFileNameFromPath(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }

        // Lấy phần cuối cùng sau dấu /
        int lastSlashIndex = filePath.lastIndexOf('/');
        if (lastSlashIndex != -1 && lastSlashIndex < filePath.length() - 1) {
            return filePath.substring(lastSlashIndex + 1);
        }

        return null;
    }

    public String saveImageFile(MultipartFile file, String fileKey) throws IOException {
        // Tạo tên file unique
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);

        String fileName = fileKey + "_" + System.currentTimeMillis() + fileExtension;

        Path targetLocation = configStoragePath.resolve(fileName);

        // Lưu file
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        // Trả về URL path
        return configUrlPattern + fileName;
    }

    // lấy đuôi file
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
}