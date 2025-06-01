package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ConsultantProfileRequest;
import com.healapp.dto.ConsultantProfileResponse;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.RoleRepository;
import com.healapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ConsultantServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConsultantProfileRepository consultantProfileRepository;

    // Cập nhật: Thêm RoleRepository mock
    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private ConsultantService consultantService;

    private UserDtls consultantUser;
    private UserDtls normalUser;
    private ConsultantProfile consultantProfile;
    private ConsultantProfileRequest validRequest;

    // Cập nhật: Thêm Role entities
    private Role consultantRole;
    private Role userRole;

    @BeforeEach
    void setUp() {
        // Cập nhật: Khởi tạo Role entities
        consultantRole = new Role();
        consultantRole.setRoleId(1L);
        consultantRole.setRoleName("CONSULTANT");
        consultantRole.setDescription("Healthcare consultant role");

        userRole = new Role();
        userRole.setRoleId(2L);
        userRole.setRoleName("USER");
        userRole.setDescription("Regular user role");

        // Cập nhật: Tạo mẫu dữ liệu test với Role entity
        consultantUser = new UserDtls();
        consultantUser.setId(1L);
        consultantUser.setUsername("consultant");
        consultantUser.setEmail("consultant@example.com");
        consultantUser.setFullName("Consultant User");
        consultantUser.setPhone("0123456789");
        consultantUser.setRole(consultantRole); // Sử dụng Role entity thay vì String

        normalUser = new UserDtls();
        normalUser.setId(2L);
        normalUser.setUsername("user");
        normalUser.setEmail("user@example.com");
        normalUser.setFullName("Normal User");
        normalUser.setPhone("0987654321");
        normalUser.setRole(userRole); // Sử dụng Role entity thay vì String

        consultantProfile = new ConsultantProfile();
        consultantProfile.setProfileId(1L);
        consultantProfile.setUser(consultantUser);
        consultantProfile.setQualifications("Bachelor's Degree in Medicine");
        consultantProfile.setExperience("5 years of clinical experience");
        consultantProfile.setBio("Passionate about helping people with mental health issues");

        validRequest = new ConsultantProfileRequest();
        validRequest.setQualifications("Master's Degree in Psychology");
        validRequest.setExperience("7 years of clinical experience");
        validRequest.setBio("Specialized in cognitive behavioral therapy");
    }

    @Test
    @DisplayName("Lấy danh sách tất cả consultant thành công")
    void getAllConsultantProfiles_ShouldReturnAllConsultantProfiles() {
        // Arrange
        List<UserDtls> consultantUsers = Arrays.asList(consultantUser);
        // Cập nhật: Sử dụng findByRoleName thay vì findByRole
        when(userRepository.findByRoleName("CONSULTANT")).thenReturn(consultantUsers);
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));

        // Act
        ApiResponse<List<ConsultantProfileResponse>> response = consultantService.getAllConsultantProfiles();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant profiles retrieved successfully", response.getMessage());
        assertEquals(1, response.getData().size());
        assertEquals(consultantUser.getId(), response.getData().get(0).getUserId());
        assertEquals(consultantProfile.getQualifications(), response.getData().get(0).getQualifications());

        // Cập nhật: Verify sử dụng findByRoleName
        verify(userRepository).findByRoleName("CONSULTANT");
        verify(consultantProfileRepository).findByUser(consultantUser);
    }

    @Test
    @DisplayName("Lấy danh sách consultant khi không có profile")
    void getAllConsultantProfiles_WhenNoProfileExists_ShouldReturnBasicInfo() {
        // Arrange
        List<UserDtls> consultantUsers = Arrays.asList(consultantUser);
        // Cập nhật: Sử dụng findByRoleName thay vì findByRole
        when(userRepository.findByRoleName("CONSULTANT")).thenReturn(consultantUsers);
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.empty());

        // Act
        ApiResponse<List<ConsultantProfileResponse>> response = consultantService.getAllConsultantProfiles();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant profiles retrieved successfully", response.getMessage());
        assertEquals(1, response.getData().size());
        assertEquals(consultantUser.getId(), response.getData().get(0).getUserId());
        assertNull(response.getData().get(0).getQualifications());

        // Cập nhật: Verify sử dụng findByRoleName
        verify(userRepository).findByRoleName("CONSULTANT");
        verify(consultantProfileRepository).findByUser(consultantUser);
    }

    @Test
    @DisplayName("Lấy thông tin chi tiết của một consultant thành công")
    void getConsultantProfileById_WhenConsultantExistsWithProfile_ShouldReturnProfile() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.getConsultantProfileById(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant profile retrieved successfully", response.getMessage());
        assertEquals(consultantUser.getId(), response.getData().getUserId());
        assertEquals(consultantUser.getFullName(), response.getData().getFullName());
        assertEquals(consultantProfile.getQualifications(), response.getData().getQualifications());
        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).findByUser(consultantUser);
    }

    @Test
    @DisplayName("Lấy thông tin consultant khi không có profile")
    void getConsultantProfileById_WhenConsultantExistsWithoutProfile_ShouldReturnBasicInfo() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.empty());

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.getConsultantProfileById(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant found but profile not complete", response.getMessage());
        assertEquals(consultantUser.getId(), response.getData().getUserId());
        assertEquals(consultantUser.getFullName(), response.getData().getFullName());
        assertNull(response.getData().getQualifications());
        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).findByUser(consultantUser);
    }

    @Test
    @DisplayName("Lấy thông tin của user không tồn tại")
    void getConsultantProfileById_WhenUserDoesNotExist_ShouldReturnError() {
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
    @DisplayName("Lấy thông tin của user không phải là consultant")
    void getConsultantProfileById_WhenUserIsNotConsultant_ShouldReturnError() {
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

    @Test
    @DisplayName("Tạo profile consultant mới thành công")
    void createOrUpdateConsultantProfile_WhenCreateNew_ShouldSucceed() {
        // Cập nhật: Tạo newConsultant với Role entity
        UserDtls newConsultant = new UserDtls();
        newConsultant.setId(3L);
        newConsultant.setUsername("newconsultant");
        newConsultant.setEmail("newconsultant@example.com");
        newConsultant.setFullName("New Consultant");
        newConsultant.setPhone("0123456780");
        newConsultant.setRole(consultantRole); // Sử dụng Role entity

        when(userRepository.findById(3L)).thenReturn(Optional.of(newConsultant));
        when(consultantProfileRepository.findByUser(newConsultant)).thenReturn(Optional.empty());

        ConsultantProfile newProfile = new ConsultantProfile();
        newProfile.setProfileId(3L);
        newProfile.setUser(newConsultant);
        newProfile.setQualifications(validRequest.getQualifications());
        newProfile.setExperience(validRequest.getExperience());
        newProfile.setBio(validRequest.getBio());

        when(consultantProfileRepository.save(any(ConsultantProfile.class))).thenReturn(newProfile);

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.createOrUpdateConsultantProfile(3L,
                validRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant profile updated successfully", response.getMessage());
        assertEquals(newConsultant.getId(), response.getData().getUserId());
        assertEquals(validRequest.getQualifications(), response.getData().getQualifications());
        assertEquals(validRequest.getExperience(), response.getData().getExperience());
        assertEquals(validRequest.getBio(), response.getData().getBio());

        // Verify
        verify(userRepository).findById(3L);
        verify(consultantProfileRepository).findByUser(newConsultant);

        // Capture the saved profile để kiểm tra chi tiết
        ArgumentCaptor<ConsultantProfile> profileCaptor = ArgumentCaptor.forClass(ConsultantProfile.class);
        verify(consultantProfileRepository).save(profileCaptor.capture());

        // Kiểm tra profile đã được thiết lập đúng
        ConsultantProfile capturedProfile = profileCaptor.getValue();
        assertEquals(newConsultant, capturedProfile.getUser());
        assertEquals(validRequest.getQualifications(), capturedProfile.getQualifications());
        assertEquals(validRequest.getExperience(), capturedProfile.getExperience());
        assertEquals(validRequest.getBio(), capturedProfile.getBio());

        // Không cập nhật user trong trường hợp tạo mới profile
        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Cập nhật profile consultant hiện tại thành công")
    void createOrUpdateConsultantProfile_WhenUpdate_ShouldSucceed() {
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
        assertEquals(consultantUser.getId(), response.getData().getUserId());
        assertEquals(validRequest.getQualifications(), response.getData().getQualifications());
        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).findByUser(consultantUser);
        verify(consultantProfileRepository).save(any(ConsultantProfile.class));

        verify(userRepository, never()).save(any(UserDtls.class));
    }

    @Test
    @DisplayName("Cập nhật profile cho user không phải consultant thất bại")
    void createOrUpdateConsultantProfile_WhenUserNotConsultant_ShouldFail() {
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
        verify(consultantProfileRepository, never()).findByUser(any(UserDtls.class));
        verify(consultantProfileRepository, never()).save(any(ConsultantProfile.class));
    }

    @Test
    @DisplayName("Cập nhật profile cho user không tồn tại")
    void createOrUpdateConsultantProfile_WhenUserDoesNotExist_ShouldReturnError() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<ConsultantProfileResponse> response = consultantService.createOrUpdateConsultantProfile(99L,
                validRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());
        verify(userRepository).findById(99L);
        verifyNoInteractions(consultantProfileRepository);
    }

    @Test
    @DisplayName("Xóa role consultant thành công")
    void removeConsultantRole_WhenUserIsConsultant_ShouldSucceed() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));
        // Cập nhật: Mock RoleRepository để trả về USER role
        when(roleRepository.findByRoleName("USER")).thenReturn(Optional.of(userRole));

        // Act
        ApiResponse<String> response = consultantService.removeConsultantRole(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant role removed successfully", response.getMessage());
        assertNull(response.getData());
        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).findByUser(consultantUser);
        verify(consultantProfileRepository).delete(consultantProfile);
        verify(userRepository).save(consultantUser);
        // Cập nhật: Verify Role entity được set
        verify(roleRepository).findByRoleName("USER");
        assertEquals(userRole, consultantUser.getRole());
    }

    @Test
    @DisplayName("Xóa role consultant khi user không phải là consultant")
    void removeConsultantRole_WhenUserIsNotConsultant_ShouldReturnError() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));

        // Act
        ApiResponse<String> response = consultantService.removeConsultantRole(2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User is not a consultant", response.getMessage());
        assertNull(response.getData());
        verify(userRepository).findById(2L);
        verifyNoInteractions(consultantProfileRepository);
        // Cập nhật: Verify RoleRepository không được gọi
        verifyNoInteractions(roleRepository);
    }

    @Test
    @DisplayName("Xóa role consultant khi user không tồn tại")
    void removeConsultantRole_WhenUserDoesNotExist_ShouldReturnError() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = consultantService.removeConsultantRole(99L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());
        verify(userRepository).findById(99L);
        verifyNoInteractions(consultantProfileRepository);
        // Cập nhật: Verify RoleRepository không được gọi
        verifyNoInteractions(roleRepository);
    }

    @Test
    @DisplayName("Xóa role consultant thất bại khi không tìm thấy USER role")
    void removeConsultantRole_WhenUserRoleNotFound_ShouldReturnError() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(consultantUser));
        when(consultantProfileRepository.findByUser(consultantUser)).thenReturn(Optional.of(consultantProfile));
        // Cập nhật: Mock RoleRepository trả về empty để test error case
        when(roleRepository.findByRoleName("USER")).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = consultantService.removeConsultantRole(1L);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to remove consultant role"));
        assertTrue(response.getMessage().contains("USER role not found in database"));
        assertNull(response.getData());
        verify(userRepository).findById(1L);
        verify(consultantProfileRepository).findByUser(consultantUser);
        verify(consultantProfileRepository).delete(consultantProfile);
        verify(roleRepository).findByRoleName("USER");
        // User không được save khi có lỗi
        verify(userRepository, never()).save(any(UserDtls.class));
    }
}