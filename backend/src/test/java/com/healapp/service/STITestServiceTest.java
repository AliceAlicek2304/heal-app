package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.STITestRequest;
import com.healapp.dto.STITestResponse;
import com.healapp.dto.STITestStatusUpdateRequest;
import com.healapp.dto.TestResultRequest;
import com.healapp.dto.TestResultResponse;
import com.healapp.model.STIService;
import com.healapp.model.STITest;
import com.healapp.model.ServiceTestComponent;
import com.healapp.model.TestResult;
import com.healapp.model.UserDtls;
import com.healapp.model.PaymentMethod;
import com.healapp.model.TestStatus;
import com.healapp.repository.STIServiceRepository;
import com.healapp.repository.STITestRepository;
import com.healapp.repository.ServiceTestComponentRepository;
import com.healapp.repository.TestResultRepository;
import com.healapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.BeanUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Kiểm thử dịch vụ quản lý STI Test")
public class STITestServiceTest {

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

    @InjectMocks
    private STITestService stiTestService;

    private UserDtls customer;
    private UserDtls staff;
    private UserDtls consultant;
    private UserDtls admin;
    private STIService stiService;
    private STITest stiTest;
    private STITestRequest validRequest;
    private ServiceTestComponent testComponent1;
    private ServiceTestComponent testComponent2;
    private TestResult testResult;
    private STITestStatusUpdateRequest statusUpdateRequest;

    @BeforeEach
    void setUp() {
        // Khởi tạo customer
        customer = new UserDtls();
        customer.setId(1L);
        customer.setUsername("customer");
        customer.setFullName("Khách hàng");
        customer.setEmail("customer@example.com");
        customer.setPhone("0912345678");
        customer.setRole("USER");

        // Khởi tạo staff
        staff = new UserDtls();
        staff.setId(2L);
        staff.setUsername("staff");
        staff.setFullName("Nhân viên");
        staff.setRole("STAFF");

        // Khởi tạo consultant
        consultant = new UserDtls();
        consultant.setId(3L);
        consultant.setUsername("consultant");
        consultant.setFullName("Bác sĩ tư vấn");
        consultant.setRole("CONSULTANT");

        // Khởi tạo admin
        admin = new UserDtls();
        admin.setId(4L);
        admin.setUsername("admin");
        admin.setFullName("Quản trị viên");
        admin.setRole("ADMIN");

        // Khởi tạo các thành phần xét nghiệm
        testComponent1 = new ServiceTestComponent();
        testComponent1.setComponentId(1L);
        testComponent1.setTestName("Xét nghiệm HIV");
        testComponent1.setReferenceRange("Âm tính");

        testComponent2 = new ServiceTestComponent();
        testComponent2.setComponentId(2L);
        testComponent2.setTestName("Xét nghiệm viêm gan B");
        testComponent2.setReferenceRange("Âm tính");

        List<ServiceTestComponent> components = new ArrayList<>();
        components.add(testComponent1);
        components.add(testComponent2);

        // Khởi tạo dịch vụ STI
        stiService = new STIService();
        stiService.setServiceId(1L);
        stiService.setName("Gói xét nghiệm STI toàn diện");
        stiService.setDescription("Gói kiểm tra các bệnh lây qua đường tình dục");
        stiService.setPrice(500000.0);
        stiService.setIsActive(true);
        stiService.setTestComponents(components);

        // Khởi tạo STI Test
        stiTest = new STITest();
        stiTest.setTestId(1L);
        stiTest.setCustomer(customer);
        stiTest.setStiService(stiService);
        stiTest.setAppointmentDate(LocalDateTime.now().plusDays(2));
        stiTest.setPaymentMethod(PaymentMethod.COD);
        stiTest.setTotalPrice(stiService.getPrice());
        stiTest.setStatus(TestStatus.PENDING);
        stiTest.setCreatedAt(LocalDateTime.now().minusDays(1));
        stiTest.setUpdatedAt(LocalDateTime.now());

        // Khởi tạo test result
        testResult = new TestResult();
        testResult.setResultId(1L);
        testResult.setStiTest(stiTest);
        testResult.setTestComponent(testComponent1);
        testResult.setResultValue("Negative");
        testResult.setNormalRange("Negative");
        testResult.setUnit("");
        testResult.setReviewedBy(consultant.getId());
        testResult.setReviewedAt(LocalDateTime.now());

        // Khởi tạo request hợp lệ
        validRequest = new STITestRequest();
        validRequest.setServiceId(stiService.getServiceId());
        validRequest.setAppointmentDate(LocalDateTime.now().plusDays(2));
        validRequest.setPaymentMethod("COD");
        validRequest.setCustomerNotes("Ghi chú khách hàng");

        // Khởi tạo request cập nhật trạng thái
        statusUpdateRequest = new STITestStatusUpdateRequest();
        statusUpdateRequest.setStatus(TestStatus.CONFIRMED);

        List<TestResultRequest> resultRequests = new ArrayList<>();
        TestResultRequest resultRequest = new TestResultRequest();
        resultRequest.setComponentId(testComponent1.getComponentId());
        resultRequest.setResultValue("Negative");
        resultRequest.setNormalRange("Negative");
        resultRequest.setUnit("");
        resultRequests.add(resultRequest);

        statusUpdateRequest.setResults(resultRequests);
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI thanh toán COD - Thành công")
    void bookTest_CodPayment_Success() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(stiService.getServiceId())).thenReturn(Optional.of(stiService));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(stiTest);

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI test scheduled successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(stiTest.getTestId(), response.getData().getTestId());
        verify(stiTestRepository, times(1)).save(any(STITest.class));
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do không tìm thấy khách hàng")
    void bookTest_CustomerNotFound() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, 999L);

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Customer not found", response.getMessage());
        verify(stiTestRepository, never()).save(any(STITest.class));
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do không tìm thấy dịch vụ")
    void bookTest_ServiceNotFound() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("STI service not found", response.getMessage());
        verify(stiTestRepository, never()).save(any(STITest.class));
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do dịch vụ không hoạt động")
    void bookTest_ServiceInactive() {
        // Chuẩn bị dữ liệu
        STIService inactiveService = new STIService();
        inactiveService.setServiceId(2L);
        inactiveService.setName("Dịch vụ không hoạt động");
        inactiveService.setIsActive(false);

        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(anyLong())).thenReturn(Optional.of(inactiveService));

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("STI service is not available", response.getMessage());
        verify(stiTestRepository, never()).save(any(STITest.class));
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI - Thất bại do thời gian hẹn không hợp lệ")
    void bookTest_InvalidAppointmentTime() {
        // Chuẩn bị dữ liệu
        validRequest.setAppointmentDate(LocalDateTime.now().plusHours(1)); // Chỉ 1 giờ từ hiện tại

        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(stiService.getServiceId())).thenReturn(Optional.of(stiService));

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Appointment must be at least 2 hours from now", response.getMessage());
        verify(stiTestRepository, never()).save(any(STITest.class));
    }

    @Test
    @DisplayName("Đặt lịch xét nghiệm STI thanh toán VISA - Thành công")
    void bookTest_VisaPayment_Success() {
        // Chuẩn bị dữ liệu
        validRequest.setPaymentMethod("VISA");
        validRequest.setCardNumber("4242424242424242");
        validRequest.setExpiryMonth("12");
        validRequest.setExpiryYear("2030");
        validRequest.setCvc("123");
        validRequest.setCardHolderName("Khách hàng");

        stiTest.setPaymentMethod(PaymentMethod.VISA);
        stiTest.setStatus(TestStatus.PAYMENT_PENDING);
        STITest savedTest = new STITest();
        BeanUtils.copyProperties(stiTest, savedTest);
        savedTest.setStatus(TestStatus.PENDING);
        savedTest.setPaymentDate(LocalDateTime.now());
        savedTest.setStripePaymentId("pm_123456789");

        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiServiceRepository.findById(stiService.getServiceId())).thenReturn(Optional.of(stiService));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(stiTest).thenReturn(savedTest);
        when(stripeService.processPaymentForSTITest(
                any(STITest.class), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(ApiResponse.success("Payment processed successfully", "pm_123456789"));

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.bookTest(validRequest, customer.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI test scheduled and payment processed successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals("pm_123456789", response.getData().getStripePaymentId());
        verify(stiTestRepository, times(2)).save(any(STITest.class));
        verify(stripeService, times(1)).processPaymentForSTITest(
                any(STITest.class), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Lấy danh sách xét nghiệm đang chờ - Thành công")
    void getPendingTests_Success() {
        // Chuẩn bị dữ liệu
        List<STITest> pendingTests = Arrays.asList(stiTest);
        when(stiTestRepository.findByStatus(TestStatus.PENDING)).thenReturn(pendingTests);

        // Thực hiện hành động
        ApiResponse<List<STITestResponse>> response = stiTestService.getPendingTests();

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("Retrieved 1 pending STI tests", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
        assertEquals(stiTest.getTestId(), response.getData().get(0).getTestId());
    }

    @Test
    @DisplayName("Lấy danh sách xét nghiệm đã xác nhận - Thành công")
    void getConfirmedTests_Success() {
        // Chuẩn bị dữ liệu
        stiTest.setStatus(TestStatus.CONFIRMED);
        stiTest.setStaff(staff);
        List<STITest> confirmedTests = Arrays.asList(stiTest);
        when(stiTestRepository.findByStatus(TestStatus.CONFIRMED)).thenReturn(confirmedTests);

        // Thực hiện hành động
        ApiResponse<List<STITestResponse>> response = stiTestService.getConfirmedTests();

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("Retrieved 1 confirmed STI tests", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
        assertEquals(stiTest.getTestId(), response.getData().get(0).getTestId());
        assertEquals(staff.getId(), response.getData().get(0).getStaffId());
    }

    @Test
    @DisplayName("Lấy danh sách xét nghiệm của bác sĩ tư vấn - Thành công")
    void getConsultantTests_Success() {
        // Chuẩn bị dữ liệu
        stiTest.setConsultant(consultant);
        List<STITest> consultantTests = Arrays.asList(stiTest);
        when(userRepository.findById(consultant.getId())).thenReturn(Optional.of(consultant));
        when(stiTestRepository.findByConsultantId(consultant.getId())).thenReturn(consultantTests);

        // Thực hiện hành động
        ApiResponse<List<STITestResponse>> response = stiTestService.getConsultantTests(consultant.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("Retrieved 1 tests for consultant", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
    }

    @Test
    @DisplayName("Lấy danh sách xét nghiệm của bác sĩ - Thất bại do không tìm thấy bác sĩ")
    void getConsultantTests_ConsultantNotFound() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Thực hiện hành động
        ApiResponse<List<STITestResponse>> response = stiTestService.getConsultantTests(999L);

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Consultant not found", response.getMessage());
    }

    @Test
    @DisplayName("Cập nhật trạng thái xét nghiệm thành CONFIRMED - Thành công")
    void updateTestStatus_ToConfirmed_Success() {
        // Chuẩn bị dữ liệu
        statusUpdateRequest.setStatus(TestStatus.CONFIRMED);

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(stiTest);

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(
                stiTest.getTestId(), statusUpdateRequest, staff.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI test status updated to CONFIRMED", response.getMessage());
        verify(stiTestRepository, times(1)).save(any(STITest.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái xét nghiệm thành SAMPLED - Thành công")
    void updateTestStatus_ToSampled_Success() {
        // Chuẩn bị dữ liệu
        stiTest.setStatus(TestStatus.CONFIRMED);
        statusUpdateRequest.setStatus(TestStatus.SAMPLED);

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));
        when(userRepository.findById(consultant.getId())).thenReturn(Optional.of(consultant));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(stiTest);

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(
                stiTest.getTestId(), statusUpdateRequest, consultant.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI test status updated to SAMPLED", response.getMessage());
        verify(stiTestRepository, times(1)).save(any(STITest.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái xét nghiệm thành RESULTED - Thành công")
    void updateTestStatus_ToResulted_Success() {
        // Chuẩn bị dữ liệu
        stiTest.setStatus(TestStatus.SAMPLED);
        statusUpdateRequest.setStatus(TestStatus.RESULTED);

        // Tạo đủ kết quả cho tất cả component (2 components)
        List<TestResultRequest> resultRequests = new ArrayList<>();

        // Kết quả cho component 1
        TestResultRequest resultRequest1 = new TestResultRequest();
        resultRequest1.setComponentId(testComponent1.getComponentId());
        resultRequest1.setResultValue("Negative");
        resultRequest1.setNormalRange("Negative");
        resultRequest1.setUnit("");
        resultRequests.add(resultRequest1);

        // Kết quả cho component 2
        TestResultRequest resultRequest2 = new TestResultRequest();
        resultRequest2.setComponentId(testComponent2.getComponentId());
        resultRequest2.setResultValue("Negative");
        resultRequest2.setNormalRange("Negative");
        resultRequest2.setUnit("");
        resultRequests.add(resultRequest2);

        // Cập nhật request để có đủ kết quả
        statusUpdateRequest.setResults(resultRequests);

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));
        when(userRepository.findById(consultant.getId())).thenReturn(Optional.of(consultant));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(stiTest);

        // Mock để tìm thấy cả hai component
        when(testComponentRepository.findById(testComponent1.getComponentId())).thenReturn(Optional.of(testComponent1));
        when(testComponentRepository.findById(testComponent2.getComponentId())).thenReturn(Optional.of(testComponent2));

        // Mock để lưu kết quả test
        when(testResultRepository.save(any(TestResult.class))).thenReturn(testResult);

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(
                stiTest.getTestId(), statusUpdateRequest, consultant.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI test status updated to RESULTED", response.getMessage());
        verify(stiTestRepository, times(1)).save(any(STITest.class));
        // Phải gọi save 2 lần vì có 2 kết quả
        verify(testResultRepository, times(2)).save(any(TestResult.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái xét nghiệm - Thất bại do không tìm thấy xét nghiệm")
    void updateTestStatus_TestNotFound() {
        // Chuẩn bị dữ liệu
        when(stiTestRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(
                999L, statusUpdateRequest, staff.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("STI test not found", response.getMessage());
        verify(stiTestRepository, never()).save(any(STITest.class));
    }

    @Test
    @DisplayName("Lấy danh sách xét nghiệm của khách hàng - Thành công")
    void getMyTests_Success() {
        // Chuẩn bị dữ liệu
        List<STITest> customerTests = Arrays.asList(stiTest);
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stiTestRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())).thenReturn(customerTests);

        // Thực hiện hành động
        ApiResponse<List<STITestResponse>> response = stiTestService.getMyTests(customer.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI tests retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
    }

    @Test
    @DisplayName("Cập nhật trạng thái xét nghiệm thành RESULTED - Thất bại do thiếu kết quả")
    void updateTestStatus_ToResulted_MissingComponents() {
        // Chuẩn bị dữ liệu
        stiTest.setStatus(TestStatus.SAMPLED);
        statusUpdateRequest.setStatus(TestStatus.RESULTED);

        // Chỉ có kết quả cho 1 component, trong khi service có 2 component
        List<TestResultRequest> resultRequests = new ArrayList<>();
        TestResultRequest resultRequest = new TestResultRequest();
        resultRequest.setComponentId(testComponent1.getComponentId());
        resultRequest.setResultValue("Negative");
        resultRequest.setNormalRange("Negative");
        resultRequest.setUnit("");
        resultRequests.add(resultRequest);

        statusUpdateRequest.setResults(resultRequests);

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));
        when(userRepository.findById(consultant.getId())).thenReturn(Optional.of(consultant));

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(
                stiTest.getTestId(), statusUpdateRequest, consultant.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Missing test results for components"));
        verify(stiTestRepository, never()).save(any(STITest.class));
        verify(testResultRepository, never()).save(any(TestResult.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái xét nghiệm thành RESULTED - Thất bại do component ID không hợp lệ")
    void updateTestStatus_ToResulted_InvalidComponentId() {
        // Chuẩn bị dữ liệu
        stiTest.setStatus(TestStatus.SAMPLED);
        statusUpdateRequest.setStatus(TestStatus.RESULTED);

        // Tạo đủ kết quả nhưng một trong số đó có ID không hợp lệ
        List<TestResultRequest> resultRequests = new ArrayList<>();

        // Kết quả cho component 1 - OK
        TestResultRequest resultRequest1 = new TestResultRequest();
        resultRequest1.setComponentId(testComponent1.getComponentId());
        resultRequest1.setResultValue("Negative");
        resultRequest1.setNormalRange("Negative");
        resultRequest1.setUnit("");
        resultRequests.add(resultRequest1);

        // Kết quả với component ID không tồn tại trong service
        TestResultRequest resultRequest2 = new TestResultRequest();
        resultRequest2.setComponentId(999L); // ID không tồn tại
        resultRequest2.setResultValue("Negative");
        resultRequest2.setNormalRange("Negative");
        resultRequest2.setUnit("");
        resultRequests.add(resultRequest2);

        statusUpdateRequest.setResults(resultRequests);

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));
        when(userRepository.findById(consultant.getId())).thenReturn(Optional.of(consultant));

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(
                stiTest.getTestId(), statusUpdateRequest, consultant.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("does not belong to this service"));
        verify(stiTestRepository, never()).save(any(STITest.class));
    }

    @Test
    @DisplayName("Lấy chi tiết xét nghiệm - Thành công")
    void getTestDetails_Success() {
        // Chuẩn bị dữ liệu
        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.getTestDetails(
                stiTest.getTestId(), customer.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI test details retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(stiTest.getTestId(), response.getData().getTestId());
    }

    @Test
    @DisplayName("Lấy chi tiết xét nghiệm - Thất bại do truy cập trái phép")
    void getTestDetails_Unauthorized() {
        // Chuẩn bị dữ liệu
        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));

        // Thực hiện hành động - Người dùng khác thử truy cập
        ApiResponse<STITestResponse> response = stiTestService.getTestDetails(stiTest.getTestId(), 999L);

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("You can only view your own tests", response.getMessage());
    }

    @Test
    @DisplayName("Lấy kết quả xét nghiệm - Thành công")
    void getTestResults_Success() {
        // Chuẩn bị dữ liệu
        stiTest.setStatus(TestStatus.RESULTED);
        List<TestResult> results = Arrays.asList(testResult);

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));
        when(testResultRepository.findByStiTest_TestId(stiTest.getTestId())).thenReturn(results);
        when(userRepository.findById(consultant.getId())).thenReturn(Optional.of(consultant));

        // Cài đặt consultant cho test
        stiTest.setConsultant(consultant);

        // Thực hiện hành động
        ApiResponse<List<TestResultResponse>> response = stiTestService.getTestResults(
                stiTest.getTestId(), consultant.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("Retrieved 1 test results", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
    }

    @Test
    @DisplayName("Lấy kết quả xét nghiệm - Thất bại do chưa có kết quả")
    void getTestResults_ResultsNotAvailable() {
        // Chuẩn bị dữ liệu - Test vẫn ở trạng thái CONFIRMED
        stiTest.setStatus(TestStatus.CONFIRMED);
        stiTest.setConsultant(consultant);

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));

        // Thực hiện hành động
        ApiResponse<List<TestResultResponse>> response = stiTestService.getTestResults(
                stiTest.getTestId(), consultant.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Test results are not available yet", response.getMessage());
    }

    @Test
    @DisplayName("Hủy lịch xét nghiệm thanh toán COD - Thành công")
    void cancelTest_CodPayment_Success() {
        // Chuẩn bị dữ liệu
        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(stiTest);

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.cancelTest(
                stiTest.getTestId(), customer.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI test canceled successfully", response.getMessage());
        verify(stiTestRepository, times(1)).save(any(STITest.class));
    }

    @Test
    @DisplayName("Hủy lịch xét nghiệm thanh toán VISA - Thành công với hoàn tiền")
    void cancelTest_VisaPayment_Success() {
        // Chuẩn bị dữ liệu
        stiTest.setPaymentMethod(PaymentMethod.VISA);
        stiTest.setStripePaymentId("pm_123456789");

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));
        when(stiTestRepository.save(any(STITest.class))).thenReturn(stiTest);
        when(stripeService.processRefund(anyString())).thenReturn(
                ApiResponse.success("Refund processed successfully", "re_123456789"));

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.cancelTest(
                stiTest.getTestId(), customer.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI test canceled successfully and refund processed", response.getMessage());
        verify(stiTestRepository, times(1)).save(any(STITest.class));
        verify(stripeService, times(1)).processRefund(anyString());
    }

    @Test
    @DisplayName("Hủy lịch xét nghiệm - Thất bại do không đủ thời gian trước hẹn")
    void cancelTest_TooCloseToAppointment() {
        // Chuẩn bị dữ liệu - Chỉ còn 12 giờ trước hẹn
        stiTest.setAppointmentDate(LocalDateTime.now().plusHours(12));

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.cancelTest(
                stiTest.getTestId(), customer.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Cannot cancel test within 24 hours of appointment", response.getMessage());
        verify(stiTestRepository, never()).save(any(STITest.class));
    }

    @Test
    @DisplayName("Hủy lịch xét nghiệm - Thất bại do trạng thái không hợp lệ")
    void cancelTest_InvalidStatus() {
        // Chuẩn bị dữ liệu - Test đã ở trạng thái SAMPLED
        stiTest.setStatus(TestStatus.SAMPLED);

        when(stiTestRepository.findById(stiTest.getTestId())).thenReturn(Optional.of(stiTest));

        // Thực hiện hành động
        ApiResponse<STITestResponse> response = stiTestService.cancelTest(
                stiTest.getTestId(), customer.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Cannot cancel test in current status: SAMPLED", response.getMessage());
        verify(stiTestRepository, never()).save(any(STITest.class));
    }
}