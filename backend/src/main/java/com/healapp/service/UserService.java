package com.healapp.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.healapp.dto.AdminResetPasswordRequest;
import com.healapp.dto.ApiResponse;
import com.healapp.dto.ChangePasswordRequest;
import com.healapp.dto.CreateUserRequest;
import com.healapp.dto.ForgotPasswordRequest;
import com.healapp.dto.LoginRequest;
import com.healapp.dto.LoginResponse;
import com.healapp.dto.PhoneVerificationRequest;
import com.healapp.dto.RegisterRequest;
import com.healapp.dto.ResetPasswordRequest;
import com.healapp.dto.UpdateEmailRequest;
import com.healapp.dto.UpdateProfileRequest;
import com.healapp.dto.UserResponse;
import com.healapp.dto.UserUpdateRequest;
import com.healapp.dto.VerificationCodeRequest;
import com.healapp.dto.VerifyPhoneRequest;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.Gender;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.RoleRepository;
import com.healapp.repository.UserRepository;

import jakarta.mail.MessagingException;

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

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RoleService roleService;

    @Autowired
    private PhoneVerificationService phoneVerificationService;

    @Autowired
    private FirebaseSMSService firebaseSMSService;

    @Value("${app.avatar.url.pattern}")
    private String avatarUrlPattern;

    private String getDefaultAvatarUrl() {
        String base = avatarUrlPattern;
        if (!base.endsWith("/")) {
            base += "/";
        }
        return base + "default.jpg";
    }

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

    public ApiResponse<UserResponse> registerUser(RegisterRequest request, MultipartFile avatarFile) {
        try {
            // Kiểm tra mã xác thực email
            boolean isVerified = emailVerificationService.verifyCode(request.getEmail(), request.getVerificationCode());
            if (!isVerified) {
                return ApiResponse.error("Mã xác thực không đúng hoặc đã hết hạn");
            }

            // Kiểm tra username và email đã tồn tại
            if (userRepository.existsByUsername(request.getUsername())) {
                return ApiResponse.error("Username đã tồn tại");
            }

            if (userRepository.existsByEmail(request.getEmail())) {
                return ApiResponse.error("Email đã tồn tại");
            }

            // Tạo user mới
            UserDtls user = new UserDtls();
            user.setFullName(request.getFullName());
            user.setBirthDay(request.getBirthDay());
            try {
                user.setGender(Gender.fromDisplayName(request.getGender()));
            } catch (IllegalArgumentException e) {
                return ApiResponse.error("Giới tính không hợp lệ");
            }
            user.setPhone(request.getPhone());
            user.setEmail(request.getEmail());
            user.setUsername(request.getUsername());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setAvatar(getDefaultAvatarUrl());
            user.setIsActive(true);

            // Set role mặc định là customer
            Role userRole = roleService.getDefaultUserRole();
            user.setRole(userRole);

            UserDtls savedUser = userRepository.save(user);

            UserResponse userResponse = mapUserToResponse(savedUser);

            return ApiResponse.success("Đăng ký thành công", userResponse);

        } catch (Exception e) {
            return ApiResponse.error("Lỗi đăng ký: " + e.getMessage());
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
            loginResponse.setRole(user.getRoleName());
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

    public UserDtls getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    // For Admin
    public ApiResponse<UserResponse> updateUserRoleAndStatus(Long userId, UserUpdateRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String oldRoleName = user.getRoleName();
            String newRoleName = request.getRole(); // Kiểm tra role hợp lệ
            if (!roleService.isValidRole(newRoleName)) {
                return ApiResponse.error("Invalid role. Role must be CUSTOMER, CONSULTANT, STAFF or ADMIN");
            }

            // Lấy role entity từ database
            Role newRole = roleRepository.findByRoleName(newRoleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + newRoleName));

            user.setRole(newRole);
            user.setIsActive(request.getIsActive());

            // Xử lý chuyển đổi role consultant
            if ("CONSULTANT".equals(oldRoleName) && !"CONSULTANT".equals(newRoleName)) {
                Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
                profileOpt.ifPresent(consultantProfileRepository::delete);
            }

            if (!"CONSULTANT".equals(oldRoleName) && "CONSULTANT".equals(newRoleName)) {
                ConsultantProfile newProfile = new ConsultantProfile();
                newProfile.setUser(user);
                newProfile.setQualifications("Not updated yet");
                newProfile.setExperience("0 years experience");
                newProfile.setBio("No details updated yet");
                consultantProfileRepository.save(newProfile);
            }

            UserDtls updatedUser = userRepository.save(user);
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

    public ApiResponse<List<UserResponse>> getUsersByRole(String roleName) {
        try { // Validate role
            if (!roleService.isValidRole(roleName)) {
                return ApiResponse.error("Invalid role. Valid roles are: CUSTOMER, CONSULTANT, STAFF, ADMIN");
            }

            List<UserDtls> users = userRepository.findByRoleName(roleName);
            List<UserResponse> userResponses = users.stream()
                    .map(this::mapUserToResponse)
                    .collect(Collectors.toList());

            String message = String.format("Found %d user(s) with role %s", userResponses.size(), roleName);
            return ApiResponse.success(message, userResponses);

        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve users by role: " + e.getMessage());
        }
    }

    public ApiResponse<List<String>> getAvailableRoles() {
        try {
            List<Role> roles = roleRepository.findAll();
            List<String> roleNames = roles.stream()
                    .map(Role::getRoleName)
                    .collect(Collectors.toList());

            return ApiResponse.success("Available roles retrieved successfully", roleNames);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve available roles: " + e.getMessage());
        }
    }

    public ApiResponse<Map<String, Long>> getUserCountByRole() {
        try {
            Map<String, Long> roleCount = new HashMap<>();

            List<Role> roles = roleRepository.findAll();
            for (Role role : roles) {
                long count = userRepository.countByRole(role);
                roleCount.put(role.getRoleName(), count);
            }

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

            // Cập nhật thông tin cơ bản (không bao gồm phone)
            user.setFullName(request.getFullName());
            user.setBirthDay(request.getBirthDay());

            if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
                try {
                    user.setGender(Gender.fromDisplayName(request.getGender()));
                } catch (IllegalArgumentException e) {
                    return ApiResponse.error("Giới tính không hợp lệ");
                }
            }

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
            // Kiểm tra user tồn tại
            Optional<UserDtls> userOptional = userRepository.findById(userId);
            if (userOptional.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            // Kiểm tra file null hoặc empty TRƯỚC khi gọi isEmpty()
            if (file == null || file.isEmpty()) {
                return ApiResponse.error("Please select a file");
            }

            // Kiểm tra file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ApiResponse.error("Only image files are allowed");
            }

            // Kiểm tra file size (5MB = 5 * 1024 * 1024 bytes)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ApiResponse.error("File size must be less than 5MB");
            }

            UserDtls user = userOptional.get();

            // Lưu file avatar
            String avatarPath = fileStorageService.saveAvatarFile(file, userId);

            // Cập nhật avatar path trong database
            user.setAvatar(avatarPath);
            userRepository.save(user);

            return ApiResponse.success("Avatar updated successfully", avatarPath);

        } catch (Exception e) {
            return ApiResponse.error("Failed to save avatar file: " + e.getMessage());
        }
    }

    // ===================== PHONE VERIFICATION METHODS =====================
    /**
     * Gửi mã xác thực số điện thoại
     */
    public ApiResponse<String> sendPhoneVerificationCode(Long userId, PhoneVerificationRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String newPhone = phoneVerificationService.normalizePhone(request.getPhone());

            // Kiểm tra số điện thoại mới có trùng với số hiện tại không
            String currentOriginalPhone = phoneVerificationService.getOriginalPhone(user.getPhone());
            if (currentOriginalPhone != null
                    && phoneVerificationService.isSamePhone(currentOriginalPhone, newPhone)) {

                // Nếu số hiện tại đã được xác thực thì không cho phép xác thực lại
                if (phoneVerificationService.isPhoneVerified(user.getPhone())) {
                    return ApiResponse.error("Phone number is already verified");
                }
                // Nếu chưa xác thực thì cho phép xác thực số hiện tại
            }

            // Kiểm tra số điện thoại có được sử dụng bởi user khác không
            if (isPhoneExistsForOtherUser(newPhone, userId)) {
                return ApiResponse.error("Phone number already exists");
            }

            // Tạo mã xác thực
            String verificationCode = phoneVerificationService.generateVerificationCode(newPhone);

            // Gửi SMS xác thực
            boolean smsSent = firebaseSMSService.sendVerificationCode(newPhone, verificationCode);
            if (!smsSent) {
                return ApiResponse.error("Failed to send SMS verification code");
            }

            return ApiResponse.success("Verification code has been sent to your phone",
                    phoneVerificationService.getOriginalPhone(newPhone));

        } catch (PhoneVerificationService.RateLimitException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Unable to send verification code: " + e.getMessage());
        }
    }

    /**
     * Xác thực và cập nhật số điện thoại
     */
    public ApiResponse<UserResponse> verifyAndUpdatePhone(Long userId, VerifyPhoneRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String newPhone = phoneVerificationService.normalizePhone(request.getPhone());

            // Kiểm tra số điện thoại có được sử dụng bởi user khác không
            if (isPhoneExistsForOtherUser(newPhone, userId)) {
                return ApiResponse.error("Phone number already exists");
            }

            // Xác thực mã verification code
            boolean isVerified = phoneVerificationService.verifyCode(newPhone, request.getVerificationCode());
            if (!isVerified) {
                return ApiResponse.error("Invalid or expired verification code");
            }

            // Cập nhật số điện thoại với đánh dấu đã xác thực
            String verifiedPhone = phoneVerificationService.markPhoneAsVerified(newPhone);
            user.setPhone(verifiedPhone);

            UserDtls savedUser = userRepository.save(user);
            UserResponse userResponse = mapUserToResponse(savedUser);

            return ApiResponse.success("Phone number verified and updated successfully", userResponse);

        } catch (Exception e) {
            return ApiResponse.error("Unable to verify and update phone: " + e.getMessage());
        }
    }

    /**
     * Kiểm tra số điện thoại có tồn tại cho user khác không
     */
    private boolean isPhoneExistsForOtherUser(String phone, Long currentUserId) {
        String originalPhone = phoneVerificationService.getOriginalPhone(phone);

        List<UserDtls> usersWithPhone = userRepository.findAll().stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .filter(user -> user.getPhone() != null)
                .filter(user -> phoneVerificationService.isSamePhone(user.getPhone(), originalPhone))
                .collect(Collectors.toList());

        return !usersWithPhone.isEmpty();
    }

    /**
     * Lấy thông tin trạng thái xác thực số điện thoại của user
     */
    public ApiResponse<Map<String, Object>> getPhoneVerificationStatus(Long userId) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            Map<String, Object> status = new HashMap<>();

            if (user.getPhone() != null) {
                boolean isVerified = phoneVerificationService.isPhoneVerified(user.getPhone());
                String originalPhone = phoneVerificationService.getOriginalPhone(user.getPhone());

                status.put("hasPhone", true);
                status.put("phone", originalPhone);
                status.put("isVerified", isVerified);
            } else {
                status.put("hasPhone", false);
                status.put("phone", null);
                status.put("isVerified", false);
            }

            return ApiResponse.success("Phone verification status retrieved successfully", status);

        } catch (Exception e) {
            return ApiResponse.error("Unable to get phone verification status: " + e.getMessage());
        }
    }

    private UserResponse mapUserToResponse(UserDtls user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setBirthDay(user.getBirthDay());
        response.setGender(user.getGenderDisplayName());

        // Xử lý phone với phone verification
        if (user.getPhone() != null) {
            String originalPhone = phoneVerificationService.getOriginalPhone(user.getPhone());
            boolean isVerified = phoneVerificationService.isPhoneVerified(user.getPhone());
            response.setPhone(originalPhone);
            response.setIsPhoneVerified(isVerified);
        } else {
            response.setPhone(null);
            response.setIsPhoneVerified(false);
        }

        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setAvatar(user.getAvatar());
        response.setIsActive(user.getIsActive());
        response.setRole(user.getRoleName());
        response.setCreatedDate(user.getCreatedDate());
        return response;
    }

    // kiểm tra role
    private boolean isValidRole(String roleName) {
        return roleService.isValidRole(roleName);
    }

    /**
     * Lấy user ID từ username
     */
    public Long getUserIdByUsername(String username) {
        Optional<UserDtls> userOpt = userRepository.findByUsername(username);
        return userOpt.map(UserDtls::getId).orElse(null);
    }

    /**
     * Admin tạo user mới
     */
    public ApiResponse<UserResponse> createUserByAdmin(CreateUserRequest request) {
        try {
            // Kiểm tra email đã tồn tại
            if (isEmailExists(request.getEmail())) {
                return ApiResponse.error("Email already exists");
            }

            // Kiểm tra username đã tồn tại
            if (isUsernameExists(request.getUsername())) {
                return ApiResponse.error("Username already exists");
            }

            // Kiểm tra role hợp lệ
            if (!isValidRole(request.getRole())) {
                return ApiResponse.error("Invalid role: " + request.getRole());
            }

            // Tạo user mới
            UserDtls user = new UserDtls();
            user.setUsername(request.getUsername());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setFullName(request.getFullName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setBirthDay(request.getBirthDay()); // Set gender
            switch (request.getGender()) {
                case "Nam":
                    user.setGender(Gender.MALE);
                    break;
                case "Nữ":
                    user.setGender(Gender.FEMALE);
                    break;
                case "Khác":
                    user.setGender(Gender.OTHER);
                    break;
                default:
                    return ApiResponse.error("Invalid gender");
            }

            // Set role
            Role role = roleRepository.findByRoleName(request.getRole()).orElse(null);
            if (role == null) {
                return ApiResponse.error("Role not found: " + request.getRole());
            }
            user.setRole(role);

            // Set default values
            user.setAvatar(getDefaultAvatarUrl()); // Sử dụng avatar mặc định
            user.setIsActive(true);
            user.setCreatedDate(LocalDateTime.now()); // Lưu user
            UserDtls savedUser = userRepository.save(user);

            // Tạo response
            UserResponse userResponse = mapUserToResponse(savedUser);

            return ApiResponse.success("User created successfully", userResponse);

        } catch (Exception e) {
            return ApiResponse.error("Error creating user: " + e.getMessage());
        }
    }

    /**
     * Admin reset password cho user
     */
    public ApiResponse<String> resetPasswordByAdmin(Long userId, AdminResetPasswordRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get(); // Mã hóa password mới
            String encodedPassword = passwordEncoder.encode(request.getNewPassword());
            user.setPassword(encodedPassword);

            // Cập nhật thời gian - UserDtls doesn't have setUpdatedDate, so we'll skip this
            userRepository.save(user);

            // Log lý do reset password nếu có
            String logMessage = "Password reset by admin";
            if (request.getReason() != null && !request.getReason().trim().isEmpty()) {
                logMessage += ". Reason: " + request.getReason();
            }

            return ApiResponse.success("Password reset successfully for user: " + user.getUsername());

        } catch (Exception e) {
            return ApiResponse.error("Error resetting password: " + e.getMessage());
        }
    }

}
