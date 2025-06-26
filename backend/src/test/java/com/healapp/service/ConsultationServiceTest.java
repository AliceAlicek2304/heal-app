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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.AvailableTimeSlot;
import com.healapp.dto.ConsultationRequest;
import com.healapp.dto.ConsultationResponse;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.Consultation;
import com.healapp.model.ConsultationStatus;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.ConsultationRepository;
import com.healapp.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationService Test")
class ConsultationServiceTest {

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private ConsultantProfileRepository consultantProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ConsultationService consultationService;

    private UserDtls customer;
    private UserDtls consultant;
    private UserDtls staff;
    private UserDtls admin;
    private Role customerRole;
    private Role consultantRole;
    private Role staffRole;
    private Role adminRole;
    private Consultation consultation;
    private ConsultantProfile consultantProfile;
    private ConsultationRequest consultationRequest;

    @BeforeEach
    void setUp() {
        // Setup Role entities
        customerRole = new Role();
        customerRole.setRoleId(1L);
        customerRole.setRoleName("CUSTOMER");
        customerRole.setDescription("Regular customer role");

        consultantRole = new Role();
        consultantRole.setRoleId(2L);
        consultantRole.setRoleName("CONSULTANT");
        consultantRole.setDescription("Healthcare consultant role");

        staffRole = new Role();
        staffRole.setRoleId(3L);
        staffRole.setRoleName("STAFF");
        staffRole.setDescription("Staff role");

        adminRole = new Role();
        adminRole.setRoleId(4L);
        adminRole.setRoleName("ADMIN");
        adminRole.setDescription("Administrator role");

        // Setup UserDtls entities
        customer = new UserDtls();
        customer.setId(1L);
        customer.setUsername("customer");
        customer.setFullName("Customer User");
        customer.setEmail("customer@example.com");
        customer.setRole(customerRole);

        consultant = new UserDtls();
        consultant.setId(2L);
        consultant.setUsername("consultant");
        consultant.setFullName("Consultant User");
        consultant.setEmail("consultant@example.com");
        consultant.setRole(consultantRole);

        staff = new UserDtls();
        staff.setId(3L);
        staff.setUsername("staff");
        staff.setFullName("Staff User");
        staff.setEmail("staff@example.com");
        staff.setRole(staffRole);

        admin = new UserDtls();
        admin.setId(4L);
        admin.setUsername("admin");
        admin.setFullName("Admin User");
        admin.setEmail("admin@example.com");
        admin.setRole(adminRole);

        // Setup ConsultantProfile
        consultantProfile = new ConsultantProfile();
        consultantProfile.setProfileId(1L);
        consultantProfile.setUser(consultant);
        consultantProfile.setQualifications("MD in General Medicine");
        consultantProfile.setExperience("5 years of clinical experience");
        consultantProfile.setBio("Experienced healthcare consultant");

        // Setup Consultation
        consultation = new Consultation();
        consultation.setConsultationId(1L);
        consultation.setCustomer(customer);
        consultation.setConsultant(consultant);
        consultation.setStartTime(LocalDateTime.now().plusDays(1).withHour(8).withMinute(0));
        consultation.setEndTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
        consultation.setStatus(ConsultationStatus.PENDING);
        consultation.setCreatedAt(LocalDateTime.now());
        consultation.setUpdatedAt(LocalDateTime.now());

        // Setup ConsultationRequest
        consultationRequest = new ConsultationRequest();
        consultationRequest.setConsultantId(2L);
        consultationRequest.setDate(LocalDate.now().plusDays(1));
        consultationRequest.setTimeSlot("8-10");
    }

    // Test getAvailableTimeSlots method
    @Test
    @DisplayName("Lấy time slots có sẵn - Thành công")
    void getAvailableTimeSlots_Success() {
        LocalDate testDate = LocalDate.now().plusDays(1);
        
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Arrays.asList());

        ApiResponse<List<AvailableTimeSlot>> response = consultationService.getAvailableTimeSlots(2L, testDate);

        assertTrue(response.isSuccess());
        assertEquals("Available time slots retrieved successfully", response.getMessage());
        assertEquals(4, response.getData().size());
        assertTrue(response.getData().stream().allMatch(AvailableTimeSlot::isAvailable));

        verify(userRepository).findById(2L);
        verify(consultationRepository).findByConsultantAndTimeRange(eq(2L), any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Lấy time slots có sẵn - Consultant không tồn tại")
    void getAvailableTimeSlots_ConsultantNotFound() {
        LocalDate testDate = LocalDate.now().plusDays(1);
        
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ApiResponse<List<AvailableTimeSlot>> response = consultationService.getAvailableTimeSlots(999L, testDate);

        assertFalse(response.isSuccess());
        assertEquals("Consultant not found", response.getMessage());

        verify(userRepository).findById(999L);
        verifyNoInteractions(consultationRepository);
    }

    @Test
    @DisplayName("Lấy time slots có sẵn - User không phải consultant")
    void getAvailableTimeSlots_UserNotConsultant() {
        LocalDate testDate = LocalDate.now().plusDays(1);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));

        ApiResponse<List<AvailableTimeSlot>> response = consultationService.getAvailableTimeSlots(1L, testDate);

        assertFalse(response.isSuccess());
        assertEquals("Selected user is not a consultant", response.getMessage());

        verify(userRepository).findById(1L);
        verifyNoInteractions(consultationRepository);
    }

    @Test
    @DisplayName("Lấy time slots có sẵn - Có lịch đã đặt")
    void getAvailableTimeSlots_WithExistingConsultations() {
        LocalDate testDate = LocalDate.now().plusDays(1);
        
        Consultation existingConsultation = new Consultation();
        existingConsultation.setStartTime(testDate.atTime(8, 0));
        existingConsultation.setEndTime(testDate.atTime(10, 0));
        existingConsultation.setStatus(ConsultationStatus.CONFIRMED);

        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Arrays.asList(existingConsultation));

        ApiResponse<List<AvailableTimeSlot>> response = consultationService.getAvailableTimeSlots(2L, testDate);

        assertTrue(response.isSuccess());
        assertEquals(4, response.getData().size());
        
        // Time slot 8-10 should be unavailable
        Optional<AvailableTimeSlot> slot810 = response.getData().stream()
                .filter(slot -> "8-10".equals(slot.getSlot()))
                .findFirst();
        assertTrue(slot810.isPresent());
        assertFalse(slot810.get().isAvailable());
    }

    // Test createConsultation method
    @Test
    @DisplayName("Tạo consultation - Thành công")
    void createConsultation_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Arrays.asList());
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);

        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        assertTrue(response.isSuccess());
        assertEquals("Consultation scheduled successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getConsultationId());

        verify(userRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(consultationRepository).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo consultation - Customer không tồn tại")
    void createConsultation_CustomerNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 999L);

        assertFalse(response.isSuccess());
        assertEquals("Customer not found", response.getMessage());

        verify(userRepository).findById(999L);
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo consultation - Consultant không tồn tại")
    void createConsultation_ConsultantNotFound() {
        consultationRequest.setConsultantId(999L);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        assertFalse(response.isSuccess());
        assertEquals("Consultant not found", response.getMessage());

        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo consultation - User không phải consultant")
    void createConsultation_UserNotConsultant() {
        consultationRequest.setConsultantId(1L); // Customer ID instead of consultant
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));

        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        assertFalse(response.isSuccess());
        assertEquals("Selected user is not a consultant", response.getMessage());

        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo consultation - Không thể chọn chính mình")
    void createConsultation_CannotSelectSelf() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));

        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 2L);

        assertFalse(response.isSuccess());
        assertEquals("You cannot select yourself as a consultant", response.getMessage());

        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo consultation - Time slot không hợp lệ")
    void createConsultation_InvalidTimeSlot() {
        consultationRequest.setTimeSlot("6-8"); // Invalid time slot
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));

        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        assertFalse(response.isSuccess());
        assertEquals("Invalid time slot", response.getMessage());

        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo consultation - Time slot không có sẵn")
    void createConsultation_TimeSlotNotAvailable() {
        Consultation existingConsultation = new Consultation();
        existingConsultation.setStartTime(LocalDate.now().plusDays(1).atTime(8, 0));
        existingConsultation.setEndTime(LocalDate.now().plusDays(1).atTime(10, 0));
        existingConsultation.setStatus(ConsultationStatus.CONFIRMED);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Arrays.asList(existingConsultation));

        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        assertFalse(response.isSuccess());
        assertEquals("The selected time slot is not available", response.getMessage());

        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    // Test updateConsultationStatus method
    @Test
    @DisplayName("Cập nhật trạng thái consultation - Confirm thành công")
    void updateConsultationStatus_Confirm_Success() throws Exception {
        consultation.setMeetUrl(null);
        
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);
        doNothing().when(emailService).sendConsultationConfirmationAsync(any(Consultation.class));

        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(
                1L, ConsultationStatus.CONFIRMED, 2L);

        assertTrue(response.isSuccess());
        assertEquals("Consultation status updated successfully", response.getMessage());
        assertEquals(ConsultationStatus.CONFIRMED, response.getData().getStatus());
        assertNotNull(response.getData().getMeetUrl());

        verify(consultationRepository).findById(1L);
        verify(consultationRepository).save(any(Consultation.class));
        verify(emailService).sendConsultationConfirmationAsync(any(Consultation.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái consultation - Consultation không tồn tại")
    void updateConsultationStatus_ConsultationNotFound() {
        when(consultationRepository.findById(999L)).thenReturn(Optional.empty());

        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(
                999L, ConsultationStatus.CONFIRMED, 2L);

        assertFalse(response.isSuccess());
        assertEquals("Consultation not found", response.getMessage());

        verify(consultationRepository).findById(999L);
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái consultation - Không có quyền confirm")
    void updateConsultationStatus_NoPermissionToConfirm() {
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));

        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(
                1L, ConsultationStatus.CONFIRMED, 1L); // Customer trying to confirm

        assertFalse(response.isSuccess());
        assertEquals("Only assigned consultant can confirm the consultation", response.getMessage());

        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái consultation - Cancel thành công")
    void updateConsultationStatus_Cancel_Success() {
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);

        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(
                1L, ConsultationStatus.CANCELED, 1L); // Customer canceling

        assertTrue(response.isSuccess());
        assertEquals("Consultation status updated successfully", response.getMessage());

        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository).save(consultationCaptor.capture());
        assertEquals(ConsultationStatus.CANCELED, consultationCaptor.getValue().getStatus());
    }

    @Test
    @DisplayName("Cập nhật trạng thái consultation - Không có quyền cancel")
    void updateConsultationStatus_NoPermissionToCancel() {
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));

        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(
                1L, ConsultationStatus.CANCELED, 3L); // Staff trying to cancel

        assertFalse(response.isSuccess());
        assertEquals("You don't have permission to cancel this consultation", response.getMessage());

        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái consultation - Complete thành công")
    void updateConsultationStatus_Complete_Success() {
        // Set consultation end time to past
        consultation.setEndTime(LocalDateTime.now().minusHours(1));
        
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);

        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(
                1L, ConsultationStatus.COMPLETED, 2L);

        assertTrue(response.isSuccess());
        assertEquals("Consultation status updated successfully", response.getMessage());

        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository).save(consultationCaptor.capture());
        assertEquals(ConsultationStatus.COMPLETED, consultationCaptor.getValue().getStatus());
    }

    @Test
    @DisplayName("Cập nhật trạng thái consultation - Complete trước thời gian")
    void updateConsultationStatus_CompleteTooEarly() {
        // Set consultation end time to future
        consultation.setEndTime(LocalDateTime.now().plusHours(1));
        
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));

        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(
                1L, ConsultationStatus.COMPLETED, 2L);

        assertFalse(response.isSuccess());
        assertEquals("Consultation cannot be marked as completed before its end time", response.getMessage());

        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    // Test getConsultationsByStatus method
    @Test
    @DisplayName("Lấy consultations theo status - Admin thành công")
    void getConsultationsByStatus_Admin_Success() {
        List<Consultation> consultations = Arrays.asList(consultation);
        
        when(userRepository.findById(4L)).thenReturn(Optional.of(admin));
        when(consultationRepository.findByStatus(ConsultationStatus.PENDING)).thenReturn(consultations);

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsByStatus(
                ConsultationStatus.PENDING, 4L);

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Retrieved 1 consultations with status PENDING"));
        assertEquals(1, response.getData().size());

        verify(consultationRepository).findByStatus(ConsultationStatus.PENDING);
    }

    @Test
    @DisplayName("Lấy consultations theo status - Staff thành công")
    void getConsultationsByStatus_Staff_Success() {
        List<Consultation> consultations = Arrays.asList(consultation);
        
        when(userRepository.findById(3L)).thenReturn(Optional.of(staff));
        when(consultationRepository.findByStatus(ConsultationStatus.PENDING)).thenReturn(consultations);

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsByStatus(
                ConsultationStatus.PENDING, 3L);

        assertTrue(response.isSuccess());
        assertEquals(1, response.getData().size());

        verify(consultationRepository).findByStatus(ConsultationStatus.PENDING);
    }

    @Test
    @DisplayName("Lấy consultations theo status - Consultant thành công")
    void getConsultationsByStatus_Consultant_Success() {
        List<Consultation> consultations = Arrays.asList(consultation);
        
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndStatus(consultant, ConsultationStatus.PENDING))
                .thenReturn(consultations);

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsByStatus(
                ConsultationStatus.PENDING, 2L);

        assertTrue(response.isSuccess());
        assertEquals(1, response.getData().size());

        verify(consultationRepository).findByConsultantAndStatus(consultant, ConsultationStatus.PENDING);
    }

    @Test
    @DisplayName("Lấy consultations theo status - Customer thành công")
    void getConsultationsByStatus_Customer_Success() {
        List<Consultation> consultations = Arrays.asList(consultation);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(consultationRepository.findByCustomerAndStatus(customer, ConsultationStatus.PENDING))
                .thenReturn(consultations);

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsByStatus(
                ConsultationStatus.PENDING, 1L);

        assertTrue(response.isSuccess());
        assertEquals(1, response.getData().size());

        verify(consultationRepository).findByCustomerAndStatus(customer, ConsultationStatus.PENDING);
    }

    @Test
    @DisplayName("Lấy consultations theo status - User không tồn tại")
    void getConsultationsByStatus_UserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsByStatus(
                ConsultationStatus.PENDING, 999L);

        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());

        verify(userRepository).findById(999L);
        verifyNoInteractions(consultationRepository);
    }

    // Test getConsultationsForUser method    @Test
    @DisplayName("Lấy consultations cho user - Thành công")
    void getConsultationsForUser_Success() {
        List<Consultation> consultations = Arrays.asList(consultation);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(consultationRepository.findByCustomerId(1L)).thenReturn(consultations);

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsForUser(1L);

        assertTrue(response.isSuccess());
        assertEquals("Consultations retrieved successfully", response.getMessage());
        assertEquals(1, response.getData().size());

        verify(consultationRepository).findByCustomerId(1L);
    }

    @Test
    @DisplayName("Lấy consultations cho user - User không tồn tại")
    void getConsultationsForUser_UserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsForUser(999L);

        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());

        verify(userRepository).findById(999L);
        verifyNoInteractions(consultationRepository);
    }

    // Test getAllConsultantMembers method
    @Test
    @DisplayName("Lấy tất cả consultant members - Thành công")
    void getAllConsultantMembers_Success() {
        List<UserDtls> consultants = Arrays.asList(consultant);
        
        when(userRepository.findByRoleNameAndIsActive("CONSULTANT", true)).thenReturn(consultants);

        ApiResponse<List<UserDtls>> response = consultationService.getAllConsultantMembers();

        assertTrue(response.isSuccess());
        assertEquals("Active consultant members retrieved successfully", response.getMessage());
        assertEquals(1, response.getData().size());
        assertEquals("consultant", response.getData().get(0).getUsername());

        verify(userRepository).findByRoleNameAndIsActive("CONSULTANT", true);
    }

    // Test getConsultationsForConsultant method    @Test
    @DisplayName("Lấy consultations cho consultant - Thành công")
    void getConsultationsForConsultant_Success() {
        List<Consultation> consultations = Arrays.asList(consultation);
        
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantId(2L)).thenReturn(consultations);

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsForConsultant(2L);

        assertTrue(response.isSuccess());
        assertEquals("Consultant schedule retrieved successfully", response.getMessage());
        assertEquals(1, response.getData().size());

        verify(consultationRepository).findByConsultantId(2L);
    }    @Test
    @DisplayName("Lấy consultations cho consultant - User không tồn tại")
    void getConsultationsForConsultant_UserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsForConsultant(999L);

        assertFalse(response.isSuccess());
        assertEquals("Consultant not found", response.getMessage());

        verify(userRepository).findById(999L);
        verifyNoInteractions(consultationRepository);
    }    @Test
    @DisplayName("Lấy consultations cho consultant - User không phải consultant")
    void getConsultationsForConsultant_UserNotConsultant() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));

        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsForConsultant(1L);

        assertFalse(response.isSuccess());
        assertEquals("Access denied. User is not a consultant", response.getMessage());

        verify(userRepository).findById(1L);
        verifyNoInteractions(consultationRepository);
    }

    // Test convertToResponse method functionality through other tests
    @Test
    @DisplayName("Convert to response - Với consultant profile")
    void convertToResponse_WithConsultantProfile() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(anyLong(), any(), any()))
                .thenReturn(Arrays.asList());
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);
        when(consultantProfileRepository.findByUserId(2L)).thenReturn(Optional.of(consultantProfile));

        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        assertTrue(response.isSuccess());
        ConsultationResponse data = response.getData();
        assertEquals(consultant.getFullName(), data.getConsultantName());
        assertEquals(customer.getFullName(), data.getCustomerName());
        assertEquals(consultation.getConsultationId(), data.getConsultationId());
    }

    @Test
    @DisplayName("Convert to response - Không có consultant profile")
    void convertToResponse_WithoutConsultantProfile() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(anyLong(), any(), any()))
                .thenReturn(Arrays.asList());
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);
        when(consultantProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        assertTrue(response.isSuccess());
        ConsultationResponse data = response.getData();
        assertEquals(consultant.getFullName(), data.getConsultantName());
        assertEquals(customer.getFullName(), data.getCustomerName());
        assertNull(data.getConsultantQualifications());
        assertNull(data.getConsultantExperience());
    }
}