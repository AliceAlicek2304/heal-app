package com.healapp.service;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ConsultantProfileRequest;
import com.healapp.dto.ConsultantProfileResponse;
import com.healapp.dto.CreateConsultantAccountRequest;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.Gender;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.RoleRepository;
import com.healapp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ConsultantService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConsultantProfileRepository consultantProfileRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Value("${app.avatar.url.pattern}")
    private String avatarUrlPattern;

    @Value("${app.storage.type:local}")
    private String storageType;

    @Value("${gcs.bucket.name:}")
    private String gcsBucketName;

    private String getDefaultAvatarUrl() {
        // Nếu sử dụng GCS, trả về URL đầy đủ
        if ("gcs".equalsIgnoreCase(storageType) && gcsBucketName != null && !gcsBucketName.isEmpty()) {
            return String.format("https://storage.googleapis.com/%s/avatar/default.jpg", gcsBucketName);
        }
        
        // Local storage: sử dụng pattern như cũ
        String base = avatarUrlPattern;
        if (!base.endsWith("/")) {
            base += "/";
        }
        return base + "default.jpg";
    }

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    // ========== ADMIN ONLY METHODS ==========
    @Transactional
    public ApiResponse<ConsultantProfileResponse> createConsultantAccount(CreateConsultantAccountRequest request) {
        try {
            log.info("Admin creating new consultant account for email: {}", request.getEmail());

            // Kiểm tra email đã tồn tại
            if (userRepository.existsByEmail(request.getEmail())) {
                return ApiResponse.error("Email already exists");
            }

            // Kiểm tra username đã tồn tại
            if (userRepository.existsByUsername(request.getUsername())) {
                return ApiResponse.error("Username already exists");
            }

            // Tạo mật khẩu tạm thời
            String temporaryPassword = generateTemporaryPassword();
            log.info("Generated temporary password for new consultant");

            // Lấy CONSULTANT role
            Role consultantRole = roleRepository.findByRoleName("CONSULTANT")
                    .orElseThrow(() -> new RuntimeException("CONSULTANT role not found in database"));

            // Tạo user mới
            UserDtls newUser = new UserDtls();
            newUser.setFullName(request.getFullName());
            newUser.setEmail(request.getEmail());
            newUser.setUsername(request.getUsername());
            newUser.setPhone(request.getPhone());
            newUser.setBirthDay(request.getBirthDay());

            if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
                try {
                    newUser.setGender(Gender.fromDisplayName(request.getGender()));
                } catch (IllegalArgumentException e) {
                    return ApiResponse.error("Giới tính không hợp lệ");
                }
            }

            newUser.setPassword(passwordEncoder.encode(temporaryPassword));
            newUser.setAvatar(getDefaultAvatarUrl());
            newUser.setRole(consultantRole);
            newUser.setIsActive(true);

            UserDtls savedUser = userRepository.save(newUser);
            log.info("Created new user with ID: {} for consultant", savedUser.getId());

            // Tạo consultant profile
            ConsultantProfile consultantProfile = new ConsultantProfile();
            consultantProfile.setUser(savedUser);
            consultantProfile.setQualifications(
                    request.getQualifications() != null ? request.getQualifications() : "To be updated");
            consultantProfile.setExperience(
                    request.getExperience() != null ? request.getExperience() : "To be updated");
            consultantProfile.setBio(request.getBio() != null ? request.getBio() : "To be updated");

            ConsultantProfile savedProfile = consultantProfileRepository.save(consultantProfile);
            log.info("Created consultant profile with ID: {}", savedProfile.getProfileId());

            return ApiResponse.success("Consultant account created successfully",
                    convertToResponse(savedProfile));

        } catch (Exception e) {
            log.error("Failed to create consultant account: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to create consultant account: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<String> deactivateConsultant(Long userId) {
        try {
            log.info("Admin deactivating consultant with userId: {}", userId);

            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            if (!"CONSULTANT".equals(user.getRoleName())) {
                return ApiResponse.error("User is not a consultant");
            }

            if (!user.getIsActive()) {
                return ApiResponse.error("Consultant is already deactivated");
            }

            // ✅ Deactivate account (set isActive = false)
            user.setIsActive(false);
            userRepository.save(user);

            log.info("Successfully deactivated consultant: {} ({})", user.getFullName(), user.getEmail());

            // Gửi email thông báo deactivation
            try {
                emailService.sendConsultantDeactivatedNotificationAsync(
                        user.getEmail(),
                        user.getFullName());
                log.info("Sent deactivation email to: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Failed to send deactivation email: {}", e.getMessage());
            }

            return ApiResponse.success(
                    "Consultant deactivated successfully. Account status set to inactive.",
                    "User ID " + userId + " deactivated");

        } catch (Exception e) {
            log.error("Failed to deactivate consultant: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to deactivate consultant: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<ConsultantProfileResponse> activateConsultant(Long userId) {
        try {
            log.info("Admin activating consultant with userId: {}", userId);

            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            if (!"CONSULTANT".equals(user.getRoleName())) {
                return ApiResponse.error("User is not a consultant");
            }

            if (user.getIsActive()) {
                return ApiResponse.error("Consultant is already active");
            }

            // ✅ Activate account (set isActive = true)
            user.setIsActive(true);
            userRepository.save(user);

            log.info("Successfully activated consultant: {} ({})", user.getFullName(), user.getEmail());

            // Ensure consultant profile exists
            Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
            ConsultantProfile profile;

            if (profileOpt.isEmpty()) {
                // Create profile if doesn't exist
                profile = new ConsultantProfile();
                profile.setUser(user);
                profile.setQualifications("To be updated");
                profile.setExperience("To be updated");
                profile.setBio("To be updated");
                profile = consultantProfileRepository.save(profile);
                log.info("Created new consultant profile for reactivated user");
            } else {
                profile = profileOpt.get();
            }

            // Gửi email thông báo activation
            try {
                emailService.sendConsultantActivatedNotificationAsync(
                        user.getEmail(),
                        user.getFullName());
                log.info("Sent activation email to: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Failed to send activation email: {}", e.getMessage());
            }

            return ApiResponse.success(
                    "Consultant activated successfully. Account is now active.",
                    convertToResponse(profile));

        } catch (Exception e) {
            log.error("Failed to activate consultant: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to activate consultant: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<String> removeConsultantRole(Long userId) {
        try {
            log.info("Admin removing consultant role from userId: {}", userId);

            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            if (!"CONSULTANT".equals(user.getRoleName())) {
                return ApiResponse.error("User is not a consultant");
            }

            // 1. Set user status = false (disable account)
            user.setIsActive(false);

            // 2. Xóa consultant profile
            Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
            profileOpt.ifPresent(profile -> {
                consultantProfileRepository.delete(profile);
                log.info("Deleted consultant profile for user: {}", user.getId());
            });

            // 3. Chuyển role về CUSTOMER
            Role customerRole = roleRepository.findByRoleName("CUSTOMER")
                    .orElseThrow(() -> new RuntimeException("CUSTOMER role not found in database"));

            user.setRole(customerRole);
            userRepository.save(user);

            log.info("Successfully removed consultant role from user: {} ({})", user.getFullName(), user.getEmail());

            // Gửi email thông báo
            try {
                emailService.sendConsultantRoleRemovedNotificationAsync(
                        user.getEmail(),
                        user.getFullName());
                log.info("Sent role removal email to: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Failed to send role removal email: {}", e.getMessage());
            }

            return ApiResponse.success(
                    "Consultant role removed successfully. Account disabled, profile deleted, and role changed to CUSTOMER",
                    "User ID " + userId + " role changed to CUSTOMER");

        } catch (Exception e) {
            log.error("Failed to remove consultant role: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to remove consultant role: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<ConsultantProfileResponse> addConsultantRole(Long userId) {
        try {
            log.info("Admin adding consultant role to userId: {}", userId);

            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            if ("CONSULTANT".equals(user.getRoleName())) {
                return ApiResponse.error("User is already a consultant");
            }

            // 1. Chuyển role thành CONSULTANT
            Role consultantRole = roleRepository.findByRoleName("CONSULTANT")
                    .orElseThrow(() -> new RuntimeException("CONSULTANT role not found in database"));

            user.setRole(consultantRole);
            user.setIsActive(true); // ✅ Ensure account is active

            userRepository.save(user);
            log.info("Changed user role to CONSULTANT for user: {}", user.getId());

            // 2. Tạo consultant profile mới
            ConsultantProfile consultantProfile = new ConsultantProfile();
            consultantProfile.setUser(user);
            consultantProfile.setQualifications("To be updated");
            consultantProfile.setExperience("To be updated");
            consultantProfile.setBio("To be updated");

            ConsultantProfile savedProfile = consultantProfileRepository.save(consultantProfile);
            log.info("Created consultant profile for user: {}", user.getId());

            return ApiResponse.success("Consultant role added successfully. Profile created automatically",
                    convertToResponse(savedProfile));

        } catch (Exception e) {
            log.error("Failed to add consultant role: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to add consultant role: " + e.getMessage());
        }
    }

    // ========== PUBLIC METHODS ==========
    public ApiResponse<List<ConsultantProfileResponse>> getAllConsultantProfiles() {
        try {
            // Lấy tất cả user có role CONSULTANT (cả active và inactive)
            List<UserDtls> consultantUsers = userRepository.findByRoleName("CONSULTANT");
            List<ConsultantProfileResponse> responses = consultantUsers.stream()
                    .map(user -> {
                        Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
                        if (profileOpt.isPresent()) {
                            return convertToResponse(profileOpt.get());
                        } else {
                            // User có role CONSULTANT nhưng chưa có profile
                            ConsultantProfileResponse response = new ConsultantProfileResponse();
                            response.setUserId(user.getId());
                            response.setFullName(user.getFullName());
                            response.setEmail(user.getEmail());
                            response.setPhone(user.getPhone());
                            response.setAvatar(user.getAvatar());
                            return response;
                        }
                    })
                    .collect(Collectors.toList());

            return ApiResponse.success("Consultant profiles retrieved successfully", responses);
        } catch (Exception e) {
            log.error("Failed to retrieve consultant profiles: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve consultant profiles: " + e.getMessage());
        }
    }

    public ApiResponse<List<ConsultantProfileResponse>> getActiveConsultantProfiles() {
        try {
            // Chỉ lấy consultant đang active
            List<UserDtls> activeConsultantUsers = userRepository.findByRoleNameAndIsActive("CONSULTANT", true);
            List<ConsultantProfileResponse> responses = activeConsultantUsers.stream()
                    .map(user -> {
                        Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
                        if (profileOpt.isPresent()) {
                            return convertToResponse(profileOpt.get());
                        } else {
                            ConsultantProfileResponse response = new ConsultantProfileResponse();
                            response.setUserId(user.getId());
                            response.setFullName(user.getFullName());
                            response.setEmail(user.getEmail());
                            response.setPhone(user.getPhone());
                            response.setAvatar(user.getAvatar());
                            return response;
                        }
                    })
                    .collect(Collectors.toList());

            return ApiResponse.success("Active consultant profiles retrieved successfully", responses);
        } catch (Exception e) {
            log.error("Failed to retrieve active consultant profiles: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve active consultant profiles: " + e.getMessage());
        }
    }

    public ApiResponse<ConsultantProfileResponse> getConsultantProfileById(Long userId) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            if (!"CONSULTANT".equals(user.getRoleName())) {
                return ApiResponse.error("User is not a consultant");
            }

            Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
            if (profileOpt.isEmpty()) {
                ConsultantProfileResponse response = new ConsultantProfileResponse();
                response.setUserId(user.getId());
                response.setFullName(user.getFullName());
                response.setEmail(user.getEmail());
                response.setPhone(user.getPhone());
                response.setAvatar(user.getAvatar());

                return ApiResponse.success("Consultant found but profile not complete", response);
            }

            return ApiResponse.success("Consultant profile retrieved successfully",
                    convertToResponse(profileOpt.get()));
        } catch (Exception e) {
            log.error("Failed to retrieve consultant profile: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve consultant profile: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<ConsultantProfileResponse> createOrUpdateConsultantProfile(Long userId, ConsultantProfileRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            if (!"CONSULTANT".equals(user.getRoleName())) {
                return ApiResponse.error("User must have CONSULTANT role to update profile. Please update role first.");
            }

            // Tìm profile của user, tạo mới nếu chưa có
            ConsultantProfile consultantProfile = consultantProfileRepository.findByUser(user)
                    .orElse(new ConsultantProfile());

            consultantProfile.setUser(user);
            consultantProfile.setQualifications(request.getQualifications());
            consultantProfile.setExperience(request.getExperience());
            consultantProfile.setBio(request.getBio());

            ConsultantProfile savedProfile = consultantProfileRepository.save(consultantProfile);

            log.info("Updated consultant profile for user: {}", userId);

            return ApiResponse.success("Consultant profile updated successfully", convertToResponse(savedProfile));
        } catch (Exception e) {
            log.error("Failed to update consultant profile: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update consultant profile: " + e.getMessage());
        }
    }

    // ========== PRIVATE HELPER METHODS ==========
    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(12);

        // Đảm bảo có ít nhất 1 chữ hoa, 1 chữ thường, 1 số
        password.append((char) (RANDOM.nextInt(26) + 'A')); // Chữ hoa
        password.append((char) (RANDOM.nextInt(26) + 'a')); // Chữ thường
        password.append((char) (RANDOM.nextInt(10) + '0')); // Số

        // Thêm các ký tự ngẫu nhiên còn lại
        for (int i = 3; i < 12; i++) {
            password.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }

        // Trộn lại thứ tự
        return shuffleString(password.toString());
    }

    private String shuffleString(String input) {
        char[] characters = input.toCharArray();
        for (int i = 0; i < characters.length; i++) {
            int randomIndex = RANDOM.nextInt(characters.length);
            char temp = characters[i];
            characters[i] = characters[randomIndex];
            characters[randomIndex] = temp;
        }
        return new String(characters);
    }

    private ConsultantProfileResponse convertToResponse(ConsultantProfile consultantProfile) {
        ConsultantProfileResponse response = new ConsultantProfileResponse();
        response.setProfileId(consultantProfile.getProfileId());
        response.setUserId(consultantProfile.getUser().getId());
        response.setFullName(consultantProfile.getUser().getFullName());
        response.setEmail(consultantProfile.getUser().getEmail());
        response.setPhone(consultantProfile.getUser().getPhone());
        response.setAvatar(consultantProfile.getUser().getAvatar());
        response.setGender(consultantProfile.getUser().getGenderDisplayName());
        response.setQualifications(consultantProfile.getQualifications());
        response.setExperience(consultantProfile.getExperience());
        response.setBio(consultantProfile.getBio());
        response.setCreatedAt(consultantProfile.getCreatedAt());
        response.setUpdatedAt(consultantProfile.getUpdatedAt());
        return response;
    }
}
