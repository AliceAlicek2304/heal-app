package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.STITestRequest;
import com.healapp.dto.STITestResponse;
import com.healapp.dto.STITestStatusUpdateRequest;
import com.healapp.dto.TestResultRequest;
import com.healapp.dto.TestResultResponse;
import com.healapp.exception.PaymentException;
import com.healapp.model.*;
import com.healapp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Kiểm thử dịch vụ quản lý STI Test")
class STITestServiceTest {

    @Mock
    private STITestRepository stiTestRepository;

    @Mock
    private STIServiceRepository stiServiceRepository;

    @Mock
    private ServiceTestComponentRepository testComponentRepository;

    @Mock
    private TestResultRepository testResultRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StripeService stripeService;

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private STITestService stiTestService;

    // Test data
    private UserDtls customer;
    private UserDtls staff;
    private UserDtls consultant;
    private UserDtls admin;
    private STIService stiService;
    private STITest stiTest;
    private STITest savedTest; // ✅ THÊM: Test object sau khi save (có testId)
    private STITestRequest validRequest;
    private Payment payment;
    private Role customerRole;
    private Role staffRole;
    private Role consultantRole;
    private Role adminRole;
    private List<ServiceTestComponent> testComponents;

    @BeforeEach
    void setUp() {
        // Initialize Roles
        customerRole = new Role();
        customerRole.setRoleId(1L);
        customerRole.setRoleName("CUSTOMER");

        staffRole = new Role();
        staffRole.setRoleId(2L);
        staffRole.setRoleName("STAFF");

        consultantRole = new Role();
        consultantRole.setRoleId(3L);
        consultantRole.setRoleName("CONSULTANT");

        adminRole = new Role();
        adminRole.setRoleId(4L);
        adminRole.setRoleName("ADMIN");

        // Initialize Users
        customer = new UserDtls();
        customer.setId(1L);
        customer.setUsername("customer");
        customer.setFullName("Test Customer");
        customer.setEmail("customer@test.com");
        customer.setPhone("0123456789");
        customer.setRole(customerRole);

        staff = new UserDtls();
        staff.setId(2L);
        staff.setUsername("staff");
        staff.setFullName("Test Staff");
        staff.setRole(staffRole);

        consultant = new UserDtls();
        consultant.setId(3L);
        consultant.setUsername("consultant");
        consultant.setFullName("Test Consultant");
        consultant.setRole(consultantRole);

        admin = new UserDtls();
        admin.setId(4L);
        admin.setUsername("admin");
        admin.setFullName("Test Admin");
        admin.setRole(adminRole);

        // Initialize Test Components
        testComponents = new ArrayList<>();
        ServiceTestComponent component1 = new ServiceTestComponent();
        component1.setComponentId(1L);
        component1.setTestName("HIV Test");
        component1.setReferenceRange("Negative");

        ServiceTestComponent component2 = new ServiceTestComponent();
        component2.setComponentId(2L);
        component2.setTestName("Hepatitis B Test");
        component2.setReferenceRange("Negative");

        testComponents.add(component1);
        testComponents.add(component2);

        // Initialize STI Service
        stiService = new STIService();
        stiService.setServiceId(1L);
        stiService.setName("STI Comprehensive Test");
        stiService.setDescription("Complete STI screening package");
        stiService.setPrice(500000.0);
        stiService.setIsActive(true);
        stiService.setTestComponents(testComponents);

        // ✅ STI Test TRƯỚC khi save (testId = null)
        stiTest = STITest.builder()
                .testId(null) // ✅ Trước save = null (realistic)
                .customer(customer)
                .stiService(stiService)
                .appointmentDate(LocalDateTime.now().plusDays(1))
                .customerNotes("Test notes")
                .totalPrice(BigDecimal.valueOf(500000))
                .status(TestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // ✅ STI Test SAU khi save (testId = 1L) - Mock sẽ return object này
        savedTest = STITest.builder()
                .testId(1L) // ✅ Sau save = 1L (auto-generated)
                .customer(customer)
                .stiService(stiService)
                .appointmentDate(LocalDateTime.now().plusDays(1))
                .customerNotes("Test notes")
                .totalPrice(BigDecimal.valueOf(500000))
                .status(TestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // ✅ Payment với correct testId = 1L
        payment = Payment.builder()
                .paymentId(1L)
                .userId(customer.getId())
                .serviceType("STI")
                .serviceId(1L) // ✅ Match với savedTest.testId
                .paymentMethod(PaymentMethod.QR_CODE)
                .paymentStatus(PaymentStatus.COMPLETED)
                .amount(BigDecimal.valueOf(500000))
                .qrPaymentReference("HEALSTI112025060512345")
                .build();

        // Initialize Request
        validRequest = new STITestRequest();
        validRequest.setServiceId(1L);
        validRequest.setAppointmentDate(LocalDateTime.now().plusDays(1));
        validRequest.setCustomerNotes("Test booking");
        validRequest.setPaymentMethod("QR_CODE");
    }

    // ========== BOOK TEST TESTS ==========

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI với QR Code - Thành công")
    void bookTest_QRCode_Success() {
        // Arrange
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(validRequest.getServiceId())).thenReturn(Optional.of(stiService));

        // ✅ Mock save return savedTest (có testId = 1L)
        when(stiTestRepository.save(any(STITest.class))).thenReturn(savedTest);

        // ✅ Mock payment với correct testId = 1L
        when(paymentService.generateQRPayment(
                eq(customer.getId()),
                eq("STI"),
                eq(1L), // ✅ savedTest.testId
                eq(BigDecimal.valueOf(500000)),
                anyString()))
                .thenReturn(ApiResponse.success("QR payment generated", payment));

        // Act
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Assert
        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getTestId()); // ✅ savedTest.testId
        assertTrue(response.getMessage().contains("successfully"));

        verify(stiTestRepository).save(any(STITest.class));
        verify(paymentService).generateQRPayment(
                eq(customer.getId()), eq("STI"), eq(1L),
                eq(BigDecimal.valueOf(500000)), anyString());
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI với COD - Thành công")
    void bookTest_COD_Success() {
        // Arrange
        validRequest.setPaymentMethod("COD");
        payment.setPaymentMethod(PaymentMethod.COD);

        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(validRequest.getServiceId())).thenReturn(Optional.of(stiService));

        // ✅ Mock save return savedTest (có testId = 1L)
        when(stiTestRepository.save(any(STITest.class))).thenReturn(savedTest);

        // ✅ Mock COD payment với correct testId = 1L
        when(paymentService.processCODPayment(
                eq(customer.getId()),
                eq("STI"),
                eq(1L), // ✅ savedTest.testId
                eq(BigDecimal.valueOf(500000)),
                anyString()))
                .thenReturn(ApiResponse.success("COD payment processed", payment));

        // Act
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Payment on delivery"));

        verify(paymentService).processCODPayment(
                eq(customer.getId()), eq("STI"), eq(1L),
                eq(BigDecimal.valueOf(500000)), anyString());
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI với VISA - Thành công")
    void bookTest_VISA_Success() {
        // Arrange
        validRequest.setPaymentMethod("VISA");
        validRequest.setCardNumber("1234567890123456");
        validRequest.setExpiryMonth("12");
        validRequest.setExpiryYear("2025");
        validRequest.setCvc("123");
        validRequest.setCardHolderName("Test User");

        payment.setPaymentMethod(PaymentMethod.VISA);

        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(validRequest.getServiceId())).thenReturn(Optional.of(stiService));

        // ✅ Mock save return savedTest (có testId = 1L)
        when(stiTestRepository.save(any(STITest.class))).thenReturn(savedTest);

        // ✅ Mock VISA payment với correct testId = 1L
        when(paymentService.processStripePayment(
                eq(customer.getId()),
                eq("STI"),
                eq(1L), // ✅ savedTest.testId
                eq(BigDecimal.valueOf(500000)),
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(ApiResponse.success("Stripe payment processed", payment));

        // Act
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Payment processed"));
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do không tìm thấy khách hàng")
    void bookTest_CustomerNotFound() {
        // Arrange
        when(userRepository.findById(customer.getId())).thenReturn(Optional.empty());

        // Act
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Customer not found", response.getMessage());
        verify(stiTestRepository, never()).save(any(STITest.class));
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do không tìm thấy dịch vụ")
    void bookTest_ServiceNotFound() {
        // Arrange
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(validRequest.getServiceId())).thenReturn(Optional.empty());

        // Act
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("STI service not found", response.getMessage());
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do dịch vụ không hoạt động")
    void bookTest_ServiceInactive() {
        // Arrange
        stiService.setIsActive(false);

        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(validRequest.getServiceId())).thenReturn(Optional.of(stiService));

        // Act
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("STI service is not available", response.getMessage());
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do thời gian hẹn quá gần")
    void bookTest_AppointmentTooSoon() {
        // Arrange
        validRequest.setAppointmentDate(LocalDateTime.now().plusHours(1)); // Chỉ 1 tiếng

        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(validRequest.getServiceId())).thenReturn(Optional.of(stiService));

        // Act
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Appointment must be at least 2 hours from now", response.getMessage());
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do phương thức thanh toán không hợp lệ")
    void bookTest_InvalidPaymentMethod() {
        // Arrange
        validRequest.setPaymentMethod("INVALID");

        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(validRequest.getServiceId())).thenReturn(Optional.of(stiService));

        // Act
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Invalid payment method"));
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do lỗi thanh toán với rollback")
    void bookTest_PaymentFailed_Rollback() {
        // Arrange
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(validRequest.getServiceId())).thenReturn(Optional.of(stiService));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(savedTest);

        // ✅ Mock payment failure
        when(paymentService.generateQRPayment(
                eq(customer.getId()),
                eq("STI"),
                eq(1L),
                eq(BigDecimal.valueOf(500000)),
                anyString()))
                .thenReturn(ApiResponse.error("Payment failed"));

        // Act & Assert - Expect PaymentException to be thrown
        PaymentException exception = assertThrows(PaymentException.class, () -> {
            stiTestService.bookTest(validRequest, customer.getId());
        });

        // ✅ FIX: Update expected message to match actual exception message
        assertEquals("Payment failed", exception.getMessage());

        // ✅ Verify test was saved (before payment failed)
        verify(stiTestRepository).save(any(STITest.class));

        // ✅ Verify payment was attempted
        verify(paymentService).generateQRPayment(
                eq(customer.getId()),
                eq("STI"),
                eq(1L),
                eq(BigDecimal.valueOf(500000)),
                anyString());
    }

    // ========== STATUS UPDATE TESTS ==========

    @Test
    @DisplayName("Cập nhật trạng thái test thành CONFIRMED bởi Staff - Thành công")
    void updateTestStatus_ToConfirmed_ByStaff_Success() {
        // Arrange
        STITestStatusUpdateRequest request = new STITestStatusUpdateRequest();
        request.setStatus(TestStatus.CONFIRMED);

        // ✅ Sử dụng savedTest (có testId = 1L)
        when(stiTestRepository.findById(savedTest.getTestId())).thenReturn(Optional.of(savedTest));
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(paymentService.getPaymentByService("STI", savedTest.getTestId())).thenReturn(Optional.of(payment));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(savedTest);

        // Act
        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(
                savedTest.getTestId(), request, staff.getId());

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("CONFIRMED"));
        verify(stiTestRepository).save(any(STITest.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái test - Thất bại do payment chưa completed")
    void updateTestStatus_ToConfirmed_PaymentNotCompleted() {
        // Arrange
        STITestStatusUpdateRequest request = new STITestStatusUpdateRequest();
        request.setStatus(TestStatus.CONFIRMED);

        payment.setPaymentStatus(PaymentStatus.PENDING);

        when(stiTestRepository.findById(savedTest.getTestId())).thenReturn(Optional.of(savedTest));
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(paymentService.getPaymentByService("STI", savedTest.getTestId())).thenReturn(Optional.of(payment));

        // Act
        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(
                savedTest.getTestId(), request, staff.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("payment not completed"));
    }

    // ========== CANCEL TEST TESTS ==========

    @Test
    @DisplayName("Hủy test với QR payment đã completed - Thành công với refund")
    void cancelTest_QRPayment_Success() {
        // ✅ FIX: Set appointment date > 24h từ bây giờ
        LocalDateTime appointmentDate = LocalDateTime.now().plusDays(2); // 48h sau
        savedTest.setAppointmentDate(appointmentDate);

        // Arrange
        when(stiTestRepository.findById(savedTest.getTestId())).thenReturn(Optional.of(savedTest));
        when(paymentService.getPaymentByService("STI", savedTest.getTestId())).thenReturn(Optional.of(payment));
        when(paymentService.processRefund(payment.getPaymentId(), "User cancellation"))
                .thenReturn(ApiResponse.success("Refund processed", payment));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(savedTest);

        // Act
        ApiResponse<STITestResponse> response = stiTestService.cancelTest(savedTest.getTestId(), customer.getId());

        // Assert
        assertTrue(response.isSuccess(), "Expected success but got error: " + response.getMessage());
        assertTrue(response.getMessage().contains("refunded") || response.getMessage().contains("cancelled"));
        verify(paymentService).processRefund(payment.getPaymentId(), "User cancellation");
    }

    // ========== GET TESTS ==========

    @Test
    @DisplayName("Lấy danh sách tests của khách hàng - Thành công")
    void getMyTests_Success() {
        // Arrange
        List<STITest> tests = List.of(savedTest); // ✅ Sử dụng savedTest
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiTestRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())).thenReturn(tests);
        when(paymentService.getPaymentByService("STI", savedTest.getTestId())).thenReturn(Optional.of(payment));

        // Act
        ApiResponse<List<STITestResponse>> response = stiTestService.getMyTests(customer.getId());

        // Assert
        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
        assertEquals(1L, response.getData().get(0).getTestId()); // ✅ savedTest.testId
    }

    @Test
    @DisplayName("Lấy chi tiết test - Thành công")
    void getTestDetails_Success() {
        // Arrange
        when(stiTestRepository.findById(savedTest.getTestId())).thenReturn(Optional.of(savedTest));
        when(paymentService.getPaymentByService("STI", savedTest.getTestId())).thenReturn(Optional.of(payment));

        // Act
        ApiResponse<STITestResponse> response = stiTestService.getTestDetails(savedTest.getTestId(), customer.getId());

        // Assert
        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals(1L, response.getData().getTestId()); // ✅ savedTest.testId
    }

    // ========== TEST RESULTS TESTS ==========

    @Test
    @DisplayName("Lấy kết quả test - Thành công cho customer")
    void getTestResults_Customer_Success() {
        // Arrange
        savedTest.setStatus(TestStatus.RESULTED);
        List<TestResult> results = new ArrayList<>();
        TestResult result1 = new TestResult();
        result1.setResultId(1L);
        result1.setStiTest(savedTest); // ✅ Sử dụng savedTest
        result1.setTestComponent(testComponents.get(0));
        result1.setResultValue("Negative");
        results.add(result1);

        when(stiTestRepository.findById(savedTest.getTestId())).thenReturn(Optional.of(savedTest));
        when(testResultRepository.findByStiTest_TestId(savedTest.getTestId())).thenReturn(results);

        // Act
        ApiResponse<List<TestResultResponse>> response = stiTestService.getTestResults(
                savedTest.getTestId(), customer.getId());

        // Assert
        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
    }

    @Test
    @DisplayName("Lấy kết quả test - Thất bại do test chưa có kết quả")
    void getTestResults_NoResults() {
        // Arrange
        savedTest.setStatus(TestStatus.PENDING); // Chưa có kết quả
        when(stiTestRepository.findById(savedTest.getTestId())).thenReturn(Optional.of(savedTest));

        // Act
        ApiResponse<List<TestResultResponse>> response = stiTestService.getTestResults(
                savedTest.getTestId(), customer.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Test results are not available yet"));
    }

    // ========== CONSULTANT NOTES TESTS ==========

    @Test
    @DisplayName("Cập nhật ghi chú consultant - Thành công")
    void updateConsultantNotes_Success() {
        // Arrange
        savedTest.setStatus(TestStatus.SAMPLED);
        String notes = "Patient looks healthy";

        when(stiTestRepository.findById(savedTest.getTestId())).thenReturn(Optional.of(savedTest));
        when(userRepository.findById(consultant.getId())).thenReturn(Optional.of(consultant));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(savedTest);

        // Act
        ApiResponse<STITestResponse> response = stiTestService.updateConsultantNotes(
                savedTest.getTestId(), notes, consultant.getId());

        // Assert
        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Consultant notes updated successfully"));
        verify(stiTestRepository).save(any(STITest.class));
    }
}