package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.AvailableTimeSlot;
import com.healapp.dto.ConsultationRequest;
import com.healapp.dto.ConsultationResponse;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.Consultation;
import com.healapp.model.ConsultationStatus;
import com.healapp.model.PaymentMethod;
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

    private UserDtls customer;
    private UserDtls consultant;
    private Consultation consultation;
    private ConsultationRequest consultationRequest;
    private LocalDate testDate;

    @BeforeEach
    void setUp() {
        // Set hourly rate for testing
        ReflectionTestUtils.setField(consultationService, "defaultHourlyRate", 150000.0f); // 150,000 VND per hour

        // Khởi tạo khách hàng
        customer = new UserDtls();
        customer.setId(1L);
        customer.setFullName("Customer Name");
        customer.setEmail("customer@example.com");
        customer.setUsername("customer");
        customer.setRole("USER");

        // Khởi tạo nhân viên tư vấn
        consultant = new UserDtls();
        consultant.setId(2L);
        consultant.setFullName("Consultant Name");
        consultant.setEmail("consultant@example.com");
        consultant.setUsername("consultant");
        consultant.setRole("CONSULTANT");

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
        when(userRepository.findByRole("CONSULTANT")).thenReturn(consultantList);

        // Act
        ApiResponse<List<UserDtls>> response = consultationService.getAllConsultantMembers();

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultant members retrieved successfully", response.getMessage());
        assertEquals(1, response.getData().size());
        assertEquals(consultant.getId(), response.getData().get(0).getId());

        // Verify
        verify(userRepository).findByRole("CONSULTANT");
    }

    @Test
    @DisplayName("Lấy danh sách consultant thất bại khi xảy ra lỗi")
    void getAllConsultantMembers_ShouldHandleException() {
        // Arrange
        when(userRepository.findByRole("CONSULTANT")).thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<List<UserDtls>> response = consultationService.getAllConsultantMembers();

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to retrieve consultant members"));
        assertNull(response.getData());

        // Verify
        verify(userRepository).findByRole("CONSULTANT");
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
        regularUser.setRole("USER");

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
        // Đảm bảo role của consultant là CONSULTANT
        consultant.setRole("CONSULTANT");

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
        regularUser.setRole("USER");

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

        // Mock save method để trả về pendingConsultation lần đầu và paidConsultation
        // lần sau
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

    @Test
    @DisplayName("Tạo URL Jitsi Meet với ID Consultation")
    void generateJitsiMeetUrl_ShouldCreateCorrectFormat() {
        // Arrange
        String meetUrl = "";
        try {
            java.lang.reflect.Method method = ConsultationService.class.getDeclaredMethod("generateJitsiMeetUrl",
                    Long.class);
            method.setAccessible(true);
            meetUrl = (String) method.invoke(consultationService, 12345L);
        } catch (Exception e) {
            fail("Failed to call generateJitsiMeetUrl: " + e.getMessage());
        }

        // Assert
        assertTrue(meetUrl.startsWith("https://meet.jit.si/Heal_Consultation_12345_"));

        // Kiểm tra URL có thể truy cập được (định dạng đúng)
        assertTrue(meetUrl.startsWith("https://"));
        assertFalse(meetUrl.contains(" "));

        // Kiểm tra có chứa UUID
        String[] parts = meetUrl.split("_");
        assertEquals(4, parts.length); // Có 4 phần: "https://meet.jit.si/Heal", "Consultation", "12345", "[UUID]"
        assertEquals(8, parts[3].length()); // UUID được cắt còn 8 ký tự
    }

    @Test
    @DisplayName("Cập nhật trạng thái thành CONFIRMED thất bại khi không phải consultant được chỉ định")
    void updateConsultationStatus_ConfirmedByNonAssignedUser_ShouldFail() {
        // Arrange
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.CONFIRMED, 3L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only assigned consultant can confirm the consultation", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(consultationRepository).findById(1L);
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái thành CANCELED thành công khi là customer")
    void updateConsultationStatus_CanceledByCustomer_ShouldSucceed() {
        // Arrange
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.CANCELED, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultation status updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(ConsultationStatus.CANCELED, response.getData().getStatus());

        // Verify
        verify(consultationRepository).findById(1L);

        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository).save(consultationCaptor.capture());

        Consultation savedConsultation = consultationCaptor.getValue();
        assertEquals(ConsultationStatus.CANCELED, savedConsultation.getStatus());
    }

    @Test
    @DisplayName("Cập nhật trạng thái thành CANCELED thành công khi là consultant được chỉ định")
    void updateConsultationStatus_CanceledByConsultant_ShouldSucceed() {
        // Arrange
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.CANCELED, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultation status updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(ConsultationStatus.CANCELED, response.getData().getStatus());

        // Verify
        verify(consultationRepository).findById(1L);
        verify(consultationRepository).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái thành CANCELED thất bại khi không phải customer hoặc consultant")
    void updateConsultationStatus_CanceledByUnauthorizedUser_ShouldFail() {
        // Arrange
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.CANCELED, 3L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("You don't have permission to cancel this consultation", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(consultationRepository).findById(1L);
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái thành COMPLETED thành công khi là consultant được chỉ định và sau giờ kết thúc")
    void updateConsultationStatus_CompletedByConsultantAfterEndTime_ShouldSucceed() {
        // Arrange
        // Đặt thời gian kết thúc trong quá khứ
        consultation.setEndTime(LocalDateTime.now().minusHours(1));

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenReturn(consultation);

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.COMPLETED, 2L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultation status updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(ConsultationStatus.COMPLETED, response.getData().getStatus());

        // Verify
        verify(consultationRepository).findById(1L);
        verify(consultationRepository).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái thành COMPLETED thất bại khi chưa đến giờ kết thúc")
    void updateConsultationStatus_CompletedBeforeEndTime_ShouldFail() {
        // Arrange
        // Đặt thời gian kết thúc trong tương lai
        consultation.setEndTime(LocalDateTime.now().plusHours(1));

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.COMPLETED, 2L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Consultation cannot be marked as completed before its end time", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(consultationRepository).findById(1L);
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái thành COMPLETED thất bại khi không phải consultant được chỉ định")
    void updateConsultationStatus_CompletedByNonAssignedUser_ShouldFail() {
        // Arrange
        // Đặt thời gian kết thúc trong quá khứ
        consultation.setEndTime(LocalDateTime.now().minusHours(1));

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.COMPLETED, 3L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only assigned consultant can mark the consultation as completed", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(consultationRepository).findById(1L);
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Hủy lịch tư vấn và hoàn tiền thành công với phương thức VISA")
    void updateConsultationStatus_CancelWithVisa_ShouldProcessRefund() {
        // Arrange
        // Tạo lịch đã thanh toán bằng VISA
        Consultation visaConsultation = new Consultation();
        visaConsultation.setConsultationId(1L);
        visaConsultation.setCustomer(customer);
        visaConsultation.setConsultant(consultant);
        visaConsultation.setStartTime(testDate.atTime(8, 0));
        visaConsultation.setEndTime(testDate.atTime(10, 0));
        visaConsultation.setStatus(ConsultationStatus.CONFIRMED);
        visaConsultation.setPrice(300000.0f);
        visaConsultation.setPaymentMethod(PaymentMethod.VISA);
        visaConsultation.setStripePaymentId("pi_test123456789");

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(visaConsultation));

        // Mock hoàn tiền thành công
        when(stripeService.processRefund("pi_test123456789"))
                .thenReturn(ApiResponse.success("Refund processed successfully", "re_test123456789"));

        when(consultationRepository.save(any(Consultation.class))).thenAnswer(invocation -> {
            Consultation savedConsultation = invocation.getArgument(0);
            return savedConsultation;
        });

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.CANCELED, 1L); // Customer cancels

        // Assert
        assertTrue(response.isSuccess(), "Expected success response but got: " + response.getMessage());
        assertEquals("Consultation status updated successfully", response.getMessage());
        assertEquals(ConsultationStatus.CANCELED, response.getData().getStatus());

        // Verify refund was processed
        verify(stripeService).processRefund("pi_test123456789");

        // Verify payment date was updated
        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository).save(consultationCaptor.capture());
        Consultation capturedConsultation = consultationCaptor.getValue();

        assertEquals(ConsultationStatus.CANCELED, capturedConsultation.getStatus());
        assertNotNull(capturedConsultation.getPaymentDate());
    }

    @Test
    @DisplayName("Hủy lịch tư vấn thất bại khi hoàn tiền VISA gặp lỗi")
    void updateConsultationStatus_CancelWithVisa_ShouldFailWhenRefundError() {
        // Arrange
        // Tạo lịch đã thanh toán bằng VISA
        Consultation visaConsultation = new Consultation();
        visaConsultation.setConsultationId(1L);
        visaConsultation.setCustomer(customer);
        visaConsultation.setConsultant(consultant);
        visaConsultation.setStartTime(testDate.atTime(8, 0));
        visaConsultation.setEndTime(testDate.atTime(10, 0));
        visaConsultation.setStatus(ConsultationStatus.CONFIRMED);
        visaConsultation.setPrice(300000.0f);
        visaConsultation.setPaymentMethod(PaymentMethod.VISA);
        visaConsultation.setStripePaymentId("pi_test123456789");

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(visaConsultation));

        // Mock hoàn tiền thất bại
        when(stripeService.processRefund("pi_test123456789"))
                .thenReturn(ApiResponse.error("Refund failed: Payment already refunded"));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.CANCELED, 1L); // Customer cancels

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Failed to process refund: Refund failed: Payment already refunded", response.getMessage());

        // Verify refund was attempted
        verify(stripeService).processRefund("pi_test123456789");

        // Verify consultation status was not updated
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Hủy lịch tư vấn với phương thức COD không cần hoàn tiền")
    void updateConsultationStatus_CancelWithCOD_NoRefundNeeded() {
        // Arrange
        // Tạo lịch với phương thức COD
        Consultation codConsultation = new Consultation();
        codConsultation.setConsultationId(1L);
        codConsultation.setCustomer(customer);
        codConsultation.setConsultant(consultant);
        codConsultation.setStartTime(testDate.atTime(8, 0));
        codConsultation.setEndTime(testDate.atTime(10, 0));
        codConsultation.setStatus(ConsultationStatus.CONFIRMED);
        codConsultation.setPrice(300000.0f);
        codConsultation.setPaymentMethod(PaymentMethod.COD);
        codConsultation.setStripePaymentId(null);

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(codConsultation));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(invocation -> {
            Consultation savedConsultation = invocation.getArgument(0);
            return savedConsultation;
        });

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.CANCELED, 1L); // Customer cancels

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultation status updated successfully", response.getMessage());
        assertEquals(ConsultationStatus.CANCELED, response.getData().getStatus());

        // Verify no refund was processed (Stripe service was not called)
        verify(stripeService, never()).processRefund(anyString());

        // Verify status was updated
        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository).save(consultationCaptor.capture());
        Consultation capturedConsultation = consultationCaptor.getValue();
        assertEquals(ConsultationStatus.CANCELED, capturedConsultation.getStatus());
    }

    @Test
    @DisplayName("Tính toán giá tư vấn chính xác dựa trên thời lượng")
    void createConsultation_ShouldCalculateCorrectPrice() {
        // Arrange
        consultationRequest.setPaymentMethod(PaymentMethod.COD);

        // Test với khung giờ 8-10 (2 giờ)
        consultationRequest.setTimeSlot("8-10");

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());

        when(consultationRepository.save(any(Consultation.class))).thenAnswer(invocation -> {
            Consultation savedConsultation = invocation.getArgument(0);
            savedConsultation.setConsultationId(1L);
            return savedConsultation;
        });

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.createConsultation(consultationRequest, 1L);

        // Assert
        assertTrue(response.isSuccess());

        // Verify price calculation for 2-hour slot
        // hourlyRate = 150,000 VND, time slot = 2 hours, so price should be 300,000 VND
        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(consultationRepository).save(consultationCaptor.capture());
        Consultation capturedConsultation = consultationCaptor.getValue();
        assertEquals(300000.0f, capturedConsultation.getPrice());

        // Reset và test với khung giờ 13-15 (2 giờ)
        reset(consultationRepository);
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(invocation -> {
            Consultation savedConsultation = invocation.getArgument(0);
            savedConsultation.setConsultationId(2L);
            return savedConsultation;
        });

        consultationRequest.setTimeSlot("13-15");
        response = consultationService.createConsultation(consultationRequest, 1L);

        // Verify price calculation for another 2-hour slot
        assertTrue(response.isSuccess());
        verify(consultationRepository).save(consultationCaptor.capture());
        capturedConsultation = consultationCaptor.getValue();
        assertEquals(300000.0f, capturedConsultation.getPrice());

        // Reset và test với khung giờ 10-12 (cũng 2 giờ)
        reset(consultationRepository);
        when(consultationRepository.findByConsultantAndTimeRange(
                eq(2L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(invocation -> {
            Consultation savedConsultation = invocation.getArgument(0);
            savedConsultation.setConsultationId(3L);
            return savedConsultation;
        });

        consultationRequest.setTimeSlot("10-12");
        response = consultationService.createConsultation(consultationRequest, 1L);

        // Verify price calculation for yet another 2-hour slot
        assertTrue(response.isSuccess());
        verify(consultationRepository).save(consultationCaptor.capture());
        capturedConsultation = consultationCaptor.getValue();
        assertEquals(300000.0f, capturedConsultation.getPrice());
    }

    @Test
    @DisplayName("Lấy lịch tư vấn cho người dùng thành công")
    void getConsultationsForUser_ShouldSucceed() {
        // Arrange
        List<Consultation> consultations = Arrays.asList(consultation);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(consultationRepository.findByUserInvolved(1L)).thenReturn(consultations);

        // Mock consultantProfileRepository để không trả về profile
        when(consultantProfileRepository.findByUserId(anyLong()))
                .thenReturn(Optional.empty());

        // Act
        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsForUser(1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Consultations retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
        assertEquals(1L, response.getData().get(0).getConsultationId());
        assertEquals("Customer Name", response.getData().get(0).getCustomerName());
        assertEquals("Consultant Name", response.getData().get(0).getConsultantName());

        // Verify
        verify(userRepository).findById(1L);
        verify(consultationRepository).findByUserInvolved(1L);
    }

    @Test
    @DisplayName("Lấy lịch tư vấn thất bại khi người dùng không tồn tại")
    void getConsultationsForUser_ShouldFailWhenUserNotFound() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsForUser(99L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(99L);
        verify(consultationRepository, never()).findByUserInvolved(anyLong());
    }

    @Test
    @DisplayName("Lấy lịch tư vấn thất bại khi xảy ra lỗi")
    void getConsultationsForUser_ShouldHandleException() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(consultationRepository.findByUserInvolved(1L))
                .thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<List<ConsultationResponse>> response = consultationService.getConsultationsForUser(1L);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to retrieve consultations"));
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(consultationRepository).findByUserInvolved(1L);
    }

    @Test
    @DisplayName("Cập nhật trạng thái thành CONFIRMED tạo URL Jitsi Meet và gửi email")
    void updateConsultationStatus_Confirmed_ShouldCreateMeetUrlAndSendEmail() {
        // Arrange
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(invocation -> {
            Consultation savedConsultation = invocation.getArgument(0);
            return savedConsultation;
        });
        doNothing().when(emailService).sendConsultationConfirmationAsync(any(Consultation.class));

        // Act
        ApiResponse<ConsultationResponse> response = consultationService.updateConsultationStatus(1L,
                ConsultationStatus.CONFIRMED, 2L);

        // Assert
        assertTrue(response.isSuccess());

        // Verify email was sent with correct URL format
        ArgumentCaptor<Consultation> consultationCaptor = ArgumentCaptor.forClass(Consultation.class);
        verify(emailService).sendConsultationConfirmationAsync(consultationCaptor.capture());

        Consultation sentConsultation = consultationCaptor.getValue();
        assertNotNull(sentConsultation.getMeetUrl());
        assertTrue(sentConsultation.getMeetUrl().startsWith("https://meet.jit.si/Heal_Consultation_1_"));

        // Verify actual Jitsi link format
        assertTrue(sentConsultation.getMeetUrl().startsWith("https://meet.jit.si/"));
        String roomId = sentConsultation.getMeetUrl().replace("https://meet.jit.si/", "");
        assertFalse(roomId.isEmpty());
    }

    @Test
    @DisplayName("Lọc consultation theo status - STAFF/ADMIN xem tất cả")
    void getConsultationsByStatus_StaffOrAdmin_ShouldReturnAll() {
        // Arrange - Tạo một admin user
        UserDtls adminUser = new UserDtls();
        adminUser.setId(3L);
        adminUser.setFullName("Admin Name");
        adminUser.setEmail("admin@example.com");
        adminUser.setUsername("admin");
        adminUser.setRole("ADMIN");

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

        when(userRepository.findById(3L)).thenReturn(Optional.of(adminUser));
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
        // Arrange
        // Tạo các consultation có status PENDING cho consultant
        Consultation consultation1 = new Consultation();
        consultation1.setConsultationId(1L);
        consultation1.setCustomer(customer);
        consultation1.setConsultant(consultant);
        consultation1.setStartTime(testDate.atTime(8, 0));
        consultation1.setEndTime(testDate.atTime(10, 0));
        consultation1.setStatus(ConsultationStatus.PENDING);

        List<Consultation> consultantPendingConsultations = Arrays.asList(consultation1);

        when(userRepository.findById(2L)).thenReturn(Optional.of(consultant));
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
        // Arrange
        Consultation customerConsultation = new Consultation();
        customerConsultation.setConsultationId(1L);
        customerConsultation.setCustomer(customer);
        customerConsultation.setConsultant(consultant);
        customerConsultation.setStartTime(testDate.atTime(8, 0));
        customerConsultation.setEndTime(testDate.atTime(10, 0));
        customerConsultation.setStatus(ConsultationStatus.CONFIRMED);

        List<Consultation> customerConsultations = Arrays.asList(customerConsultation);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
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
    @DisplayName("Lọc consultation theo status - Trường hợp không tìm thấy kết quả")
    void getConsultationsByStatus_NoResults() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(consultationRepository.findByCustomerAndStatus(customer, ConsultationStatus.CANCELED))
                .thenReturn(new ArrayList<>());

        // Act
        ApiResponse<List<ConsultationResponse>> response = consultationService
                .getConsultationsByStatus(ConsultationStatus.CANCELED, 1L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals(0, response.getData().size());
        assertTrue(response.getMessage().contains("Retrieved 0 consultations with status CANCELED"));

        // Verify
        verify(userRepository).findById(1L);
        verify(consultationRepository).findByCustomerAndStatus(customer, ConsultationStatus.CANCELED);
    }

    @Test
    @DisplayName("Lọc consultation theo status - Xử lý lỗi khi người dùng không tồn tại")
    void getConsultationsByStatus_UserNotFound_ShouldFail() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<List<ConsultationResponse>> response = consultationService
                .getConsultationsByStatus(ConsultationStatus.PENDING, 99L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(99L);
        verify(consultationRepository, never()).findByStatus(any(ConsultationStatus.class));
        verify(consultationRepository, never()).findByConsultantAndStatus(any(UserDtls.class),
                any(ConsultationStatus.class));
        verify(consultationRepository, never()).findByCustomerAndStatus(any(UserDtls.class),
                any(ConsultationStatus.class));
    }

    @Test
    @DisplayName("Lọc consultation theo status - Xử lý ngoại lệ")
    void getConsultationsByStatus_Exception_ShouldFail() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(consultationRepository.findByCustomerAndStatus(eq(customer), any(ConsultationStatus.class)))
                .thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<List<ConsultationResponse>> response = consultationService
                .getConsultationsByStatus(ConsultationStatus.PENDING, 1L);

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to retrieve consultations"));
        assertNull(response.getData());

        // Verify
        verify(userRepository).findById(1L);
        verify(consultationRepository).findByCustomerAndStatus(customer, ConsultationStatus.PENDING);
    }
}
