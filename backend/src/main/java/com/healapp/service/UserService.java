package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ChangePasswordRequest;
import com.healapp.dto.LoginRequest;
import com.healapp.dto.LoginResponse;
import com.healapp.dto.RegisterRequest;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.UserRepository;
import com.healapp.dto.ForgotPasswordRequest;
import com.healapp.dto.ResetPasswordRequest;
import com.healapp.dto.UpdateEmailRequest;
import com.healapp.dto.UpdateProfileRequest;
import com.healapp.dto.UserResponse;
import com.healapp.dto.UserUpdateRequest;
import com.healapp.dto.VerificationCodeRequest;
import com.healapp.service.EmailService;
import com.healapp.service.PasswordResetService;
import com.healapp.service.PasswordResetService.RateLimitException;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Autowired
    private ConsultantProfileRepository consultantProfileRepository;

    @Value("${app.avatar.url.pattern}default.jpg")
    private String defaultAvatarPath;

    public boolean isEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean isUsernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public ApiResponse<String> sendEmailVerificationCode(VerificationCodeRequest request) {
        try {
            if (isEmailExists(request.getEmail())) {
                return ApiResponse.error("Email has been registered");
            }

            // Tạo mã xác thực
            String verificationCode = emailVerificationService.generateVerificationCode(request.getEmail());

            // Gửi email xác thực
            emailService.sendEmailVerificationCodeAsync(request.getEmail(), verificationCode);

            return ApiResponse.success("A verification code has been sent to your email.", request.getEmail());
        } catch (Exception e) {
            return ApiResponse.error("Unable to send verification code: " + e.getMessage());
        }
    }

    public ApiResponse<UserDtls> registerUser(RegisterRequest request, MultipartFile avatarFile) {
        try {

            boolean isVerified = emailVerificationService.verifyCode(request.getEmail(), request.getVerificationCode());
            if (!isVerified) {
                return ApiResponse.error("The verification code is incorrect or has expired.");
            }

            if (isUsernameExists(request.getUsername())) {
                return ApiResponse.error("Username already exists");
            }

            if (isEmailExists(request.getEmail())) {
                return ApiResponse.error("Email already exists");
            }

            // Tạo user mới
            UserDtls user = new UserDtls();
            user.setFullName(request.getFullName());
            user.setBirthDay(request.getBirthDay());
            user.setPhone(request.getPhone());
            user.setEmail(request.getEmail());
            user.setUsername(request.getUsername());
            user.setPassword(passwordEncoder.encode(request.getPassword()));

            user.setAvatar(defaultAvatarPath);

            user.setIsActive(true);
            user.setRole("USER");
            user.setCreatedDate(LocalDateTime.now());

            UserDtls savedUser = userRepository.save(user);

            return ApiResponse.success("Registered successfully", savedUser);
        } catch (Exception e) {
            return ApiResponse.error("Registration failed: " + e.getMessage());
        }
    }

    public ApiResponse<LoginResponse> login(LoginRequest loginRequest) {
        try {
            String usernameOrEmail = loginRequest.getUsername();

            UserDtls user = null;

            if (usernameOrEmail.contains("@")) {
                user = userRepository.findByEmail(usernameOrEmail).orElse(null);
            } else {
                user = userRepository.findByUsername(usernameOrEmail).orElse(null);
            }

            if (user == null) {
                return ApiResponse.error("Invalid username/email or password");
            }

            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                return ApiResponse.error("Invalid username/email or password");
            }

            if (!user.getIsActive()) {
                return ApiResponse.error("Account is disabled");
            }

            LoginResponse loginResponse = new LoginResponse();
            loginResponse.setUserId(user.getId());
            loginResponse.setUsername(user.getUsername());
            loginResponse.setFullName(user.getFullName());
            loginResponse.setEmail(user.getEmail());
            loginResponse.setAvatar(user.getAvatar());
            loginResponse.setRole(user.getRole());
            loginResponse.setBirthDay(user.getBirthDay());
            loginResponse.setPhone(user.getPhone());

            return ApiResponse.success("Login successful", loginResponse);

        } catch (Exception e) {
            return ApiResponse.error("Login failed: " + e.getMessage());
        }
    }

    public UserDtls findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public ApiResponse<String> sendPasswordResetCode(ForgotPasswordRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                return ApiResponse.error("No account found with this email");
            }

            String verificationCode = passwordResetService.generateVerificationCode(request.getEmail());

            try {
                emailService.sendPasswordResetCode(request.getEmail(), verificationCode);
            } catch (MessagingException e) {
                return ApiResponse.error("Failed to send email: " + e.getMessage());
            }

            return ApiResponse.success("Verification code has been sent to your email", "reset_code_sent");

        } catch (PasswordResetService.RateLimitException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Error processing request: " + e.getMessage());
        }
    }

    public ApiResponse<String> sendPasswordResetCodeAsync(ForgotPasswordRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                return ApiResponse.error("No account found with this email");
            }

            String verificationCode = passwordResetService.generateVerificationCode(request.getEmail());

            emailService.sendPasswordResetCodeAsync(request.getEmail(), verificationCode);

            return ApiResponse.success("Verification code has been sent to your email", "reset_code_sent");

        } catch (PasswordResetService.RateLimitException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Error processing request: " + e.getMessage());
        }
    }

    public ApiResponse<String> resetPassword(ResetPasswordRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                return ApiResponse.error("No account found with this email");
            }

            UserDtls user = userOpt.get();

            boolean isValidCode = passwordResetService.verifyCode(request.getEmail(), request.getCode());
            if (!isValidCode) {
                return ApiResponse.error("Invalid or expired verification code");
            }

            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            passwordResetService.removeCode(request.getEmail());

            return ApiResponse.success("Password has been reset successfully", "password_reset");

        } catch (Exception e) {
            return ApiResponse.error("Failed to reset password: " + e.getMessage());
        }
    }

    public Long getUserIdFromUsername(String username) {
        UserDtls user = userRepository.findByUsername(username).orElse(null);
        return user != null ? user.getId() : null;
    }

    // For Admin
    public ApiResponse<UserResponse> updateUserRoleAndStatus(Long userId, UserUpdateRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String oldRole = user.getRole();
            String newRole = request.getRole();

            // Chỉ chấp nhận các role hợp lệ
            if (!isValidRole(newRole)) {
                return ApiResponse.error("Invalid role. Role must be USER, CONSULTANT, STAFF or ADMIN");
            }

            user.setRole(newRole);
            user.setIsActive(request.getIsActive());

            // từ CONSULTANT sang role khác, xóa profile consultant
            if (oldRole.equals("CONSULTANT") && !newRole.equals("CONSULTANT")) {
                Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
                profileOpt.ifPresent(consultantProfileRepository::delete);
            }

            // từ role khác sang CONSULTANT, tạo profile consultant mặc định
            if (!oldRole.equals("CONSULTANT") && newRole.equals("CONSULTANT")) {
                ConsultantProfile newProfile = new ConsultantProfile();
                newProfile.setUser(user);

                newProfile.setQualifications("Not updated yet");
                newProfile.setExperience("0 years experience");
                newProfile.setBio("No details updated yet");

                consultantProfileRepository.save(newProfile);
            }

            UserDtls updatedUser = userRepository.save(user);

            // Convert to response
            UserResponse response = mapUserToResponse(updatedUser);

            return ApiResponse.success("User update successful", response);
        } catch (Exception e) {
            return ApiResponse.error("Error updating user: " + e.getMessage());
        }
    }

    public ApiResponse<List<UserResponse>> getAllUsers() {
        try {
            List<UserDtls> users = userRepository.findAll();
            List<UserResponse> response = users.stream()
                    .map(this::mapUserToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Get list of users successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Error getting list of users: " + e.getMessage());
        }
    }

    public ApiResponse<UserResponse> getUserById(Long userId) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserResponse response = mapUserToResponse(userOpt.get());
            return ApiResponse.success("Get user information successfully", response);
        } catch (Exception e) {
            return ApiResponse.error("Error getting user information: " + e.getMessage());
        }
    }

    public ApiResponse<List<UserResponse>> getUsersByRole(String role) {
        try {
            // Validate role
            if (!isValidRole(role)) {
                return ApiResponse.error("Invalid role. Valid roles are: USER, CONSULTANT, STAFF, ADMIN");
            }

            List<UserDtls> users = userRepository.findByRole(role);
            List<UserResponse> userResponses = users.stream()
                    .map(this::mapUserToResponse)
                    .collect(Collectors.toList());

            String message = String.format("Found %d user(s) with role %s", userResponses.size(), role);
            return ApiResponse.success(message, userResponses);

        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve users by role: " + e.getMessage());
        }
    }

    public ApiResponse<List<String>> getAvailableRoles() {
        try {
            List<String> roles = Arrays.asList("USER", "CONSULTANT", "STAFF", "ADMIN");
            return ApiResponse.success("Available roles retrieved successfully", roles);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve available roles: " + e.getMessage());
        }
    }

    public ApiResponse<Map<String, Long>> getUserCountByRole() {
        try {
            Map<String, Long> roleCount = new HashMap<>();

            roleCount.put("USER", userRepository.countByRole("USER"));
            roleCount.put("CONSULTANT", userRepository.countByRole("CONSULTANT"));
            roleCount.put("STAFF", userRepository.countByRole("STAFF"));
            roleCount.put("ADMIN", userRepository.countByRole("ADMIN"));
            roleCount.put("TOTAL", userRepository.count());

            return ApiResponse.success("User count by role retrieved successfully", roleCount);

        } catch (Exception e) {
            return ApiResponse.error("Failed to count users by role: " + e.getMessage());
        }
    }

    public ApiResponse<UserResponse> updateBasicProfile(Long userId, UpdateProfileRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            // Cập nhật thông tin cơ bản
            user.setFullName(request.getFullName());
            user.setPhone(request.getPhone());
            user.setBirthDay(request.getBirthDay());

            UserDtls updatedUser = userRepository.save(user);
            UserResponse response = mapUserToResponse(updatedUser);

            return ApiResponse.success("Basic profile updated successfully", response);

        } catch (Exception e) {
            return ApiResponse.error("Failed to update basic profile: " + e.getMessage());
        }
    }

    public ApiResponse<String> sendEmailVerificationForUpdate(Long userId, VerificationCodeRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            // Kiểm tra email mới có trùng với email hiện tại
            if (user.getEmail().equals(request.getEmail())) {
                return ApiResponse.error("New email cannot be the same as current email");
            }

            // Kiểm tra email mới có được sử dụng bởi user khác
            if (userRepository.existsByEmail(request.getEmail())) {
                return ApiResponse.error("Email already exists");
            }

            // Tạo mã xác thực cho email mới
            String verificationCode = emailVerificationService.generateVerificationCode(request.getEmail());

            // Gửi email xác thực
            emailService.sendEmailUpdateVerificationAsync(request.getEmail(), verificationCode, user.getFullName());

            return ApiResponse.success("Verification code has been sent to your new email address",
                    request.getEmail());

        } catch (EmailVerificationService.RateLimitException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Failed to send verification code: " + e.getMessage());
        }
    }

    public ApiResponse<UserResponse> updateEmail(Long userId, UpdateEmailRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            // Kiểm tra email mới có trùng với email hiện tại không
            if (user.getEmail().equals(request.getNewEmail())) {
                return ApiResponse.error("New email cannot be the same as current email");
            }

            // Kiểm tra email mới có được sử dụng bởi user khác không
            if (userRepository.existsByEmail(request.getNewEmail())) {
                return ApiResponse.error("Email already exists");
            }

            // Xác thực mã verification code
            boolean isVerified = emailVerificationService.verifyCode(request.getNewEmail(),
                    request.getVerificationCode());
            if (!isVerified) {
                return ApiResponse.error("Invalid or expired verification code");
            }

            // Cập nhật email mới
            String oldEmail = user.getEmail();
            user.setEmail(request.getNewEmail());

            UserDtls updatedUser = userRepository.save(user);

            // Gửi email thông báo về việc thay đổi email
            try {
                emailService.sendEmailChangeNotificationAsync(oldEmail, request.getNewEmail(), user.getFullName());
                emailService.sendEmailChangeConfirmationAsync(request.getNewEmail(), user.getFullName());
            } catch (Exception e) {
            }

            UserResponse response = mapUserToResponse(updatedUser);
            return ApiResponse.success("Email updated successfully", response);

        } catch (Exception e) {
            return ApiResponse.error("Failed to update email: " + e.getMessage());
        }
    }

    public ApiResponse<String> changePassword(Long userId, ChangePasswordRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            // Kiểm tra mật khẩu hiện tại
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                return ApiResponse.error("Current password is incorrect");
            }

            // Kiểm tra mật khẩu mới và xác nhận mật khẩu
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                return ApiResponse.error("New password and confirm password do not match");
            }

            // Kiểm tra mật khẩu mới không giống mật khẩu cũ
            if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
                return ApiResponse.error("New password must be different from current password");
            }

            // Cập nhật mật khẩu mới
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            // Gửi email thông báo thay đổi mật khẩu
            try {
                emailService.sendPasswordChangeNotificationAsync(user.getEmail(), user.getFullName());
            } catch (Exception e) {
            }

            return ApiResponse.success("Password changed successfully", "password_changed");

        } catch (Exception e) {
            return ApiResponse.error("Failed to change password: " + e.getMessage());
        }
    }

    public ApiResponse<String> updateUserAvatar(Long userId, MultipartFile file) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            // Validate file
            if (file.isEmpty()) {
                return ApiResponse.error("Please select a file");
            }

            // Kiểm tra loại file
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ApiResponse.error("Only image files are allowed");
            }

            // Kiểm tra kích thước file (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ApiResponse.error("File size must be less than 5MB");
            }

            // Lưu file avatar
            String avatarPath = fileStorageService.saveAvatarFile(file, userId);

            // Xóa avatar cũ (nếu không phải default)
            if (!user.getAvatar().contains("default.jpg")) {
                try {
                    fileStorageService.deleteFile(user.getAvatar());
                } catch (Exception e) {
                }
            }

            // Cập nhật đường dẫn avatar
            user.setAvatar(avatarPath);
            userRepository.save(user);

            return ApiResponse.success("Avatar updated successfully", avatarPath);

        } catch (IOException e) {
            return ApiResponse.error("Failed to save avatar file: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Failed to update avatar: " + e.getMessage());
        }
    }

    private UserResponse mapUserToResponse(UserDtls user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setBirthDay(user.getBirthDay());
        response.setPhone(user.getPhone());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setAvatar(user.getAvatar());
        response.setIsActive(user.getIsActive());
        response.setRole(user.getRole());
        response.setCreatedDate(user.getCreatedDate());
        return response;
    }

    // kiểm tra role
    private boolean isValidRole(String role) {
        return role.equals("USER") || role.equals("CONSULTANT") ||
                role.equals("STAFF") || role.equals("ADMIN");
    }

}