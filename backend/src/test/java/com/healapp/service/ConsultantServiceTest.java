package com.healapp.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ConsultantProfileRequest;
import com.healapp.dto.ConsultantProfileResponse;
import com.healapp.dto.CreateConsultantAccountRequest;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.RoleRepository;
import com.healapp.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("Kiểm thử dịch vụ quản lý Consultant")
class ConsultantServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConsultantProfileRepository consultantProfileRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ConsultantService consultantService;

    // Test data
    private UserDtls consultantUser;
    private UserDtls normalUser;
    private UserDtls inactiveConsultantUser;
    private ConsultantProfile consultantProfile;
    private ConsultantProfileRequest validRequest;
    private CreateConsultantAccountRequest createAccountRequest;
    private Role consultantRole;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        // Set up roles
        consultantRole = new Role();
        consultantRole.setRoleId(1L);
        consultantRole.setRoleName("CONSULTANT");
        consultantRole.setDescription("Healthcare consultant role");

        customerRole = new Role();
        customerRole.setRoleId(2L);
        customerRole.setRoleName("CUSTOMER");
        customerRole.setDescription("Regular customer role");

        // Set up users
        consultantUser = new UserDtls();
        consultantUser.setId(1L);
        consultantUser.setUsername("consultant");
        consultantUser.setEmail("consultant@example.com");
        consultantUser.setFullName("Dr. John Consultant");
        consultantUser.setPhone("0123456789");
        consultantUser.setRole(consultantRole);
        consultantUser.setIsActive(true);
        consultantUser.setAvatar("default.jpg");
        consultantUser.setBirthDay(LocalDate.of(1985, 5, 15));

        normalUser = new UserDtls();
        normalUser.setId(2L);
        normalUser.setUsername("customer");
        normalUser.setEmail("customer@example.com");
        normalUser.setFullName("Normal Customer");
        normalUser.setPhone("0987654321");
        normalUser.setRole(customerRole);
        normalUser.setIsActive(true);

        inactiveConsultantUser = new UserDtls();
        inactiveConsultantUser.setId(3L);
        inactiveConsultantUser.setUsername("inactive_consultant");
        inactiveConsultantUser.setEmail("inactive@example.com");
        inactiveConsultantUser.setFullName("Inactive Consultant");
        inactiveConsultantUser.setPhone("0111222333");
        inactiveConsultantUser.setRole(consultantRole);
        inactiveConsultantUser.setIsActive(false);

        // Set up consultant profile
        consultantProfile = new ConsultantProfile();
        consultantProfile.setProfileId(1L);
        consultantProfile.setUser(consultantUser);
        consultantProfile.setQualifications("MD, PhD in Psychology");
        consultantProfile.setExperience("10 years clinical experience");
        consultantProfile.setBio("Specialized in mental health counseling");
        consultantProfile.setUpdatedAt(LocalDateTime.now());

        // Set up request objects
        validRequest = new ConsultantProfileRequest();
        validRequest.setQualifications("Updated MD, PhD in Psychology");
        validRequest.setExperience("12 years clinical experience");
        validRequest.setBio("Updated bio - specialized in cognitive behavioral therapy");

        createAccountRequest = new CreateConsultantAccountRequest();
        createAccountRequest.setFullName("New Consultant");
        createAccountRequest.setEmail("newconsultant@example.com");
        createAccountRequest.setUsername("newconsultant");
        createAccountRequest.setPhone("0999888777");
        createAccountRequest.setBirthDay(LocalDate.of(1990, 3, 20));
        createAccountRequest.setQualifications("MD in Psychiatry");
        createAccountRequest.setExperience("5 years experience");
        createAccountRequest.setBio("Mental health specialist");

        // Set fields for ConsultantService
        ReflectionTestUtils.setField(consultantService, "avatarUrlPattern", "/img/avatar/");
        ReflectionTestUtils.setField(consultantService, "storageType", "local");
        ReflectionTestUtils.setField(consultantService, "gcsBucketName", "");
    }

    // ========== CREATE CONSULTANT ACCOUNT TESTS ==========

    @Test
    @DisplayName("Tạo tài khoản consultant mới - Thành công")
    void createConsultantAccount_Success() {
        // Arrange
        when(userRepository.existsByEmail(createAccountRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByUsername(createAccountRequest.getUsername())).thenReturn(false);
        when(roleRepository.findByRoleName("CONSULTANT")).thenReturn(Optional.of(consultantRole));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

        UserDtls savedUser = new UserDtls();
        savedUser.setId(10L);
        savedUser.setFullName(createAccountRequest.getFullName());
        savedUser.setEmail(createAccountRequest.getEmail());
        savedUser.setUsername(createAccountRequest.getUsername());
        savedUser.setRole(consultantRole);
        savedUser.setIsActive(true);

        when(userRepository.save(any(UserDtls.class))).thenReturn(savedUser);

        ConsultantProfile savedProfile = new ConsultantProfile();
        savedProfile.setProfileId(10L);
        savedProfile.setUser(savedUser);
        savedProfile.setQualifications(createAccountRequest.getQualifications());
        savedProfile.setExperience(createAccountRequest.getExperience());
        savedProfile.setBio(createAccountRequest.getBio());

        when(consultantProfileRepository.save(any(ConsultantProfile.class))).thenReturn(savedProfile);

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService
                .createConsultantAccount(createAccountRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant account created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(savedUser.getId(), response.getData().getUserId());
        assertEquals(createAccountRequest.getFullName(), response.getData().getFullName());
        assertEquals(createAccountRequest.getQualifications(), response.getData().getQualifications());

        // Verify interactions
        verify(userRepository).existsByEmail(createAccountRequest.getEmail());
        verify(userRepository).existsByUsername(createAccountRequest.getUsername());
        verify(roleRepository).findByRoleName("CONSULTANT");
        verify(userRepository).save(any(UserDtls.class));
        verify(consultantProfileRepository).save(any(ConsultantProfile.class));
    }

    @Test
    @DisplayName("Tạo tài khoản consultant - Thất bại do email đã tồn tại")
    void createConsultantAccount_EmailExists_ShouldFail() {
        // Arrange
        when(userRepository.existsByEmail(createAccountRequest.getEmail())).thenReturn(true);

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService
                .createConsultantAccount(createAccountRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Email already exists", response.getMessage());
        assertNull(response.getData());

        verify(userRepository).existsByEmail(createAccountRequest.getEmail());
        verify(userRepository, never()).save(any(UserDtls.class));
        verify(consultantProfileRepository, never()).save(any(ConsultantProfile.class));
    }

    @Test
    @DisplayName("Tạo tài khoản consultant - Thất bại do username đã tồn tại")
    void createConsultantAccount_UsernameExists_ShouldFail() {
        // Arrange
        when(userRepository.existsByEmail(createAccountRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByUsername(createAccountRequest.getUsername())).thenReturn(true);

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService
                .createConsultantAccount(createAccountRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Username already exists", response.getMessage());
        assertNull(response.getData());

        verify(userRepository).existsByEmail(createAccountRequest.getEmail());
        verify(userRepository).existsByUsername(createAccountRequest.getUsername());
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    // ========== ACTIVATE/DEACTIVATE CONSULTANT TESTS ==========

    @Test
    @DisplayName("Deactivate consultant - Thành công")
    void deactivateConsultant_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        doNothing().when(emailService).sendConsultantDeactivatedNotificationAsync(anyString(), anyString());

        // Act
        ApiResponse<String> response = consultantService.deactivateConsultant(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Consultant deactivated successfully"));
        assertFalse(consultantUser.getIsActive());

        verify(userRepository).findById(1L);
        verify(userRepository).save(consultantUser);
        verify(emailService).sendConsultantDeactivatedNotificationAsync(consultantUser.getEmail(),
                consultantUser.getFullName());
    }

    @Test
    @DisplayName("Deactivate consultant - Thất bại do consultant đã bị deactivate")
    void deactivateConsultant_AlreadyDeactivated_ShouldFail() {
        // Arrange
        when(userRepository.findById(3L)).thenReturn(Optional.of(inactiveConsultantUser));

        // Act
        ApiResponse<String> response = consultantService.deactivateConsultant(3L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Consultant is already deactivated", response.getMessage());

        verify(userRepository).findById(3L);
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Activate consultant - Thành công")
    void activateConsultant_Success() {
        // Arrange
        when(userRepository.findById(3L)).thenReturn(Optional.of(inactiveConsultantUser));
        when(consultantProfileRepository.findByUser(inactiveConsultantUser)).thenReturn(Optional.of(consultantProfile));
        doNothing().when(emailService).sendConsultantActivatedNotificationAsync(anyString(), anyString());

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.activateConsultant(3L);

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Consultant activated successfully"));
        assertTrue(inactiveConsultantUser.getIsActive());
        assertNotNull(response.getData());

        verify(userRepository).findById(3L);
        verify(userRepository).save(inactiveConsultantUser);
        verify(emailService).sendConsultantActivatedNotificationAsync(inactiveConsultantUser.getEmail(),
                inactiveConsultantUser.getFullName());
    }

    @Test
    @DisplayName("Activate consultant - Tạo profile mới nếu chưa có")
    void activateConsultant_CreateProfileIfNotExists() {
        // Arrange
        when(userRepository.findById(3L)).thenReturn(Optional.of(inactiveConsultantUser));
        when(consultantProfileRepository.findByUser(inactiveConsultantUser)).thenReturn(Optional.empty());

        ConsultantProfile newProfile = new ConsultantProfile();
        newProfile.setProfileId(5L);
        newProfile.setUser(inactiveConsultantUser);
        newProfile.setQualifications("To be updated");
        newProfile.setExperience("To be updated");
        newProfile.setBio("To be updated");

        when(consultantProfileRepository.save(any(ConsultantProfile.class))).thenReturn(newProfile);
        doNothing().when(emailService).sendConsultantActivatedNotificationAsync(anyString(), anyString());

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.activateConsultant(3L);

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(inactiveConsultantUser.getIsActive());
        assertNotNull(response.getData());
        assertEquals("To be updated", response.getData().getQualifications());

        verify(consultantProfileRepository).save(any(ConsultantProfile.class));
    }

    // ========== ROLE MANAGEMENT TESTS ==========

    @Test
    @DisplayName("Remove consultant role - Thành công")
    void removeConsultantRole_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));
        when(roleRepository.findByRoleName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        doNothing().when(emailService).sendConsultantRoleRemovedNotificationAsync(anyString(), anyString());

        // Act
        ApiResponse<String> response = consultantService.removeConsultantRole(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Consultant role removed successfully"));
        assertFalse(consultantUser.getIsActive());
        assertEquals(customerRole, consultantUser.getRole());

        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).findByUser(consultantUser);
        verify(consultantProfileRepository).delete(consultantProfile);
        verify(roleRepository).findByRoleName("CUSTOMER");
        verify(userRepository).save(consultantUser);
    }

    @Test
    @DisplayName("Add consultant role - Thành công")
    void addConsultantRole_Success() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));
        when(roleRepository.findByRoleName("CONSULTANT")).thenReturn(Optional.of(consultantRole));

        ConsultantProfile newProfile = new ConsultantProfile();
        newProfile.setProfileId(10L);
        newProfile.setUser(normalUser);
        newProfile.setQualifications("To be updated");
        newProfile.setExperience("To be updated");
        newProfile.setBio("To be updated");

        when(consultantProfileRepository.save(any(ConsultantProfile.class))).thenReturn(newProfile);

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.addConsultantRole(2L);

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Consultant role added successfully"));
        assertEquals(consultantRole, normalUser.getRole());
        assertTrue(normalUser.getIsActive());
        assertNotNull(response.getData());

        verify(userRepository).findById(2L);
        verify(roleRepository).findByRoleName("CONSULTANT");
        verify(userRepository).save(normalUser);
        verify(consultantProfileRepository).save(any(ConsultantProfile.class));
    }

    @Test
    @DisplayName("Add consultant role - Thất bại do user đã là consultant")
    void addConsultantRole_UserAlreadyConsultant_ShouldFail() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.addConsultantRole(1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User is already a consultant", response.getMessage());

        verify(userRepository).findById(1L);
        verify(roleRepository, never()).findByRoleName(anyString());
        verify(consultantProfileRepository, never()).save(any(ConsultantProfile.class));
    }

    // ========== GET CONSULTANT PROFILES TESTS ==========

    @Test
    @DisplayName("Lấy tất cả consultant profiles - Thành công")
    void getAllConsultantProfiles_Success() {
        // Arrange
        List<UserDtls> consultantUsers = Arrays.asList(consultantUser, inactiveConsultantUser);
        when(userRepository.findByRoleName("CONSULTANT")).thenReturn(consultantUsers);
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));
        when(consultantProfileRepository.findByUser(inactiveConsultantUser)).thenReturn(Optional.empty());

        // Act
        ApiResponse<List<ConsultantProfileResponse>> response = consultantService.getAllConsultantProfiles();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant profiles retrieved successfully", response.getMessage());
        assertEquals(2, response.getData().size());

        // Check first consultant (with profile)
        ConsultantProfileResponse firstResponse = response.getData().get(0);
        assertEquals(consultantUser.getId(), firstResponse.getUserId());
        assertEquals(consultantProfile.getQualifications(), firstResponse.getQualifications());

        // Check second consultant (without profile)
        ConsultantProfileResponse secondResponse = response.getData().get(1);
        assertEquals(inactiveConsultantUser.getId(), secondResponse.getUserId());
        assertNull(secondResponse.getQualifications());

        verify(userRepository).findByRoleName("CONSULTANT");
        verify(consultantProfileRepository).findByUser(consultantUser);
        verify(consultantProfileRepository).findByUser(inactiveConsultantUser);
    }

    @Test
    @DisplayName("Lấy active consultant profiles - Thành công")
    void getActiveConsultantProfiles_Success() {
        // Arrange
        List<UserDtls> activeConsultants = Arrays.asList(consultantUser);
        when(userRepository.findByRoleNameAndIsActive("CONSULTANT", true)).thenReturn(activeConsultants);
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));

        // Act
        ApiResponse<List<ConsultantProfileResponse>> response = consultantService.getActiveConsultantProfiles();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Active consultant profiles retrieved successfully", response.getMessage());
        assertEquals(1, response.getData().size());
        assertEquals(consultantUser.getId(), response.getData().get(0).getUserId());

        verify(userRepository).findByRoleNameAndIsActive("CONSULTANT", true);
        verify(consultantProfileRepository).findByUser(consultantUser);
    }

    @Test
    @DisplayName("Lấy consultant profile by ID - Thành công")
    void getConsultantProfileById_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.getConsultantProfileById(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant profile retrieved successfully", response.getMessage());
        assertEquals(consultantUser.getId(), response.getData().getUserId());
        assertEquals(consultantProfile.getQualifications(), response.getData().getQualifications());

        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).findByUser(consultantUser);
    }

    @Test
    @DisplayName("Lấy consultant profile by ID - User không tồn tại")
    void getConsultantProfileById_UserNotFound() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.getConsultantProfileById(99L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        verify(userRepository).findById(99L);
        verifyNoInteractions(consultantProfileRepository);
    }

    @Test
    @DisplayName("Lấy consultant profile by ID - User không phải consultant")
    void getConsultantProfileById_UserNotConsultant() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.getConsultantProfileById(2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User is not a consultant", response.getMessage());
        assertNull(response.getData());

        verify(userRepository).findById(2L);
        verifyNoInteractions(consultantProfileRepository);
    }

    // ========== UPDATE CONSULTANT PROFILE TESTS ==========

    @Test
    @DisplayName("Cập nhật consultant profile - Thành công")
    void createOrUpdateConsultantProfile_UpdateExisting_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));

        ConsultantProfile updatedProfile = new ConsultantProfile();
        updatedProfile.setProfileId(consultantProfile.getProfileId());
        updatedProfile.setUser(consultantUser);
        updatedProfile.setQualifications(validRequest.getQualifications());
        updatedProfile.setExperience(validRequest.getExperience());
        updatedProfile.setBio(validRequest.getBio());

        when(consultantProfileRepository.save(any(ConsultantProfile.class))).thenReturn(updatedProfile);

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.createOrUpdateConsultantProfile(1L,
                validRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant profile updated successfully", response.getMessage());
        assertEquals(validRequest.getQualifications(), response.getData().getQualifications());
        assertEquals(validRequest.getExperience(), response.getData().getExperience());
        assertEquals(validRequest.getBio(), response.getData().getBio());

        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).findByUser(consultantUser);
        verify(consultantProfileRepository).save(any(ConsultantProfile.class));
    }

    @Test
    @DisplayName("Tạo consultant profile mới - Thành công")
    void createOrUpdateConsultantProfile_CreateNew_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.empty());

        ConsultantProfile newProfile = new ConsultantProfile();
        newProfile.setProfileId(5L);
        newProfile.setUser(consultantUser);
        newProfile.setQualifications(validRequest.getQualifications());
        newProfile.setExperience(validRequest.getExperience());
        newProfile.setBio(validRequest.getBio());

        when(consultantProfileRepository.save(any(ConsultantProfile.class))).thenReturn(newProfile);

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.createOrUpdateConsultantProfile(1L,
                validRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant profile updated successfully", response.getMessage());
        assertEquals(validRequest.getQualifications(), response.getData().getQualifications());

        // Verify new profile was created
        ArgumentCaptor<ConsultantProfile> profileCaptor = ArgumentCaptor.forClass(ConsultantProfile.class);
        verify(consultantProfileRepository).save(profileCaptor.capture());

        ConsultantProfile capturedProfile = profileCaptor.getValue();
        assertEquals(consultantUser, capturedProfile.getUser());
        assertEquals(validRequest.getQualifications(), capturedProfile.getQualifications());
    }

    @Test
    @DisplayName("Cập nhật profile - Thất bại do user không phải consultant")
    void createOrUpdateConsultantProfile_UserNotConsultant_ShouldFail() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.createOrUpdateConsultantProfile(2L,
                validRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User must have CONSULTANT role to update profile. Please update role first.",
                response.getMessage());
        assertNull(response.getData());

        verify(userRepository).findById(2L);
        verifyNoInteractions(consultantProfileRepository);
    }

    // ========== ERROR HANDLING TESTS ==========

    @Test
    @DisplayName("Deactivate consultant - User không tồn tại")
    void deactivateConsultant_UserNotFound() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = consultantService.deactivateConsultant(99L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());

        verify(userRepository).findById(99L);
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Deactivate consultant - User không phải consultant")
    void deactivateConsultant_UserNotConsultant() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));

        // Act
        ApiResponse<String> response = consultantService.deactivateConsultant(2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User is not a consultant", response.getMessage());

        verify(userRepository).findById(2L);
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Remove consultant role - Customer role không tồn tại")
    void removeConsultantRole_CustomerRoleNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));
        when(roleRepository.findByRoleName("CUSTOMER")).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = consultantService.removeConsultantRole(1L);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to remove consultant role"));

        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).delete(consultantProfile);
        verify(roleRepository).findByRoleName("CUSTOMER");
        verify(userRepository, never()).save(any(UserDtls.class));
    }
}