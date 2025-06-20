package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.model.AppConfig;
import com.healapp.model.UserDtls;
import com.healapp.repository.AppConfigRepository;
import com.healapp.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class AppConfigService {

    @Autowired
    private AppConfigRepository appConfigRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;



    /**
     * Lấy cấu hình hiện tại (PUBLIC API)
     */
    public ApiResponse<Map<String, String>> getCurrentConfig() {
        try {
            Map<String, String> configMap = getAllConfigAsMap();

            return ApiResponse.success("App configuration retrieved successfully", configMap);

        } catch (Exception e) {
            log.error("Error retrieving app configuration: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve app configuration: " + e.getMessage());
        }
    }

    /**
     * Cập nhật cấu hình từ form client (ADMIN ONLY)
     */
    public ApiResponse<Map<String, String>> updateMultipleConfigs(Map<String, String> configData, Long adminUserId) {
        try {
            // Kiểm tra admin user
            Optional<UserDtls> adminOpt = userRepository.findById(adminUserId);
            if (adminOpt.isEmpty() || !adminOpt.get().getRole().equals("ADMIN")) {
                return ApiResponse.error("Only ADMIN can update configuration");
            }

            UserDtls admin = adminOpt.get();

            // Cập nhật từng config
            for (Map.Entry<String, String> entry : configData.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();

                if (value != null && !value.trim().isEmpty()) {
                    setConfigValue(key, value.trim(), getDescriptionForKey(key), admin);
                }
            }

            Map<String, String> updatedConfig = getAllConfigAsMap();

            log.info("Multiple configs updated by admin: {}", admin.getUsername());
            return ApiResponse.success("All configurations updated successfully", updatedConfig);

        } catch (Exception e) {
            log.error("Error updating multiple configs: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update configurations: " + e.getMessage());
        }
    }

    public ApiResponse<String> addNewConfig(String key, String value, Long adminUserId) {
        try {
            // Kiểm tra admin user
            Optional<UserDtls> adminOpt = userRepository.findById(adminUserId);
            if (adminOpt.isEmpty() || !adminOpt.get().getRole().equals("ADMIN")) {
                return ApiResponse.error("Only ADMIN can add new configuration");
            }

            // Kiểm tra key đã tồn tại chưa (cả active và inactive)
            Optional<AppConfig> existingConfig = appConfigRepository.findByConfigKey(key);
            if (existingConfig.isPresent()) {
                return ApiResponse.error("Configuration key '" + key + "' already exists");
            }

            UserDtls admin = adminOpt.get();

            // Tạo config mới
            AppConfig newConfig = new AppConfig();
            newConfig.setConfigKey(key);
            newConfig.setConfigValue(value);
            newConfig.setDescription(getDescriptionForKey(key));
            newConfig.setIsActive(true);
            newConfig.setUpdatedBy(admin);

            // Lưu config
            appConfigRepository.save(newConfig);

            log.info("New config '{}' added with value '{}' by admin: {}", key, value, admin.getUsername());

            // Return config value as data
            return ApiResponse.success("Configuration added successfully", value);
        } catch (Exception e) {
            log.error("Error adding new config: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to add configuration: " + e.getMessage());
        }
    }

    public ApiResponse<String> uploadConfigFile(String key, MultipartFile file, Long adminUserId) {
        try {
            // Kiểm tra admin user
            Optional<UserDtls> adminOpt = userRepository.findById(adminUserId);
            if (adminOpt.isEmpty() || !adminOpt.get().getRole().equals("ADMIN")) {
                return ApiResponse.error("Only ADMIN can upload config files");
            }

            if (file == null || file.isEmpty()) {
                return ApiResponse.error("File cannot be empty");
            }

            if (!isValidImageFile(file)) {
                return ApiResponse.error("File must be a valid image file (JPG, PNG, GIF)");
            }

            // Xóa file cũ nếu có
            String oldFilePath = getConfigValue(key);
            if (oldFilePath != null && !oldFilePath.isEmpty()) {
                try {
                    fileStorageService.deleteFile(oldFilePath);
                } catch (Exception e) {
                    log.warn("Failed to delete old file for key '{}': {}", key, oldFilePath);
                }
            }

            // Lưu file mới
            String newFilePath = fileStorageService.saveImageFile(file, key);

            UserDtls admin = adminOpt.get();
            setConfigValue(key, newFilePath, getDescriptionForKey(key), admin);

            log.info("File uploaded for config '{}' by admin: {}", key, admin.getUsername());
            return ApiResponse.success("File uploaded successfully", newFilePath);

        } catch (Exception e) {
            log.error("Error uploading config file: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to upload file: " + e.getMessage());
        }
    }

    public ApiResponse<String> toggleConfigStatus(String key, boolean isActive, Long adminUserId) {
        try {
            // Kiểm tra admin user
            Optional<UserDtls> adminOpt = userRepository.findById(adminUserId);
            if (adminOpt.isEmpty() || !adminOpt.get().getRole().equals("ADMIN")) {
                return ApiResponse.error("Only ADMIN can change configuration status");
            }

            // Tìm config (bao gồm cả inactive)
            Optional<AppConfig> configOpt = appConfigRepository.findByConfigKey(key);
            if (configOpt.isEmpty()) {
                return ApiResponse.error("Configuration key not found: " + key);
            }

            AppConfig config = configOpt.get();
            UserDtls admin = adminOpt.get();

            // Kiểm tra trạng thái hiện tại
            if (config.getIsActive().equals(isActive)) {
                String status = isActive ? "active" : "inactive";
                return ApiResponse.error("Configuration is already " + status + ": " + key);
            }

            // Cập nhật trạng thái
            config.setIsActive(isActive);
            config.setUpdatedBy(admin);
            appConfigRepository.save(config);

            // Xử lý file nếu đang set inactive
            if (!isActive) {
                String filePath = config.getConfigValue();
                if (filePath != null && !filePath.isEmpty() &&
                        (filePath.startsWith("/uploads/") || filePath.startsWith("uploads/"))) {
                    try {
                        fileStorageService.deleteFile(filePath);
                        log.info("Deleted file for inactive config '{}': {}", key, filePath);
                    } catch (Exception e) {
                        log.warn("Failed to delete file for config '{}': {}", key, filePath);
                    }
                }
            }

            String action = isActive ? "activated" : "deactivated";
            log.info("Config '{}' {} by admin: {}", key, action, admin.getUsername());
            return ApiResponse.success("Configuration " + action + " successfully", null);

        } catch (Exception e) {
            log.error("Error toggling config status: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to change configuration status: " + e.getMessage());
        }
    }

    public ApiResponse<String> deleteConfig(String key, Long adminUserId) {
        try {
            // Kiểm tra admin user
            Optional<UserDtls> adminOpt = userRepository.findById(adminUserId);
            if (adminOpt.isEmpty() || !adminOpt.get().getRole().equals("ADMIN")) {
                return ApiResponse.error("Only ADMIN can delete configuration");
            }

            Optional<AppConfig> configOpt = appConfigRepository.findByConfigKeyAndIsActiveTrue(key);
            if (configOpt.isEmpty()) {
                return ApiResponse.error("Configuration key not found: " + key);
            }

            AppConfig config = configOpt.get();

            // Soft delete (set isActive = false)
            config.setIsActive(false);
            UserDtls admin = adminOpt.get();
            config.setUpdatedBy(admin);
            appConfigRepository.save(config);

            // Xóa file nếu có
            String filePath = config.getConfigValue();
            if (filePath != null && !filePath.isEmpty() &&
                    (filePath.startsWith("/uploads/") || filePath.startsWith("uploads/"))) {
                try {
                    fileStorageService.deleteFile(filePath);
                } catch (Exception e) {
                    log.warn("Failed to delete file for deleted config '{}': {}", key, filePath);
                }
            }

            log.info("Config '{}' deleted by admin: {}", key, admin.getUsername());
            return ApiResponse.success("Configuration deleted successfully", null);

        } catch (Exception e) {
            log.error("Error deleting config: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to delete configuration: " + e.getMessage());
        }
    }



    /**
     * Cập nhật một config key cụ thể
     */
    public ApiResponse<String> updateSingleConfig(String key, String value, Long adminUserId) {
        try {
            Optional<UserDtls> adminOpt = userRepository.findById(adminUserId);
            if (adminOpt.isEmpty() || !adminOpt.get().getRole().equals("ADMIN")) {
                return ApiResponse.error("Only ADMIN can update app configuration");
            }

            UserDtls admin = adminOpt.get();
            setConfigValue(key, value, getDescriptionForKey(key), admin);

            log.info("Config '{}' updated to '{}' by admin: {}", key, value, admin.getUsername());
            return ApiResponse.success("Configuration updated successfully", null);

        } catch (Exception e) {
            log.error("Error updating config: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update configuration: " + e.getMessage());
        }
    }

    /**
     * Lấy một config value theo key
     */
    public ApiResponse<String> getConfigByKey(String key) {
        try {
            String value = getConfigValue(key);
            if (value == null) {
                return ApiResponse.error("Configuration key not found: " + key);
            }
            return ApiResponse.success("Configuration retrieved successfully", value);

        } catch (Exception e) {
            log.error("Error retrieving config key '{}': {}", key, e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve configuration: " + e.getMessage());
        }
    }

    /**
     * Lấy tất cả configs
     */
    public ApiResponse<Map<String, String>> getAllConfigsAsKeyValue() {
        try {
            Map<String, String> configMap = getAllConfigAsMap();
            return ApiResponse.success("All configurations retrieved successfully", configMap);

        } catch (Exception e) {
            log.error("Error retrieving all configs: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve configurations: " + e.getMessage());
        }
    }

    /**
     * Lấy tất cả config (chỉ active)
     */
    private Map<String, String> getAllConfigAsMap() {
        Map<String, String> configMap = new HashMap<>();
        List<AppConfig> configs = appConfigRepository.findByIsActiveTrueOrderByConfigKey();

        for (AppConfig config : configs) {
            configMap.put(config.getConfigKey(), config.getConfigValue());
        }

        return configMap;
    }

    /**
     * Lấy một config value theo key
     */
    private String getConfigValue(String key) {
        Optional<AppConfig> configOpt = appConfigRepository.findByConfigKeyAndIsActiveTrue(key);
        return configOpt.map(AppConfig::getConfigValue).orElse(null);
    }

    /**
     * Set một config value
     */
    private void setConfigValue(String key, String value, String description, UserDtls updatedBy) {
        Optional<AppConfig> existingOpt = appConfigRepository.findByConfigKeyAndIsActiveTrue(key);

        AppConfig config;
        if (existingOpt.isPresent()) {
            config = existingOpt.get();
        } else {
            config = new AppConfig();
            config.setConfigKey(key);
            config.setDescription(description);
            config.setIsActive(true);
        }

        config.setConfigValue(value);
        config.setUpdatedBy(updatedBy);

        appConfigRepository.save(config);
    }



    /**
     * Lấy description cho key
     */
    private String getDescriptionForKey(String key) {
        return "Custom configuration";
    }

    /**
     * Validate image file
     */
    private boolean isValidImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            return false;
        }

        return contentType.equals("image/jpeg") ||
                contentType.equals("image/png") ||
                contentType.equals("image/gif") ||
                contentType.equals("image/jpg");
    }
}