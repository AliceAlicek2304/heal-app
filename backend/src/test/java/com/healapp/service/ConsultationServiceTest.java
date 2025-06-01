package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.AvailableTimeSlot;
import com.healapp.dto.ConsultationRequest;
import com.healapp.dto.ConsultationResponse;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.Consultation;
import com.healapp.model.ConsultationStatus;
import com.healapp.model.PaymentMethod;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.ConsultationRepository;
import com.healapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ConsultationServiceTest {

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConsultantProfileRepository consultantProfileRepository;

    @Mock
    private StripeService stripeService;

    @InjectMocks
    private ConsultationService consultationService;

    @Mock
    private EmailService emailService;

    @Mock
    private AppConfigService appConfigService;

    private UserDtls customer;
    private UserDtls consultant;
    private UserDtls adminUser;
    private UserDtls staffUser;
    private Consultation consultation;
    private ConsultationRequest consultationRequest;
    private LocalDate testDate;
    
    // Cập nhật: Thêm Role entities
    private Role userRole;
    private Role consultantRole;
    private Role adminRole;
    private Role staffRole;

    @BeforeEach
    void setUp() {
        // Set hourly rate for testing
        ReflectionTestUtils.setField(consultationService, "defaultHourlyRate", 150000.0f); // 150,000 VND per hour

        // Cập nhật: Khởi tạo Role entities
        userRole = new Role();
        userRole.setRoleId(1L);
        userRole.setRoleName("USER");
        userRole.setDescription("Regular user role");

        consultantRole = new Role();
        consultantRole.setRoleId(2L);
        consultantRole.setRoleName("CONSULTANT");
        consultantRole.setDescription("Healthcare consultant role");

        adminRole = new Role();
        adminRole.setRoleId(3L);
        adminRole.setRoleName("ADMIN");
        adminRole.setDescription("Administrator role");

        staffRole = new Role();
        staffRole.setRoleId(4L);
        staffRole.setRoleName("STAFF");
        staffRole.setDescription("Staff role");

        // Cập nhật: Khởi tạo khách hàng với Role entity
        customer = new UserDtls();
        customer.setId(1L);
        customer.setFullName("Customer Name");
        customer.setEmail("customer@example.com");
        customer.setUsername("customer");
        customer.setRole(userRole); // Sử dụng Role entity thay vì String

        // Cập nhật: Khởi tạo nhân viên tư vấn với Role entity
        consultant = new UserDtls();
        consultant.setId(2L);
        consultant.setFullName("Consultant Name");
        consultant.setEmail("consultant@example.com");
        consultant.setUsername("consultant");
        consultant.setRole(consultantRole); // Sử dụng Role entity thay vì String

        // Cập nhật: Khởi tạo admin user với Role entity
        adminUser = new UserDtls();
        adminUser.setId(3L);
        adminUser.setFullName("Admin Name");
        adminUser.setEmail("admin@example.com");
        adminUser.setUsername("admin");
        adminUser.setRole(adminRole); // Sử dụng Role entity thay vì String

        // Cập nhật: Khởi tạo staff user với Role entity
        staffUser = new UserDtls();
        staffUser.setId(4L);
        staffUser.setFullName("Staff Name");
        staffUser.setEmail("staff@example.com");
        staffUser.setUsername("staff");
        staffUser.setRole(staffRole); // Sử dụng Role entity thay vì String

        // Ngày test
        testDate = LocalDate.now().plusDays(1);

        // Khởi tạo yêu cầu đặt lịch
        consultationRequest = new ConsultationRequest();
        consultationRequest.setConsultantId(2L);
        consultationRequest.setDate(testDate);
        consultationRequest.setTimeSlot("8-10");
        consultationRequest.setPaymentMethod(PaymentMethod.COD); // Default payment method

        // Khởi tạo lịch tư vấn
        consultation = new Consultation();
        consultation.setConsultationId(1L);
        consultation.setCustomer(customer);
        consultation.setConsultant(consultant);
        consultation.setStartTime(testDate.atTime(8, 0));
        consultation.setEndTime(testDate.atTime(10, 0));
        consultation.setStatus(ConsultationStatus.PENDING);
        consultation.setCreatedAt(LocalDateTime.now());
        consultation.setPrice(300000.0f); // 2 hours * 150,000 VND
        consultation.setPaymentMethod(PaymentMethod.COD);
    }

    @Test
    @DisplayName("Lấy danh sách consultant thành công")
    void getAllConsultantMembers_ShouldReturnConsultantList() {
        // Arrange
        List<UserDtls> consultantList = Arrays.asList(consultant);
        // Cập nhật: Sử dụng findByRoleName thay vì findByRole
        when(userRepository.findByRoleName("CONSULTANT")).thenReturn(consultantList);

        // Act
        ApiResponse<List<UserDtls>> response = consultationService.getAllConsultantMembers();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant members retrieved successfully", response.getMessage());
        assertEquals(1, response.getData().size());
        assertEquals(consultant.getId(), response.getData().get(0).getId());

        // Cập nhật: Verify sử dụng findByRoleName
        verify(userRepository).findByRoleName("CONSULTANT");
    }

    @Test
    @DisplayName("Lấy danh sách consultant thất bại khi xảy ra lỗi")
    void getAllConsultantMembers_ShouldHandleException() {
        // Arrange
        // Cập nhật: Sử dụng findByRoleName thay vì findByRole
        when(userRepository.findByRoleName("CONSULTANT")).thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<List<UserDtls>> response = consultationService.getAllConsultantMembers();

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to retrieve consultant members"));
        assertNull(response.getData());

        // Cập nhật: Verify sử dụng findByRoleName
        verify(userRepository).findByRoleName("CONSULTANT");
    }

    @Test
    @DisplayName("Lấy khung giờ còn trống thành công")
    void getAvailableTimeSlots_ShouldReturnAvailableSlots() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());

        // Act
        ApiResponse<List<AvailableTimeSlot>> response = consultationService.getAvailableTimeSlots(2L, testDate);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Available time slots retrieved successfully", response.getMessage());
        assertEquals(4, response.getData().size());
        assertTrue(response.getData().stream().allMatch(AvailableTimeSlot::isAvailable));

        // Verify
        verify(userRepository).findById(2L);
        verify(consultationRepository).findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Lấy khung giờ còn trống thất bại khi consultant không tồn tại")
    void getAvailableTimeSlots_ShouldFailWhenConsultantNotFound() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<List<AvailableTimeSlot>> response = consultationService.getAvailableTimeSlots(99L, testDate);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Consultant not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(99L);
        verify(consultationRepository, never()).findByConsultantAndTimeRange(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Lấy khung giờ còn trống thất bại khi user không phải consultant")
    void getAvailableTimeSlots_ShouldFailWhenUserNotConsultant() {
        // Arrange
        UserDtls regularUser = new UserDtls();
        regularUser.setId(3L);
        regularUser.setRole(userRole); // Cập nhật: Sử dụng Role entity

        when(userRepository.findById(3L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<List<AvailableTimeSlot>> response = consultationService.getAvailableTimeSlots(3L, testDate);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Selected user is not a consultant", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(3L);
        verify(consultationRepository, never()).findByConsultantAndTimeRange(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Lấy khung giờ còn trống với một số slot đã bị chiếm")
    void getAvailableTimeSlots_WithSomeOccupiedSlots() {
        // Cập nhật: Đảm bảo role của consultant là CONSULTANT Role entity
        consultant.setRole(consultantRole);

        List<Consultation> existingConsultations = new ArrayList<>();

        // Tạo lịch tư vấn hiện có từ 10-12
        Consultation existingConsultation = new Consultation();
        existingConsultation.setConsultationId(2L);
        existingConsultation.setConsultant(consultant);
        existingConsultation.setCustomer(customer);
        existingConsultation.setStartTime(testDate.atTime(10, 0));
        existingConsultation.setEndTime(testDate.atTime(12, 0));
        existingConsultation.setStatus(ConsultationStatus.CONFIRMED);

        existingConsultations.add(existingConsultation);

        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L),
                any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(existingConsultations);

        // Act
        ApiResponse<List<AvailableTimeSlot>> response = consultationService.getAvailableTimeSlots(2L, testDate);

        // Assert
        assertTrue(response.isSuccess(), "Response should be successful but got: " + response.getMessage());
        assertEquals("Available time slots retrieved successfully", response.getMessage());
        assertEquals(4, response.getData().size());

        // Kiểm tra từng slot riêng biệt
        assertTrue(response.getData().get(0).isAvailable()); // 8-10 available
        assertFalse(response.getData().get(1).isAvailable()); // 10-12 NOT available (bị chiếm)
        assertTrue(response.getData().get(2).isAvailable()); // 13-15 available
        assertTrue(response.getData().get(3).isAvailable()); // 15-17 available

        // Verify
        verify(userRepository).findById(2L);
        verify(consultationRepository).findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thành công")
    void createConsultation_ShouldSucceed() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);
        when(appConfigService.getCurrentConsultationPrice())
                .thenReturn(ApiResponse.success("Current price", 150000.0));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultation scheduled successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getConsultationId());
        assertEquals("Customer Name", response.getData().getCustomerName());
        assertEquals("Consultant Name", response.getData().getConsultantName());
        assertEquals(ConsultationStatus.PENDING, response.getData().getStatus());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(consultationRepository).findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class));

        // Capture and verify the saved consultation
        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository).save(consultationCaptor.capture());

        Consultation savedConsultation = consultationCaptor.getValue();
        assertEquals(customer, savedConsultation.getCustomer());
        assertEquals(consultant, savedConsultation.getConsultant());
        assertEquals(testDate.atTime(8, 0), savedConsultation.getStartTime());
        assertEquals(testDate.atTime(10, 0), savedConsultation.getEndTime());
        assertEquals(ConsultationStatus.PENDING, savedConsultation.getStatus());
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thất bại khi khách hàng không tồn tại")
    void createConsultation_ShouldFailWhenCustomerNotFound() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 99L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Customer not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(99L);
        verify(userRepository, never()).findById(2L);
        verify(consultationRepository, never()).findByConsultantAndTimeRange(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thất bại khi consultant không tồn tại")
    void createConsultation_ShouldFailWhenConsultantNotFound() {
        // Arrange
        consultationRequest.setConsultantId(99L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Consultant not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).findById(99L);
        verify(consultationRepository, never()).findByConsultantAndTimeRange(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thất bại khi user được chọn không phải consultant")
    void createConsultation_ShouldFailWhenUserNotConsultant() {
        // Arrange
        UserDtls regularUser = new UserDtls();
        regularUser.setId(3L);
        regularUser.setRole(userRole); // Cập nhật: Sử dụng Role entity

        consultationRequest.setConsultantId(3L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Selected user is not a consultant", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).findById(3L);
        verify(consultationRepository, never()).findByConsultantAndTimeRange(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thất bại khi consultant tự chọn mình")
    void createConsultation_ShouldFailWhenSelfConsultation() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("You cannot select yourself as a consultant", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository, times(2)).findById(2L);
        verify(consultationRepository, never()).findByConsultantAndTimeRange(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thất bại khi khung giờ không hợp lệ")
    void createConsultation_ShouldFailWithInvalidTimeSlot() {
        // Arrange
        consultationRequest.setTimeSlot("9-11"); // Không phải khung giờ hợp lệ

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid time slot", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(consultationRepository, never()).findByConsultantAndTimeRange(
                anyLong(), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thất bại khi khung giờ đã được đặt")
    void createConsultation_ShouldFailWhenTimeSlotNotAvailable() {
        // Arrange
        List<Consultation> existingConsultations = new ArrayList<>();

        // Tạo lịch tư vấn hiện có từ 8-10
        Consultation existingConsultation = new Consultation();
        existingConsultation.setConsultationId(2L);
        existingConsultation.setConsultant(consultant);
        existingConsultation.setCustomer(customer);
        existingConsultation.setStartTime(testDate.atTime(8, 0));
        existingConsultation.setEndTime(testDate.atTime(10, 0));
        existingConsultation.setStatus(ConsultationStatus.CONFIRMED);

        existingConsultations.add(existingConsultation);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(existingConsultations);

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("The selected time slot is not available", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(userRepository).findById(2L);
        verify(consultationRepository).findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thành công với phương thức COD")
    void createConsultation_WithCODPayment_ShouldSucceed() {
        // Arrange
        consultationRequest.setPaymentMethod(PaymentMethod.COD);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());
        when(appConfigService.getCurrentConsultationPrice())
                .thenReturn(ApiResponse.success("Current price", 150000.0));

        when(consultationRepository.save(any(Consultation.class))).thenAnswer(invocation -> {
            Consultation savedConsultation = invocation.getArgument(0);
            savedConsultation.setConsultationId(1L);
            return savedConsultation;
        });

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultation scheduled successfully", response.getMessage());
        assertNotNull(response.getData());

        // Verify consultation properties
        assertEquals(1L, response.getData().getConsultationId());
        assertEquals(PaymentMethod.COD, response.getData().getPaymentMethod());
        assertEquals(300000.0f, response.getData().getPrice());

        // Verify method calls
        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository).save(consultationCaptor.capture());
        Consultation capturedConsultation = consultationCaptor.getValue();

        assertEquals(PaymentMethod.COD, capturedConsultation.getPaymentMethod());
        assertEquals(ConsultationStatus.PENDING, capturedConsultation.getStatus());
        assertNull(capturedConsultation.getStripePaymentId());
        assertEquals(300000.0f, capturedConsultation.getPrice()); // 2 hours * 150,000 VND
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thành công với phương thức VISA")
    void createConsultation_WithVisaPayment_ShouldSucceed() {
        // Arrange
        consultationRequest.setPaymentMethod(PaymentMethod.VISA);
        consultationRequest.setCardNumber("4242424242424242");
        consultationRequest.setExpiryMonth("12");
        consultationRequest.setExpiryYear("2025");
        consultationRequest.setCvc("123");
        consultationRequest.setCardHolderName("Test Customer");

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());
        when(appConfigService.getCurrentConsultationPrice())
                .thenReturn(ApiResponse.success("Current price", 150000.0));

        // Consultation với trạng thái PAYMENT_PENDING (trước khi xử lý thanh toán)
        Consultation pendingConsultation = new Consultation();
        pendingConsultation.setConsultationId(1L);
        pendingConsultation.setCustomer(customer);
        pendingConsultation.setConsultant(consultant);
        pendingConsultation.setStartTime(testDate.atTime(8, 0));
        pendingConsultation.setEndTime(testDate.atTime(10, 0));
        pendingConsultation.setStatus(ConsultationStatus.PAYMENT_PENDING);
        pendingConsultation.setPrice(300000.0f); // 2 hours * 150,000 VND
        pendingConsultation.setPaymentMethod(PaymentMethod.VISA);

        // Consultation sau khi thanh toán thành công
        Consultation paidConsultation = new Consultation();
        paidConsultation.setConsultationId(1L);
        paidConsultation.setCustomer(customer);
        paidConsultation.setConsultant(consultant);
        paidConsultation.setStartTime(testDate.atTime(8, 0));
        paidConsultation.setEndTime(testDate.atTime(10, 0));
        paidConsultation.setStatus(ConsultationStatus.PENDING);
        paidConsultation.setPrice(300000.0f);
        paidConsultation.setPaymentMethod(PaymentMethod.VISA);
        paidConsultation.setStripePaymentId("pi_test123456789");
        paidConsultation.setPaymentDate(LocalDateTime.now());

        // Mock save method để trả về pendingConsultation lần đầu và paidConsultation lần sau
        when(consultationRepository.save(any(Consultation.class)))
                .thenReturn(pendingConsultation)
                .thenReturn(paidConsultation);

        // Mock stripe payment
        when(stripeService.processPayment(
                any(Consultation.class),
                eq("4242424242424242"),
                eq("12"),
                eq("2025"),
                eq("123"),
                eq("Test Customer")))
                .thenReturn(ApiResponse.success("Payment processed successfully", "pi_test123456789"));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultation scheduled and payment processed successfully", response.getMessage());
        assertEquals(PaymentMethod.VISA, response.getData().getPaymentMethod());
        assertNotNull(response.getData().getPaymentDate());
        assertEquals(300000.0f, response.getData().getPrice());

        // Verify stripe payment was processed
        verify(stripeService).processPayment(
                any(Consultation.class),
                eq("4242424242424242"),
                eq("12"),
                eq("2025"),
                eq("123"),
                eq("Test Customer"));

        // Verify consultation was saved twice (initially and after payment)
        verify(consultationRepository, times(2)).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Tạo lịch tư vấn thất bại khi thanh toán VISA bị từ chối")
    void createConsultation_WithVisaPayment_ShouldFailWhenPaymentDeclined() {
        // Arrange
        consultationRequest.setPaymentMethod(PaymentMethod.VISA);
        consultationRequest.setCardNumber("4000000000000002"); // Thẻ bị từ chối
        consultationRequest.setExpiryMonth("12");
        consultationRequest.setExpiryYear("2025");
        consultationRequest.setCvc("123");
        consultationRequest.setCardHolderName("Test Customer");

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());
        when(appConfigService.getCurrentConsultationPrice())
                .thenReturn(ApiResponse.success("Current price", 150000.0));

        // Consultation với trạng thái PAYMENT_PENDING (trước khi xử lý thanh toán)
        Consultation pendingConsultation = new Consultation();
        pendingConsultation.setConsultationId(1L);
        pendingConsultation.setCustomer(customer);
        pendingConsultation.setConsultant(consultant);
        pendingConsultation.setStartTime(testDate.atTime(8, 0));
        pendingConsultation.setEndTime(testDate.atTime(10, 0));
        pendingConsultation.setStatus(ConsultationStatus.PAYMENT_PENDING);
        pendingConsultation.setPrice(300000.0f);
        pendingConsultation.setPaymentMethod(PaymentMethod.VISA);

        // Consultation sau khi thanh toán thất bại
        Consultation failedConsultation = new Consultation();
        failedConsultation.setConsultationId(1L);
        failedConsultation.setCustomer(customer);
        failedConsultation.setConsultant(consultant);
        failedConsultation.setStartTime(testDate.atTime(8, 0));
        failedConsultation.setEndTime(testDate.atTime(10, 0));
        failedConsultation.setStatus(ConsultationStatus.PAYMENT_FAILED);
        failedConsultation.setPrice(300000.0f);
        failedConsultation.setPaymentMethod(PaymentMethod.VISA);

        when(consultationRepository.save(any(Consultation.class)))
                .thenReturn(pendingConsultation)
                .thenReturn(failedConsultation);

        // Mock stripe payment failure
        when(stripeService.processPayment(
                any(Consultation.class),
                anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(ApiResponse.error("Card declined"));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Card declined", response.getMessage());
        assertNull(response.getData());

        // Verify consultation status was updated to PAYMENT_FAILED after failed payment
        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository, times(2)).save(consultationCaptor.capture());
        List<Consultation> capturedConsultations = consultationCaptor.getAllValues();
        assertEquals(ConsultationStatus.PAYMENT_FAILED, capturedConsultations.get(1).getStatus());
    }

    // ... [Tiếp tục với các test methods khác và cập nhật theo Role entity]
    // Phần còn lại sẽ tương tự, thay thế setRole("STRING") bằng setRole(roleEntity)
    // và cập nhật verify calls từ findByRole thành findByRoleName

    @Test
    @DisplayName("Lọc consultation theo status - STAFF/ADMIN xem tất cả")
    void getConsultationsByStatus_StaffOrAdmin_ShouldReturnAll() {
        // Arrange - Cập nhật: Sử dụng adminRole entity
        when(userRepository.findById(3L)).thenReturn(Optional.of(adminUser));

        // Tạo 2 consultation có status PENDING
        Consultation consultation1 = new Consultation();
        consultation1.setConsultationId(1L);
        consultation1.setCustomer(customer);
        consultation1.setConsultant(consultant);
        consultation1.setStartTime(testDate.atTime(8, 0));
        consultation1.setEndTime(testDate.atTime(10, 0));
        consultation1.setStatus(ConsultationStatus.PENDING);

        Consultation consultation2 = new Consultation();
        consultation2.setConsultationId(2L);
        consultation2.setCustomer(customer);
        consultation2.setConsultant(consultant);
        consultation2.setStartTime(testDate.atTime(13, 0));
        consultation2.setEndTime(testDate.atTime(15, 0));
        consultation2.setStatus(ConsultationStatus.PENDING);

        List<Consultation> pendingConsultations = Arrays.asList(consultation1, consultation2);

        when(consultationRepository.findByStatus(ConsultationStatus.PENDING)).thenReturn(pendingConsultations);

        // Act
        ApiResponse<List<ConsultationResponse>> response = consultationService
                .getConsultationsByStatus(ConsultationStatus.PENDING, 3L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals(2, response.getData().size());
        assertTrue(response.getMessage().contains("Retrieved 2 consultations with status PENDING"));

        // Verify
        verify(userRepository).findById(3L);
        verify(consultationRepository).findByStatus(ConsultationStatus.PENDING);
    }

    @Test
    @DisplayName("Lọc consultation theo status - CONSULTANT chỉ xem được của mình")
    void getConsultationsByStatus_Consultant_ShouldReturnOnlyOwn() {
        // Arrange - Cập nhật: Sử dụng consultantRole entity
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));

        // Tạo các consultation có status PENDING cho consultant
        Consultation consultation1 = new Consultation();
        consultation1.setConsultationId(1L);
        consultation1.setCustomer(customer);
        consultation1.setConsultant(consultant);
        consultation1.setStartTime(testDate.atTime(8, 0));
        consultation1.setEndTime(testDate.atTime(10, 0));
        consultation1.setStatus(ConsultationStatus.PENDING);

        List<Consultation> consultantPendingConsultations = Arrays.asList(consultation1);

        when(consultationRepository.findByConsultantAndStatus(consultant, ConsultationStatus.PENDING))
                .thenReturn(consultantPendingConsultations);

        // Act
        ApiResponse<List<ConsultationResponse>> response = consultationService
                .getConsultationsByStatus(ConsultationStatus.PENDING, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals(1, response.getData().size());
        assertTrue(response.getMessage().contains("Retrieved 1 consultations with status PENDING"));

        // Verify
        verify(userRepository).findById(2L);
        verify(consultationRepository).findByConsultantAndStatus(consultant, ConsultationStatus.PENDING);
    }

    @Test
    @DisplayName("Lọc consultation theo status - USER thường chỉ xem được lịch họ đặt")
    void getConsultationsByStatus_RegularUser_ShouldReturnOnlyOwn() {
        // Arrange - Cập nhật: Sử dụng userRole entity
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));

        Consultation customerConsultation = new Consultation();
        customerConsultation.setConsultationId(1L);
        customerConsultation.setCustomer(customer);
        customerConsultation.setConsultant(consultant);
        customerConsultation.setStartTime(testDate.atTime(8, 0));
        customerConsultation.setEndTime(testDate.atTime(10, 0));
        customerConsultation.setStatus(ConsultationStatus.CONFIRMED);

        List<Consultation> customerConsultations = Arrays.asList(customerConsultation);

        when(consultationRepository.findByCustomerAndStatus(customer, ConsultationStatus.CONFIRMED))
                .thenReturn(customerConsultations);

        // Act
        ApiResponse<List<ConsultationResponse>> response = consultationService
                .getConsultationsByStatus(ConsultationStatus.CONFIRMED, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals(1, response.getData().size());
        assertTrue(response.getMessage().contains("Retrieved 1 consultations with status CONFIRMED"));

        // Verify
        verify(userRepository).findById(1L);
        verify(consultationRepository).findByCustomerAndStatus(customer, ConsultationStatus.CONFIRMED);
    }

    @Test
    @DisplayName("Cập nhật trạng thái lịch tư vấn thành CONFIRMED thành công")
    void updateConsultationStatus_ConfirmedByConsultant_ShouldSucceed() {
        // Arrange
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(invocation -> {
            Consultation savedConsultation = invocation.getArgument(0);
            return savedConsultation; // Trả về chính đối tượng được lưu
        });
        doNothing().when(emailService).sendConsultationConfirmationAsync(any(Consultation.class));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.CONFIRMED, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultation status updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(ConsultationStatus.CONFIRMED, response.getData().getStatus());

        // Kiểm tra URL Jitsi Meet được tạo đúng format
        assertNotNull(response.getData().getMeetUrl());
        assertTrue(response.getData().getMeetUrl().startsWith("https://meet.jit.si/Heal_Consultation_1_"));

        // Verify
        verify(consultationRepository).findById(1L);

        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository).save(consultationCaptor.capture());

        Consultation savedConsultation = consultationCaptor.getValue();
        assertEquals(ConsultationStatus.CONFIRMED, savedConsultation.getStatus());
        assertTrue(savedConsultation.getMeetUrl().startsWith("https://meet.jit.si/Heal_Consultation_1_"));

        // Verify email service was called
        verify(emailService).sendConsultationConfirmationAsync(any(Consultation.class));
    }

    // Thêm các test methods khác tương tự...
    // Tất cả đều cần cập nhật từ setRole("STRING") thành setRole(roleEntity)
    // và verify calls từ findByRole thành findByRoleName

    private ConsultationResponse convertToResponse(Consultation consultation) {
        ConsultationResponse response = new ConsultationResponse();
        response.setConsultationId(consultation.getConsultationId());
        response.setCustomerId(consultation.getCustomer().getId());
        response.setCustomerName(consultation.getCustomer().getFullName());
        response.setConsultantId(consultation.getConsultant().getId());
        response.setConsultantName(consultation.getConsultant().getFullName());
        response.setStartTime(consultation.getStartTime());
        response.setEndTime(consultation.getEndTime());
        response.setStatus(consultation.getStatus());
        response.setMeetUrl(consultation.getMeetUrl());
        response.setPrice(consultation.getPrice());
        response.setPaymentMethod(consultation.getPaymentMethod());
        response.setPaymentDate(consultation.getPaymentDate());
        response.setCreatedAt(consultation.getCreatedAt());
        response.setUpdatedAt(consultation.getUpdatedAt());
        return response;
    }
}