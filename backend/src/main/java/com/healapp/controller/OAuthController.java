package com.healapp.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healapp.config.JwtTokenProvider;
import com.healapp.dto.OAuthUserInfo;
import com.healapp.model.AuthProvider;
import com.healapp.model.Gender;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.service.GoogleOAuthService;
import com.healapp.service.RoleService;
import com.healapp.service.UserService;

@RestController
@RequestMapping("/auth/oauth")
@CrossOrigin(origins = {"http://localhost:3000", "https://alicealicek2304.github.io"})
public class OAuthController {

    private static final Logger logger = LoggerFactory.getLogger(OAuthController.class);

    @Autowired
    private GoogleOAuthService googleOAuthService;

    @Autowired
    private UserService userService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/google/login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        try {
            String idToken = request.get("idToken");
            
            // Verify Google token
            OAuthUserInfo userInfo = googleOAuthService.verifyGoogleToken(idToken);
            if (userInfo == null) {
                return ResponseEntity.badRequest().body("Invalid Google token");
            }

            // Find or create user
            UserDtls user = userService.findByEmailAndProvider(userInfo.getEmail(), AuthProvider.GOOGLE);
            
            if (user == null) {
                // Check if user already exists with different provider
                UserDtls existingUser = userService.findByEmail(userInfo.getEmail());
                if (existingUser != null) {
                    // User exists with different provider - this is not allowed
                    // Return error message asking user to use original login method
                    String providerName = existingUser.getProvider() == AuthProvider.LOCAL ? "email/mật khẩu" : existingUser.getProvider().toString();
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "EMAIL_ALREADY_EXISTS",
                        "message", "Email này đã được đăng ký bằng phương thức " + providerName + ". Vui lòng sử dụng phương thức đăng nhập ban đầu hoặc sử dụng email khác."
                    ));
                } else {
                    // Create completely new user
                    try {
                        user = new UserDtls();
                        user.setEmail(userInfo.getEmail());
                        user.setFullName(userInfo.getName());
                        user.setUsername(userInfo.getEmail()); // Set username as email for OAuth users
                        
                        // Encode a default password for OAuth users
                        String defaultPassword = "OAUTH_USER_" + System.currentTimeMillis(); // More secure default
                        user.setPassword(passwordEncoder.encode(defaultPassword));
                        
                        user.setProvider(AuthProvider.GOOGLE);
                        user.setProviderId(userInfo.getProviderId());
                        user.setAvatar(userInfo.getPicture());
                        user.setIsActive(true);
                        
                        // Set default values for required fields
                        user.setPhone("0123456789"); // Default phone number
                        user.setBirthDay(LocalDate.of(2000, 1, 1)); // Default birth date: 1/1/2000
                        user.setGender(Gender.OTHER); // Default gender: OTHER
                        
                        // Set default role (CUSTOMER for OAuth users)
                        Role userRole = roleService.findByRoleName("CUSTOMER");
                        if (userRole == null) {
                            // Fallback to getDefaultUserRole() which should return CUSTOMER
                            userRole = roleService.getDefaultUserRole();
                        }
                        if (userRole == null) {
                            throw new RuntimeException("Cannot find CUSTOMER role in database");
                        }
                        user.setRole(userRole);
                        
                        user = userService.saveUser(user);
                    } catch (Exception userCreationException) {
                        logger.error("Error creating new OAuth user: {}", userCreationException.getMessage(), userCreationException);
                        throw new RuntimeException("Failed to create OAuth user: " + userCreationException.getMessage(), userCreationException);
                    }
                }
            } else {
                // Update existing user info if needed
                if (userInfo.getPicture() != null && !userInfo.getPicture().equals(user.getAvatar())) {
                    user.setAvatar(userInfo.getPicture());
                    user = userService.saveUser(user);
                }
            }

            // Generate JWT token
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
                Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                String jwtToken = tokenProvider.generateAccessToken(authentication);
                String refreshToken = tokenProvider.generateRefreshToken(user.getUsername());

                Map<String, Object> response = new HashMap<>();
                response.put("accessToken", jwtToken);
                response.put("refreshToken", refreshToken);
                response.put("tokenType", "Bearer");
                
                response.put("user", Map.of(
                    "id", user.getId(),
                    "fullName", user.getFullName(),
                    "email", user.getEmail(),
                    "avatar", user.getAvatar() != null ? user.getAvatar() : "",
                    "role", user.getRoleName(),
                    "provider", user.getProvider().toString(),
                    "phone", user.getPhone(),
                    "birthDay", user.getBirthDay() != null ? user.getBirthDay().toString() : null,
                    "gender", user.getGender() != null ? user.getGender().toString() : null
                ));

                return ResponseEntity.ok(response);
            } catch (Exception tokenException) {
                logger.error("Error generating JWT tokens: {}", tokenException.getMessage(), tokenException);
                throw new RuntimeException("Failed to generate authentication tokens", tokenException);
            }
            
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Unknown runtime error";
            logger.error("Runtime error in Google OAuth: {} | Exception type: {}", errorMessage, e.getClass().getSimpleName(), e);
            
            if (errorMessage.contains("Cannot find CUSTOMER role")) {
                return ResponseEntity.status(500).body(Map.of(
                    "error", "SERVER_ERROR",
                    "message", "Lỗi hệ thống: Không thể tạo tài khoản. Vui lòng liên hệ quản trị viên."
                ));
            }
            return ResponseEntity.badRequest().body(Map.of(
                "error", "AUTHENTICATION_ERROR", 
                "message", "Đăng nhập Google thất bại: " + errorMessage
            ));
        } catch (Exception e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Unknown error";
            logger.error("Lỗi xử lý OAuth Google: {}", errorMessage, e);
            
            // Check for common database errors
            if (errorMessage.contains("UNIQUE KEY constraint") || errorMessage.contains("Duplicate entry")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "EMAIL_ALREADY_EXISTS",
                    "message", "Email này đã được sử dụng với phương thức đăng nhập khác. Vui lòng sử dụng phương thức đăng nhập ban đầu."
                ));
            }
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "SERVER_ERROR",
                "message", "Có lỗi xảy ra trong quá trình đăng nhập với Google. Vui lòng thử lại sau."
            ));
        }
    }
}
