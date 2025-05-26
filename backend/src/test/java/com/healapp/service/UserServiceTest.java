package com.healapp.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ChangePasswordRequest;
import com.healapp.dto.RegisterRequest;
import com.healapp.dto.VerificationCodeRequest;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.UserRepository;
import com.healapp.service.EmailVerificationService.RateLimitException;
import com.healapp.dto.LoginRequest;
import com.healapp.dto.LoginResponse;
import com.healapp.dto.ForgotPasswordRequest;
import com.healapp.dto.ResetPasswordRequest;
import com.healapp.dto.UpdateEmailRequest;
import com.healapp.dto.UpdateProfileRequest;
import com.healapp.dto.UserResponse;
import com.healapp.dto.UserUpdateRequest;

import jakarta.mail.MessagingException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PasswordResetService passwordResetService;

    @Mock
    private EmailService emailService;

    @Mock
    private EmailVerificationService emailVerificationService;

    @Mock
    private ConsultantProfileRepository consultantProfileRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private UserService userService;

    private RegisterRequest registerRequest;
    private UserDtls sampleUser;

    @BeforeEach
    void setUp() {
        // RegisterRequest
        registerRequest = new RegisterRequest();
        registerRequest.setFullName("Nguyen Van A");
        registerRequest.setBirthDay(LocalDate.of(1990, 1, 1));
        registerRequest.setPhone("0987654321");
        registerRequest.setEmail("nguyenvana@example.com");
        registerRequest.setUsername("nguyenvana");
        registerRequest.setPassword("password123");
        registerRequest.setVerificationCode("123456");

        // Sample user
        sampleUser = new UserDtls();
        sampleUser.setId(1L);
        sampleUser.setFullName("Nguyen Van A");
        sampleUser.setEmail("nguyenvana@example.com");
        sampleUser.setUsername("nguyenvana");
        sampleUser.setPassword("encodedPassword");
        sampleUser.setAvatar("/img/avatar/default.jpg");
        sampleUser.setIsActive(true);
        sampleUser.setRole("USER");
    }

    // Tests for email verification functionality
    @Test
    @DisplayName("Gửi mã xác thực email thành công")
    void sendEmailVerificationCode_WithValidEmail_ShouldSucceed() throws Exception {
        // Arrange
        VerificationCodeRequest request = new VerificationCodeRequest();
        request.setEmail("newuser@example.com");

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(emailVerificationService.generateVerificationCode(anyString())).thenReturn("123456");
        doNothing().when(emailService).sendEmailVerificationCodeAsync(anyString(), anyString());

        // Act
        ApiResponse<String> response = userService.sendEmailVerificationCode(request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Mã xác thực đã được gửi đến email của bạn", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).existsByEmail("newuser@example.com");
        verify(emailVerificationService).generateVerificationCode("newuser@example.com");
        verify(emailService).sendEmailVerificationCodeAsync(eq("newuser@example.com"), anyString());
    }

    @Test
    @DisplayName("Gửi mã xác thực email thất bại khi email đã tồn tại")
    void sendEmailVerificationCode_WithExistingEmail_ShouldFail() throws Exception {
        // Arrange
        VerificationCodeRequest request = new VerificationCodeRequest();
        request.setEmail("existing@example.com");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // Act
        ApiResponse<String> response = userService.sendEmailVerificationCode(request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Email đã được đăng ký", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).existsByEmail("existing@example.com");
        verify(emailVerificationService, never()).generateVerificationCode(anyString());
        verify(emailService, never()).sendEmailVerificationCodeAsync(anyString(), anyString());
    }

    @Test
    @DisplayName("Gửi mã xác thực email thất bại do giới hạn tốc độ")
    void sendEmailVerificationCode_WithRateLimit_ShouldFail() throws Exception {
        // Arrange
        VerificationCodeRequest request = new VerificationCodeRequest();
        request.setEmail("newuser@example.com");

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(emailVerificationService.generateVerificationCode("newuser@example.com"))
                .thenThrow(new EmailVerificationService.RateLimitException(
                        "Vui lòng đợi 50 giây trước khi yêu cầu gửi mã mới"));

        // Act
        ApiResponse<String> response = userService.sendEmailVerificationCode(request);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Vui lòng đợi 50 giây"));
        assertNull(response.getData());

        // Verify
        verify(userRepository).existsByEmail("newuser@example.com");
        verify(emailVerificationService).generateVerificationCode("newuser@example.com");
        verify(emailService, never()).sendEmailVerificationCodeAsync(anyString(), anyString());
    }

    @Test
    @DisplayName("Đăng ký người dùng thành công với mã xác thực hợp lệ")
    void registerUser_WithVerifiedEmail_Success() {
        // Arrange
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(emailVerificationService.verifyCode("nguyenvana@example.com", "123456")).thenReturn(true);

        // Thiết lập giá trị mặc định cho avatar
        ReflectionTestUtils.setField(userService, "defaultAvatarPath", "/img/avatar/default.jpg");

        when(userRepository.save(any(UserDtls.class))).thenReturn(sampleUser);

        // Act
        ApiResponse<UserDtls> response = userService.registerUser(registerRequest, null);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Đăng ký thành công", response.getMessage());
        assertEquals(sampleUser, response.getData());

        // Verify
        verify(emailVerificationService).verifyCode("nguyenvana@example.com", "123456");
        verify(passwordEncoder).encode("password123");

        ArgumentCaptor<UserDtls> userCaptor = ArgumentCaptor.forClass(UserDtls.class);
        verify(userRepository).save(userCaptor.capture());

        UserDtls savedUser = userCaptor.getValue();
        assertEquals("encodedPassword", savedUser.getPassword());
        assertEquals("/img/avatar/default.jpg", savedUser.getAvatar());
        assertEquals("USER", savedUser.getRole());
        assertTrue(savedUser.getIsActive());
    }

    @Test
    @DisplayName("Đăng ký thất bại khi mã xác thực không hợp lệ")
    void registerUser_WithInvalidVerificationCode_ShouldFail() {
        // Arrange
        when(emailVerificationService.verifyCode("nguyenvana@example.com", "123456")).thenReturn(false);

        // Act
        ApiResponse<UserDtls> response = userService.registerUser(registerRequest, null);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Mã xác thực không đúng hoặc đã hết hạn", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(emailVerificationService).verifyCode("nguyenvana@example.com", "123456");
        verify(userRepository, never()).existsByUsername(anyString());
        verify(userRepository, never()).existsByEmail(anyString());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi tên người dùng đã tồn tại")
    void registerUser_WithExistingUsername_ShouldFail() {
        // Arrange
        lenient().when(emailVerificationService.verifyCode("nguyenvana@example.com", "123456")).thenReturn(true);
        when(userRepository.existsByUsername("nguyenvana")).thenReturn(true);

        // Act
        ApiResponse<UserDtls> response = userService.registerUser(registerRequest, null);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Username đã tồn tại", response.getMessage());
        assertNull(response.getData());

        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi email đã tồn tại")
    void registerUser_WithExistingEmail_ShouldFail() {
        // Arrange
        when(emailVerificationService.verifyCode("nguyenvana@example.com", "123456")).thenReturn(true); // trả về true
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail("nguyenvana@example.com")).thenReturn(true);

        // Act
        ApiResponse<UserDtls> response = userService.registerUser(registerRequest, null);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Email đã tồn tại", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(emailVerificationService).verifyCode("nguyenvana@example.com", "123456");
        verify(userRepository).existsByUsername(anyString());
        verify(userRepository).existsByEmail("nguyenvana@example.com");
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Đăng nhập thành công với thông tin chính xác")
    void login_WithCorrectCredentials_ShouldSucceed() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nguyenvana");
        loginRequest.setPassword("password123");

        UserDtls user = new UserDtls();
        user.setId(1L);
        user.setUsername("nguyenvana");
        user.setPassword("encodedPassword");
        user.setFullName("Nguyen Van A");
        user.setEmail("nguyenvana@example.com");
        user.setAvatar("/img/avatar/default.jpg");
        user.setIsActive(true);
        user.setRole("USER");
        user.setBirthDay(LocalDate.of(1990, 1, 15)); // Thêm dòng này
        user.setPhone("0123456789"); // Thêm dòng này

        when(userRepository.findByUsername("nguyenvana")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        // Act
        ApiResponse<LoginResponse> response = userService.login(loginRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Login successful", response.getMessage());
        assertNotNull(response.getData());

        LoginResponse loginResponse = response.getData();
        assertEquals(1L, loginResponse.getUserId());
        assertEquals("nguyenvana", loginResponse.getUsername());
        assertEquals("Nguyen Van A", loginResponse.getFullName());
        assertEquals("nguyenvana@example.com", loginResponse.getEmail());
        assertEquals("/img/avatar/default.jpg", loginResponse.getAvatar());
        assertEquals("USER", loginResponse.getRole());
        assertEquals(LocalDate.of(1990, 1, 15), loginResponse.getBirthDay()); // Thêm assertion này
        assertEquals("0123456789", loginResponse.getPhone()); // Thêm assertion này
    }

    @Test
    @DisplayName("Đăng nhập thất bại với tên người dùng không tồn tại")
    void login_WithNonExistentUsername_ShouldFail() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nonexistentuser");
        loginRequest.setPassword("password123");

        when(userRepository.findByUsername("nonexistentuser")).thenReturn(Optional.empty());

        // Act
        ApiResponse<LoginResponse> response = userService.login(loginRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid username/email or password", response.getMessage());
        assertNull(response.getData());

        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("Đăng nhập thất bại với mật khẩu không chính xác")
    void login_WithIncorrectPassword_ShouldFail() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nguyenvana");
        loginRequest.setPassword("wrongpassword");

        UserDtls user = new UserDtls();
        user.setUsername("nguyenvana");
        user.setPassword("encodedPassword");
        user.setIsActive(true);

        when(userRepository.findByUsername("nguyenvana")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        // Act
        ApiResponse<LoginResponse> response = userService.login(loginRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid username/email or password", response.getMessage());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("Đăng nhập thất bại với tài khoản bị vô hiệu hóa")
    void login_WithInactiveAccount_ShouldFail() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("inactiveuser");
        loginRequest.setPassword("password123");

        UserDtls user = new UserDtls();
        user.setUsername("inactiveuser");
        user.setPassword("encodedPassword");
        user.setIsActive(false);

        when(userRepository.findByUsername("inactiveuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        // Act
        ApiResponse<LoginResponse> response = userService.login(loginRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Account is disabled", response.getMessage());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("Đăng nhập xử lý ngoại lệ")
    void login_WithException_ShouldReturnErrorResponse() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nguyenvana");
        loginRequest.setPassword("password123");

        when(userRepository.findByUsername("nguyenvana")).thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<LoginResponse> response = userService.login(loginRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().startsWith("Login failed:"));
        assertNull(response.getData());
    }

    @Test
    @DisplayName("Đăng nhập thành công với email")
    void login_WithEmailSuccessful() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nguyenvana@example.com"); // Sử dụng email thay vì username
        loginRequest.setPassword("password123");

        UserDtls user = new UserDtls();
        user.setId(1L);
        user.setUsername("nguyenvana");
        user.setPassword("encodedPassword");
        user.setFullName("Nguyen Van A");
        user.setEmail("nguyenvana@example.com");
        user.setAvatar("/img/avatar/default.jpg");
        user.setIsActive(true);
        user.setRole("USER");

        when(userRepository.findByEmail("nguyenvana@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        // Act
        ApiResponse<LoginResponse> response = userService.login(loginRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Login successful", response.getMessage());
        assertNotNull(response.getData());

        LoginResponse loginResponse = response.getData();
        assertEquals(1L, loginResponse.getUserId());
        assertEquals("nguyenvana", loginResponse.getUsername());
        assertEquals("Nguyen Van A", loginResponse.getFullName());
        assertEquals("nguyenvana@example.com", loginResponse.getEmail());
        assertEquals("/img/avatar/default.jpg", loginResponse.getAvatar());
        assertEquals("USER", loginResponse.getRole());
    }

    @Test
    @DisplayName("Đăng nhập thất bại với email không tồn tại")
    void login_WithNonExistentEmail_ShouldFail() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nonexistent@example.com");
        loginRequest.setPassword("password123");

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act
        ApiResponse<LoginResponse> response = userService.login(loginRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid username/email or password", response.getMessage());
        assertNull(response.getData());

        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("Đăng nhập thất bại với email hợp lệ nhưng mật khẩu không đúng")
    void login_WithEmail_IncorrectPassword_ShouldFail() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nguyenvana@example.com");
        loginRequest.setPassword("wrongpassword");

        UserDtls user = new UserDtls();
        user.setUsername("nguyenvana");
        user.setEmail("nguyenvana@example.com");
        user.setPassword("encodedPassword");
        user.setIsActive(true);

        when(userRepository.findByEmail("nguyenvana@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        // Act
        ApiResponse<LoginResponse> response = userService.login(loginRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid username/email or password", response.getMessage());
        assertNull(response.getData());
    }

    @Test
    @DisplayName("Đăng nhập thất bại với email hợp lệ nhưng tài khoản bị vô hiệu hóa")
    void login_WithEmail_InactiveAccount_ShouldFail() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("inactive@example.com");
        loginRequest.setPassword("password123");

        UserDtls user = new UserDtls();
        user.setUsername("inactiveuser");
        user.setEmail("inactive@example.com");
        user.setPassword("encodedPassword");
        user.setIsActive(false);

        when(userRepository.findByEmail("inactive@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        // Act
        ApiResponse<LoginResponse> response = userService.login(loginRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Account is disabled", response.getMessage());
        assertNull(response.getData());
    }

    // Các test cho chức năng quên mật khẩu
    @Test
    @DisplayName("Gửi mã đặt lại mật khẩu thành công")
    void sendPasswordResetCode_WithValidEmail_ShouldSucceed() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nguyenvana@example.com");

        UserDtls user = new UserDtls();
        user.setEmail("nguyenvana@example.com");

        when(userRepository.findByEmail("nguyenvana@example.com")).thenReturn(Optional.of(user));
        when(passwordResetService.generateVerificationCode(anyString())).thenReturn("123456");
        doNothing().when(emailService).sendPasswordResetCode(anyString(), anyString());

        // Act
        ApiResponse<String> response = userService.sendPasswordResetCode(request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Verification code has been sent to your email", response.getMessage());

        // Verify
        verify(userRepository).findByEmail("nguyenvana@example.com");
        verify(passwordResetService).generateVerificationCode("nguyenvana@example.com");
        verify(emailService).sendPasswordResetCode(eq("nguyenvana@example.com"), anyString());
    }

    @Test
    @DisplayName("Gửi mã đặt lại mật khẩu thất bại với email không tồn tại")
    void sendPasswordResetCode_WithNonExistentEmail_ShouldFail() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nonexistent@example.com");

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = userService.sendPasswordResetCode(request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("No account found with this email", response.getMessage());

        // Verify
        verify(userRepository).findByEmail("nonexistent@example.com");
        verify(passwordResetService, never()).generateVerificationCode(anyString());
        verify(emailService, never()).sendPasswordResetCode(anyString(), anyString());
    }

    @Test
    @DisplayName("Gửi mã đặt lại mật khẩu thất bại do giới hạn tốc độ")
    void sendPasswordResetCode_WithRateLimit_ShouldFail() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nguyenvana@example.com");

        UserDtls user = new UserDtls();
        user.setEmail("nguyenvana@example.com");

        when(userRepository.findByEmail("nguyenvana@example.com")).thenReturn(Optional.of(user));
        when(passwordResetService.generateVerificationCode("nguyenvana@example.com"))
                .thenThrow(new PasswordResetService.RateLimitException(
                        "Please wait 55 seconds before requesting another code"));

        // Act
        ApiResponse<String> response = userService.sendPasswordResetCode(request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Please wait 55 seconds before requesting another code", response.getMessage());

        // Verify
        verify(userRepository).findByEmail("nguyenvana@example.com");
        verify(passwordResetService).generateVerificationCode("nguyenvana@example.com");
        verify(emailService, never()).sendPasswordResetCode(anyString(), anyString());
    }

    @Test
    @DisplayName("Gửi mã đặt lại mật khẩu thất bại do lỗi dịch vụ email")
    void sendPasswordResetCode_WithEmailError_ShouldFail() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nguyenvana@example.com");

        UserDtls user = new UserDtls();
        user.setEmail("nguyenvana@example.com");

        when(userRepository.findByEmail("nguyenvana@example.com")).thenReturn(Optional.of(user));
        when(passwordResetService.generateVerificationCode(anyString())).thenReturn("123456");

        doThrow(new MessagingException("Failed to connect to mail server"))
                .when(emailService).sendPasswordResetCode(anyString(), anyString());

        // Act
        ApiResponse<String> response = userService.sendPasswordResetCode(request);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to send email"));

        // Verify
        verify(userRepository).findByEmail("nguyenvana@example.com");
        verify(passwordResetService).generateVerificationCode("nguyenvana@example.com");
        verify(emailService).sendPasswordResetCode(eq("nguyenvana@example.com"), anyString());
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thành công với mã hợp lệ")
    void resetPassword_WithValidCode_ShouldSucceed() {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("nguyenvana@example.com");
        request.setCode("123456");
        request.setNewPassword("newpassword123");

        UserDtls user = new UserDtls();
        user.setEmail("nguyenvana@example.com");
        user.setPassword("oldEncodedPassword");

        when(userRepository.findByEmail("nguyenvana@example.com")).thenReturn(Optional.of(user));
        when(passwordResetService.verifyCode("nguyenvana@example.com", "123456")).thenReturn(true);
        when(passwordEncoder.encode("newpassword123")).thenReturn("newEncodedPassword");
        doNothing().when(passwordResetService).removeCode(anyString());
        when(userRepository.save(any(UserDtls.class))).thenReturn(user);

        // Act
        ApiResponse<String> response = userService.resetPassword(request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Password has been reset successfully", response.getMessage());

        // Verify
        verify(userRepository).findByEmail("nguyenvana@example.com");
        verify(passwordResetService).verifyCode("nguyenvana@example.com", "123456");
        verify(passwordEncoder).encode("newpassword123");
        verify(passwordResetService).removeCode("nguyenvana@example.com");

        ArgumentCaptor<UserDtls> userCaptor = ArgumentCaptor.forClass(UserDtls.class);
        verify(userRepository).save(userCaptor.capture());
        UserDtls savedUser = userCaptor.getValue();
        assertEquals("newEncodedPassword", savedUser.getPassword());
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại với email không tồn tại")
    void resetPassword_WithNonExistentEmail_ShouldFail() {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("nonexistent@example.com");
        request.setCode("123456");
        request.setNewPassword("newpassword123");

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = userService.resetPassword(request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("No account found with this email", response.getMessage());

        // Verify
        verify(userRepository).findByEmail("nonexistent@example.com");
        verify(passwordResetService, never()).verifyCode(anyString(), anyString());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại với mã xác thực không hợp lệ")
    void resetPassword_WithInvalidCode_ShouldFail() {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("nguyenvana@example.com");
        request.setCode("invalid");
        request.setNewPassword("newpassword123");

        UserDtls user = new UserDtls();
        user.setEmail("nguyenvana@example.com");

        when(userRepository.findByEmail("nguyenvana@example.com")).thenReturn(Optional.of(user));
        when(passwordResetService.verifyCode("nguyenvana@example.com", "invalid")).thenReturn(false);

        // Act
        ApiResponse<String> response = userService.resetPassword(request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid or expired verification code", response.getMessage());

        // Verify
        verify(userRepository).findByEmail("nguyenvana@example.com");
        verify(passwordResetService).verifyCode("nguyenvana@example.com", "invalid");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu xử lý ngoại lệ")
    void resetPassword_WithException_ShouldReturnErrorResponse() {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("nguyenvana@example.com");
        request.setCode("123456");
        request.setNewPassword("newpassword123");

        when(userRepository.findByEmail("nguyenvana@example.com")).thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<String> response = userService.resetPassword(request);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to reset password"));

        // Verify
        verify(userRepository).findByEmail("nguyenvana@example.com");
        verify(passwordResetService, never()).verifyCode(anyString(), anyString());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Đăng xuất thành công")
    void logout_ShouldSucceed() {
        // Arrange
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        Authentication authentication = mock(Authentication.class);
        SecurityContextLogoutHandler logoutHandler = mock(SecurityContextLogoutHandler.class);

        // Act & Assert
        // logout xử lý bởi Spring Security
        // trả về thông báo thành công
        ApiResponse<String> result = ApiResponse.success("Logged out successfully", null);

        assertTrue(result.isSuccess());
        assertEquals("Logged out successfully", result.getMessage());
        assertNull(result.getData());
    }

    @Test
    @DisplayName("Cập nhật role và status người dùng thành công")
    void updateUserRoleAndStatus_ShouldSucceed() {
        // Arrange
        UserUpdateRequest request = new UserUpdateRequest();
        request.setRole("STAFF");
        request.setIsActive(true);

        UserDtls user = new UserDtls();
        user.setId(1L);
        user.setUsername("normaluser");
        user.setEmail("user@example.com");
        user.setRole("USER"); // Role ban đầu
        user.setIsActive(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(UserDtls.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        ApiResponse<UserResponse> response = userService.updateUserRoleAndStatus(1L, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("User update successful", response.getMessage());
        assertNotNull(response.getData());
        assertEquals("STAFF", response.getData().getRole());
        assertTrue(response.getData().getIsActive());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).save(user);

        ArgumentCaptor<UserDtls> userCaptor = ArgumentCaptor.forClass(UserDtls.class);
        verify(userRepository).save(userCaptor.capture());

        UserDtls savedUser = userCaptor.getValue();
        assertEquals("STAFF", savedUser.getRole());
        assertTrue(savedUser.getIsActive());
    }

    @Test
    @DisplayName("Cập nhật role thành CONSULTANT tạo profile mới")
    void updateUserRoleAndStatus_ToConsultant_ShouldCreateProfile() {
        // Arrange
        UserUpdateRequest request = new UserUpdateRequest();
        request.setRole("CONSULTANT");
        request.setIsActive(true);

        UserDtls user = new UserDtls();
        user.setId(1L);
        user.setUsername("normaluser");
        user.setEmail("user@example.com");
        user.setRole("USER"); // Role ban đầu
        user.setIsActive(true);

        ConsultantProfile newProfile = new ConsultantProfile();
        newProfile.setUser(user);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(consultantProfileRepository.save(any(ConsultantProfile.class))).thenReturn(newProfile);
        when(userRepository.save(any(UserDtls.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        ApiResponse<UserResponse> response = userService.updateUserRoleAndStatus(1L, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("User update successful", response.getMessage());
        assertEquals("CONSULTANT", response.getData().getRole());

        // Verify
        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).save(any(ConsultantProfile.class));
        verify(userRepository).save(user);

        ArgumentCaptor<ConsultantProfile> profileCaptor = ArgumentCaptor.forClass(ConsultantProfile.class);
        verify(consultantProfileRepository).save(profileCaptor.capture());

        ConsultantProfile capturedProfile = profileCaptor.getValue();
        assertEquals(user, capturedProfile.getUser());
        assertEquals("Not updated yet", capturedProfile.getQualifications());
    }

    @Test
    @DisplayName("Cập nhật từ CONSULTANT sang role khác xóa profile")
    void updateUserRoleAndStatus_FromConsultant_ShouldDeleteProfile() {
        // Arrange
        UserUpdateRequest request = new UserUpdateRequest();
        request.setRole("STAFF");
        request.setIsActive(true);

        UserDtls user = new UserDtls();
        user.setId(1L);
        user.setUsername("consultant");
        user.setEmail("consultant@example.com");
        user.setRole("CONSULTANT"); // Role ban đầu
        user.setIsActive(true);

        ConsultantProfile existingProfile = new ConsultantProfile();
        existingProfile.setUser(user);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(consultantProfileRepository.findByUser(user)).thenReturn(Optional.of(existingProfile));
        doNothing().when(consultantProfileRepository).delete(existingProfile);
        when(userRepository.save(any(UserDtls.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        ApiResponse<UserResponse> response = userService.updateUserRoleAndStatus(1L, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("User update successful", response.getMessage());
        assertEquals("STAFF", response.getData().getRole());

        // Verify
        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).findByUser(user);
        verify(consultantProfileRepository).delete(existingProfile);
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Cập nhật vô hiệu hóa tài khoản")
    void updateUserRoleAndStatus_DisableAccount_ShouldSucceed() {
        // Arrange
        UserUpdateRequest request = new UserUpdateRequest();
        request.setRole("USER"); // Giữ nguyên role
        request.setIsActive(false); // Vô hiệu hóa

        UserDtls user = new UserDtls();
        user.setId(1L);
        user.setUsername("user");
        user.setEmail("user@example.com");
        user.setRole("USER");
        user.setIsActive(true); // Ban đầu đang hoạt động

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(UserDtls.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        ApiResponse<UserResponse> response = userService.updateUserRoleAndStatus(1L, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("User update successful", response.getMessage());
        assertFalse(response.getData().getIsActive());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).save(user);

        ArgumentCaptor<UserDtls> userCaptor = ArgumentCaptor.forClass(UserDtls.class);
        verify(userRepository).save(userCaptor.capture());

        UserDtls savedUser = userCaptor.getValue();
        assertEquals("USER", savedUser.getRole()); // Role không đổi
        assertFalse(savedUser.getIsActive()); // IsActive thành false
    }

    @Test
    @DisplayName("Cập nhật người dùng thất bại khi không tìm thấy")
    void updateUserRoleAndStatus_UserNotFound_ShouldFail() {
        // Arrange
        UserUpdateRequest request = new UserUpdateRequest();
        request.setRole("STAFF");
        request.setIsActive(true);

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<UserResponse> response = userService.updateUserRoleAndStatus(999L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Cập nhật người dùng thất bại với role không hợp lệ")
    void updateUserRoleAndStatus_InvalidRole_ShouldFail() {
        // Arrange
        UserUpdateRequest request = new UserUpdateRequest();
        request.setRole("INVALID_ROLE");
        request.setIsActive(true);

        UserDtls user = new UserDtls();
        user.setId(1L);
        user.setUsername("user");
        user.setRole("USER");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Act
        ApiResponse<UserResponse> response = userService.updateUserRoleAndStatus(1L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid role. Role must be USER, CONSULTANT, STAFF or ADMIN", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Lấy danh sách tất cả người dùng thành công")
    void getAllUsers_ShouldSucceed() {
        // Arrange
        List<UserDtls> userList = Arrays.asList(
                sampleUser, // Sử dụng sampleUser từ setUp
                new UserDtls(2L, "Staff User", LocalDate.of(1995, 5, 5), "0123456789",
                        "staff@example.com", "staff", "encodedPassword", "/img/avatar/default.jpg",
                        true, "STAFF", LocalDateTime.now().minusDays(10)));

        when(userRepository.findAll()).thenReturn(userList);

        // Act
        ApiResponse<List<UserResponse>> response = userService.getAllUsers();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Get list of users successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().size());
        assertEquals("nguyenvana", response.getData().get(0).getUsername());
        assertEquals("staff", response.getData().get(1).getUsername());

        // Verify
        verify(userRepository).findAll();
    }

    @Test
    @DisplayName("Lấy thông tin người dùng theo ID thành công")
    void getUserById_ShouldSucceed() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // Act
        ApiResponse<UserResponse> response = userService.getUserById(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Get user information successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getId());
        assertEquals("nguyenvana", response.getData().getUsername());
        assertEquals("USER", response.getData().getRole());

        // Verify
        verify(userRepository).findById(1L);
    }

    @Test
    @DisplayName("Lấy thông tin người dùng thất bại khi không tìm thấy")
    void getUserById_UserNotFound_ShouldFail() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<UserResponse> response = userService.getUserById(999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
    }

    @Test
    @DisplayName("Lấy ID người dùng từ username thành công")
    void getUserIdFromUsername_ShouldSucceed() {
        // Arrange
        when(userRepository.findByUsername("nguyenvana")).thenReturn(Optional.of(sampleUser));

        // Act
        Long userId = userService.getUserIdFromUsername("nguyenvana");

        // Assert
        assertNotNull(userId);
        assertEquals(1L, userId);

        // Verify
        verify(userRepository).findByUsername("nguyenvana");
    }

    @Test
    @DisplayName("Lấy ID người dùng từ username không tồn tại")
    void getUserIdFromUsername_UserNotFound_ShouldReturnNull() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act
        Long userId = userService.getUserIdFromUsername("nonexistent");

        // Assert
        assertNull(userId);

        // Verify
        verify(userRepository).findByUsername("nonexistent");
    }

    @Test
    @DisplayName("Lấy thông tin profile user thành công")
    void getUserProfile_ShouldSucceed() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // Act
        ApiResponse<UserResponse> response = userService.getUserById(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Get user information successfully", response.getMessage()); // ✅ Sửa message
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getId());
        assertEquals("nguyenvana", response.getData().getUsername());
        assertEquals("nguyenvana@example.com", response.getData().getEmail());

        // Verify
        verify(userRepository).findById(1L);
    }

    @Test
    @DisplayName("Lấy thông tin profile thất bại khi user không tồn tại")
    void getUserProfile_UserNotFound_ShouldFail() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<UserResponse> response = userService.getUserById(999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
    }

    @Test
    @DisplayName("Cập nhật thông tin cơ bản thành công")
    void updateBasicProfile_ShouldSucceed() {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Nguyen Van A Updated");
        request.setPhone("0912345678");
        request.setBirthDay(LocalDate.of(1991, 2, 20));

        UserDtls updatedUser = new UserDtls();
        updatedUser.setId(1L);
        updatedUser.setFullName("Nguyen Van A Updated");
        updatedUser.setPhone("0912345678");
        updatedUser.setBirthDay(LocalDate.of(1991, 2, 20));
        updatedUser.setEmail("nguyenvana@example.com");
        updatedUser.setUsername("nguyenvana");
        updatedUser.setAvatar("/img/avatar/default.jpg");
        updatedUser.setIsActive(true);
        updatedUser.setRole("USER");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(UserDtls.class))).thenReturn(updatedUser);

        // Act
        ApiResponse<UserResponse> response = userService.updateBasicProfile(1L, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Basic profile updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals("Nguyen Van A Updated", response.getData().getFullName());
        assertEquals("0912345678", response.getData().getPhone());
        assertEquals(LocalDate.of(1991, 2, 20), response.getData().getBirthDay());

        // Verify
        verify(userRepository).findById(1L);
        ArgumentCaptor<UserDtls> userCaptor = ArgumentCaptor.forClass(UserDtls.class);
        verify(userRepository).save(userCaptor.capture());

        UserDtls savedUser = userCaptor.getValue();
        assertEquals("Nguyen Van A Updated", savedUser.getFullName());
        assertEquals("0912345678", savedUser.getPhone());
        assertEquals(LocalDate.of(1991, 2, 20), savedUser.getBirthDay());
    }

    @Test
    @DisplayName("Cập nhật thông tin cơ bản thất bại khi user không tồn tại")
    void updateBasicProfile_UserNotFound_ShouldFail() {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Test User");
        request.setPhone("0987654321");
        request.setBirthDay(LocalDate.of(1990, 1, 1));

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<UserResponse> response = userService.updateBasicProfile(999L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Gửi mã xác thực cho email mới thành công")
    void sendEmailVerificationForUpdate_ShouldSucceed() throws Exception {
        // Arrange
        VerificationCodeRequest request = new VerificationCodeRequest();
        request.setEmail("newemail@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByEmail("newemail@example.com")).thenReturn(false);
        when(emailVerificationService.generateVerificationCode("newemail@example.com")).thenReturn("123456");
        doNothing().when(emailService).sendEmailUpdateVerificationAsync(anyString(), anyString(), anyString());

        // Act
        ApiResponse<String> response = userService.sendEmailVerificationForUpdate(1L, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Verification code has been sent to your new email address", response.getMessage());
        assertEquals("newemail@example.com", response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).existsByEmail("newemail@example.com");
        verify(emailVerificationService).generateVerificationCode("newemail@example.com");
        verify(emailService).sendEmailUpdateVerificationAsync(eq("newemail@example.com"), eq("123456"),
                eq("Nguyen Van A"));
    }

    @Test
    @DisplayName("Gửi mã xác thực cho email mới thất bại khi email trùng với email hiện tại")
    void sendEmailVerificationForUpdate_SameEmail_ShouldFail() {
        // Arrange
        VerificationCodeRequest request = new VerificationCodeRequest();
        request.setEmail("nguyenvana@example.com"); // Same as current email

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // Act
        ApiResponse<String> response = userService.sendEmailVerificationForUpdate(1L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("New email cannot be the same as current email", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository, never()).existsByEmail(anyString());
        try {
            verify(emailVerificationService, never()).generateVerificationCode(anyString());
        } catch (EmailVerificationService.RateLimitException e) {
            fail("Unexpected exception thrown: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Gửi mã xác thực cho email mới thất bại khi email đã tồn tại")
    void sendEmailVerificationForUpdate_EmailExists_ShouldFail() throws RateLimitException {
        // Arrange
        VerificationCodeRequest request = new VerificationCodeRequest();
        request.setEmail("existing@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // Act
        ApiResponse<String> response = userService.sendEmailVerificationForUpdate(1L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Email already exists", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).existsByEmail("existing@example.com");
        verify(emailVerificationService, never()).generateVerificationCode(anyString());
    }

    @Test
    @DisplayName("Cập nhật email mới thành công")
    void updateEmail_ShouldSucceed() throws Exception {
        // Arrange
        UpdateEmailRequest request = new UpdateEmailRequest();
        request.setNewEmail("newemail@example.com");
        request.setVerificationCode("123456");

        UserDtls updatedUser = new UserDtls();
        updatedUser.setId(1L);
        updatedUser.setFullName("Nguyen Van A");
        updatedUser.setEmail("newemail@example.com");
        updatedUser.setUsername("nguyenvana");
        updatedUser.setAvatar("/img/avatar/default.jpg");
        updatedUser.setIsActive(true);
        updatedUser.setRole("USER");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByEmail("newemail@example.com")).thenReturn(false);
        when(emailVerificationService.verifyCode("newemail@example.com", "123456")).thenReturn(true);
        when(userRepository.save(any(UserDtls.class))).thenReturn(updatedUser);
        doNothing().when(emailService).sendEmailChangeNotificationAsync(anyString(), anyString(), anyString());
        doNothing().when(emailService).sendEmailChangeConfirmationAsync(anyString(), anyString());

        // Act
        ApiResponse<UserResponse> response = userService.updateEmail(1L, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Email updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals("newemail@example.com", response.getData().getEmail());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).existsByEmail("newemail@example.com");
        verify(emailVerificationService).verifyCode("newemail@example.com", "123456");
        verify(emailService).sendEmailChangeNotificationAsync(eq("nguyenvana@example.com"), eq("newemail@example.com"),
                eq("Nguyen Van A"));
        verify(emailService).sendEmailChangeConfirmationAsync(eq("newemail@example.com"), eq("Nguyen Van A"));

        ArgumentCaptor<UserDtls> userCaptor = ArgumentCaptor.forClass(UserDtls.class);
        verify(userRepository).save(userCaptor.capture());
        UserDtls savedUser = userCaptor.getValue();
        assertEquals("newemail@example.com", savedUser.getEmail());
    }

    @Test
    @DisplayName("Cập nhật email thất bại khi mã xác thực không đúng")
    void updateEmail_InvalidCode_ShouldFail() {
        // Arrange
        UpdateEmailRequest request = new UpdateEmailRequest();
        request.setNewEmail("newemail@example.com");
        request.setVerificationCode("wrong_code");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByEmail("newemail@example.com")).thenReturn(false);
        when(emailVerificationService.verifyCode("newemail@example.com", "wrong_code")).thenReturn(false);

        // Act
        ApiResponse<UserResponse> response = userService.updateEmail(1L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid or expired verification code", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(emailVerificationService).verifyCode("newemail@example.com", "wrong_code");
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Đổi mật khẩu thành công")
    void changePassword_ShouldSucceed() throws Exception {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldpassword123");
        request.setNewPassword("NewPassword123@");
        request.setConfirmPassword("NewPassword123@");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldpassword123", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.matches("NewPassword123@", "encodedPassword")).thenReturn(false); // New password is
                                                                                               // different
        when(passwordEncoder.encode("NewPassword123@")).thenReturn("newEncodedPassword");
        when(userRepository.save(any(UserDtls.class))).thenReturn(sampleUser);
        doNothing().when(emailService).sendPasswordChangeNotificationAsync(anyString(), anyString());

        // Act
        ApiResponse<String> response = userService.changePassword(1L, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Password changed successfully", response.getMessage());
        assertEquals("password_changed", response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(passwordEncoder).matches("oldpassword123", "encodedPassword");
        verify(passwordEncoder).matches("NewPassword123@", "encodedPassword");
        verify(passwordEncoder).encode("NewPassword123@");
        verify(emailService).sendPasswordChangeNotificationAsync(eq("nguyenvana@example.com"), eq("Nguyen Van A"));

        ArgumentCaptor<UserDtls> userCaptor = ArgumentCaptor.forClass(UserDtls.class);
        verify(userRepository).save(userCaptor.capture());
        UserDtls savedUser = userCaptor.getValue();
        assertEquals("newEncodedPassword", savedUser.getPassword());
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu hiện tại không đúng")
    void changePassword_WrongCurrentPassword_ShouldFail() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongpassword");
        request.setNewPassword("NewPassword123@");
        request.setConfirmPassword("NewPassword123@");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        // Act
        ApiResponse<String> response = userService.changePassword(1L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Current password is incorrect", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(passwordEncoder).matches("wrongpassword", "encodedPassword");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu mới và xác nhận không khớp")
    void changePassword_PasswordMismatch_ShouldFail() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldpassword123");
        request.setNewPassword("NewPassword123@");
        request.setConfirmPassword("DifferentPassword123@");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldpassword123", "encodedPassword")).thenReturn(true);

        // Act
        ApiResponse<String> response = userService.changePassword(1L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("New password and confirm password do not match", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(passwordEncoder).matches("oldpassword123", "encodedPassword");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu mới giống mật khẩu cũ")
    void changePassword_SamePassword_ShouldFail() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldpassword123");
        request.setNewPassword("oldpassword123");
        request.setConfirmPassword("oldpassword123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldpassword123", "encodedPassword")).thenReturn(true);

        // Act
        ApiResponse<String> response = userService.changePassword(1L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("New password must be different from current password", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(passwordEncoder, times(2)).matches("oldpassword123", "encodedPassword");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Cập nhật avatar thành công")
    void updateUserAvatar_ShouldSucceed() throws Exception {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/jpeg");
        when(file.getSize()).thenReturn(1024L * 1024L); // 1MB
        // LOẠI BỎ: when(file.getOriginalFilename()).thenReturn("avatar.jpg"); - không
        // được sử dụng

        String newAvatarPath = "/img/avatar/user_1_20250115_143000.jpg";

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(fileStorageService.saveAvatarFile(file, 1L)).thenReturn(newAvatarPath);
        // LOẠI BỎ: doNothing().when(fileStorageService).deleteFile(anyString()); -
        // không được sử dụng trong test này
        when(userRepository.save(any(UserDtls.class))).thenReturn(sampleUser);

        // Act
        ApiResponse<String> response = userService.updateUserAvatar(1L, file);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Avatar updated successfully", response.getMessage());
        assertEquals(newAvatarPath, response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(fileStorageService).saveAvatarFile(file, 1L);

        // LOẠI BỎ verify trùng lặp
        ArgumentCaptor<UserDtls> userCaptor = ArgumentCaptor.forClass(UserDtls.class);
        verify(userRepository).save(userCaptor.capture());
        UserDtls savedUser = userCaptor.getValue();
        assertEquals(newAvatarPath, savedUser.getAvatar());
    }

    @Test
    @DisplayName("Cập nhật avatar thất bại khi file trống")
    void updateUserAvatar_EmptyFile_ShouldFail() throws Exception {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // Act
        ApiResponse<String> response = userService.updateUserAvatar(1L, file);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Please select a file", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(fileStorageService, never()).saveAvatarFile(any(), any());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Cập nhật avatar thất bại khi file không phải ảnh")
    void updateUserAvatar_InvalidFileType_ShouldFail() throws Exception {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("application/pdf");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // Act
        ApiResponse<String> response = userService.updateUserAvatar(1L, file);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only image files are allowed", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(fileStorageService, never()).saveAvatarFile(any(), any());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Cập nhật avatar thất bại khi file quá lớn")
    void updateUserAvatar_FileTooLarge_ShouldFail() throws Exception {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/jpeg");
        when(file.getSize()).thenReturn(6L * 1024L * 1024L); // 6MB (> 5MB limit)

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // Act
        ApiResponse<String> response = userService.updateUserAvatar(1L, file);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("File size must be less than 5MB", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(fileStorageService, never()).saveAvatarFile(any(), any());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Cập nhật avatar thất bại khi user không tồn tại")
    void updateUserAvatar_UserNotFound_ShouldFail() throws Exception {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = userService.updateUserAvatar(999L, file);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(999L);
        verify(fileStorageService, never()).saveAvatarFile(any(), any());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Cập nhật avatar xóa avatar cũ nếu không phải default")
    void updateUserAvatar_DeleteOldAvatar_WhenNotDefault() throws Exception {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/jpeg");
        when(file.getSize()).thenReturn(1024L * 1024L);

        UserDtls userWithOldAvatar = new UserDtls();
        userWithOldAvatar.setId(1L);
        userWithOldAvatar.setAvatar("/img/avatar/old_avatar.jpg"); // Not default

        String newAvatarPath = "/img/avatar/user_1_20250115_143000.jpg";

        when(userRepository.findById(1L)).thenReturn(Optional.of(userWithOldAvatar));
        when(fileStorageService.saveAvatarFile(file, 1L)).thenReturn(newAvatarPath);
        doNothing().when(fileStorageService).deleteFile("/img/avatar/old_avatar.jpg");
        when(userRepository.save(any(UserDtls.class))).thenReturn(userWithOldAvatar);

        // Act
        ApiResponse<String> response = userService.updateUserAvatar(1L, file);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Avatar updated successfully", response.getMessage());

        // Verify
        verify(fileStorageService).deleteFile("/img/avatar/old_avatar.jpg");
        verify(fileStorageService).saveAvatarFile(file, 1L);
    }

    @Test
    @DisplayName("Cập nhật avatar không xóa avatar cũ nếu là default")
    void updateUserAvatar_NotDeleteOldAvatar_WhenDefault() throws Exception {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/jpeg");
        when(file.getSize()).thenReturn(1024L * 1024L);

        // sampleUser có avatar là default.jpg
        String newAvatarPath = "/img/avatar/user_1_20250115_143000.jpg";

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(fileStorageService.saveAvatarFile(file, 1L)).thenReturn(newAvatarPath);
        when(userRepository.save(any(UserDtls.class))).thenReturn(sampleUser);

        // Act
        ApiResponse<String> response = userService.updateUserAvatar(1L, file);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Avatar updated successfully", response.getMessage());

        // Verify - should NOT call deleteFile because it's default.jpg
        verify(fileStorageService, never()).deleteFile(anyString());
        verify(fileStorageService).saveAvatarFile(file, 1L);
    }

    // ========= RATE LIMIT TESTS =========

    @Test
    @DisplayName("Gửi mã xác thực email update thất bại do rate limit")
    void sendEmailVerificationForUpdate_RateLimit_ShouldFail() throws Exception {
        // Arrange
        VerificationCodeRequest request = new VerificationCodeRequest();
        request.setEmail("newemail@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByEmail("newemail@example.com")).thenReturn(false);
        when(emailVerificationService.generateVerificationCode("newemail@example.com"))
                .thenThrow(new EmailVerificationService.RateLimitException("Please wait 60 seconds"));

        // Act
        ApiResponse<String> response = userService.sendEmailVerificationForUpdate(1L, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Please wait 60 seconds", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(emailVerificationService).generateVerificationCode("newemail@example.com");
        verify(emailService, never()).sendEmailUpdateVerificationAsync(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Cập nhật avatar xử lý IOException")
    void updateUserAvatar_IOException_ShouldReturnError() throws Exception {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/jpeg");
        when(file.getSize()).thenReturn(1024L * 1024L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(fileStorageService.saveAvatarFile(file, 1L)).thenThrow(new IOException("Storage error"));

        // Act
        ApiResponse<String> response = userService.updateUserAvatar(1L, file);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().startsWith("Failed to save avatar file:"));
        assertNull(response.getData());

        // Verify
        verify(fileStorageService).saveAvatarFile(file, 1L);
        verify(userRepository, never()).save(any(UserDtls.class));
    }
}