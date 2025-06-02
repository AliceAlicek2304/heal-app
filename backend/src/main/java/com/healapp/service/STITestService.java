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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class STITestService {

    @Autowired
    private STITestRepository stiTestRepository;

    @Autowired
    private STIServiceRepository stiServiceRepository;

    @Autowired
    private ServiceTestComponentRepository testComponentRepository;

    @Autowired
    private TestResultRepository testResultRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StripeService stripeService;

    /**
     * Đặt lịch xét nghiệm STI (USER)
     */
    @Transactional
    public ApiResponse<STITestResponse> bookTest(STITestRequest request, Long customerId) {
        try {
            log.info("User {} booking STI test for service {}", customerId, request.getServiceId());

            // Kiểm tra customer
            Optional<UserDtls> customerOpt = userRepository.findById(customerId);
            if (customerOpt.isEmpty()) {
                return ApiResponse.error("Customer not found");
            }
            UserDtls customer = customerOpt.get();

            // Kiểm tra dịch vụ
            Optional<STIService> serviceOpt = stiServiceRepository.findById(request.getServiceId());
            if (serviceOpt.isEmpty()) {
                return ApiResponse.error("STI service not found");
            }
            STIService stiService = serviceOpt.get();

            if (!stiService.getIsActive()) {
                return ApiResponse.error("STI service is not available");
            }

            // Kiểm tra thời gian hẹn hợp lệ
            if (request.getAppointmentDate().isBefore(LocalDateTime.now().plusHours(2))) {
                return ApiResponse.error("Appointment must be at least 2 hours from now");
            }

            // Convert String to Enum
            PaymentMethod paymentMethod;
            try {
                paymentMethod = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ApiResponse.error("Invalid payment method: " + request.getPaymentMethod());
            }

            // Tạo STI Test
            STITest stiTest = new STITest();
            stiTest.setCustomer(customer);
            stiTest.setStiService(stiService);
            stiTest.setAppointmentDate(request.getAppointmentDate());
            stiTest.setPaymentMethod(paymentMethod);
            stiTest.setCustomerNotes(request.getCustomerNotes());
            stiTest.setTotalPrice(stiService.getPrice());
            stiTest.setStatus(TestStatus.PENDING);

            // Xử lý thanh toán
            if (PaymentMethod.VISA.equals(paymentMethod)) {
                // Xử lý thanh toán VISA thực tế qua Stripe
                return processVisaPayment(stiTest, request);
            } else {
                // COD - Lưu trực tiếp
                STITest savedTest = stiTestRepository.save(stiTest);

                log.info("STI test booked successfully with COD - Test ID: {}", savedTest.getTestId());

                STITestResponse response = convertToResponse(savedTest);
                return ApiResponse.success("STI test scheduled successfully", response);
            }

        } catch (Exception e) {
            log.error("Error booking STI test: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to book STI test: " + e.getMessage());
        }
    }

    /**
     * Xử lý thanh toán VISA thực tế qua Stripe
     */
    private ApiResponse<STITestResponse> processVisaPayment(STITest stiTest, STITestRequest request) {
        try {
            // Validate thông tin thẻ
            if (request.getCardNumber() == null || request.getExpiryMonth() == null ||
                    request.getExpiryYear() == null || request.getCvc() == null) {
                return ApiResponse.error("Credit card information is required for VISA payment");
            }

            // Validate card number format (basic)
            if (!request.getCardNumber().matches("\\d{16}")) {
                return ApiResponse.error("Invalid card number format");
            }

            // Validate expiry date
            try {
                int month = Integer.parseInt(request.getExpiryMonth());
                int year = Integer.parseInt(request.getExpiryYear());

                if (month < 1 || month > 12) {
                    return ApiResponse.error("Invalid expiry month");
                }

                if (year < LocalDateTime.now().getYear()) {
                    return ApiResponse.error("Card has expired");
                }
            } catch (NumberFormatException e) {
                return ApiResponse.error("Invalid expiry date format");
            }

            // Validate CVC
            if (!request.getCvc().matches("\\d{3,4}")) {
                return ApiResponse.error("Invalid CVC format");
            }

            // Lưu với trạng thái PAYMENT_PENDING
            stiTest.setStatus(TestStatus.PAYMENT_PENDING);
            STITest pendingTest = stiTestRepository.save(stiTest);

            // Xử lý thanh toán qua Stripe thực tế
            ApiResponse<String> paymentResponse = stripeService.processPaymentForSTITest(
                    pendingTest,
                    request.getCardNumber(),
                    request.getExpiryMonth(),
                    request.getExpiryYear(),
                    request.getCvc(),
                    request.getCardHolderName());

            if (paymentResponse.isSuccess()) {
                // Thanh toán thành công
                pendingTest.setStatus(TestStatus.PENDING);
                pendingTest.setPaymentDate(LocalDateTime.now());
                pendingTest.setStripePaymentId(paymentResponse.getData());

                STITest paidTest = stiTestRepository.save(pendingTest);

                log.info("STI test booked and paid successfully via Stripe - Test ID: {}, Payment ID: {}",
                        paidTest.getTestId(), paymentResponse.getData());

                STITestResponse response = convertToResponse(paidTest);
                return ApiResponse.success("STI test scheduled and payment processed successfully", response);

            } else {
                // Thanh toán thất bại
                pendingTest.setStatus(TestStatus.PAYMENT_FAILED);
                stiTestRepository.save(pendingTest);

                log.warn("STI test payment failed - Test ID: {}, Error: {}",
                        pendingTest.getTestId(), paymentResponse.getMessage());

                return ApiResponse.error("Payment failed: " + paymentResponse.getMessage());
            }

        } catch (Exception e) {
            log.error("Error processing VISA payment for STI test: {}", e.getMessage(), e);
            return ApiResponse.error("Payment processing failed: " + e.getMessage());
        }
    }

    public ApiResponse<List<STITestResponse>> getPendingTests() {
        try {
            List<STITest> pendingTests = stiTestRepository.findByStatus(TestStatus.PENDING);
            List<STITestResponse> responseList = pendingTests.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Retrieved " + responseList.size() + " pending STI tests", responseList);
        } catch (Exception e) {
            log.error("Error retrieving pending STI tests: {}", e.getMessage(), e);
            return ApiResponse.error("Error retrieving pending tests: " + e.getMessage());
        }
    }

    public ApiResponse<List<STITestResponse>> getConfirmedTests() {
        try {
            List<STITest> confirmedTests = stiTestRepository.findByStatus(TestStatus.CONFIRMED);
            List<STITestResponse> responseList = confirmedTests.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Retrieved " + responseList.size() + " confirmed STI tests", responseList);
        } catch (Exception e) {
            return ApiResponse.error("Error retrieving confirmed tests: " + e.getMessage());
        }
    }

    public ApiResponse<List<STITestResponse>> getStaffTests(Long staffId) {
        try {
            Optional<UserDtls> staffOpt = userRepository.findById(staffId);
            if (staffOpt.isEmpty()) {
                return ApiResponse.error("Staff not found");
            }

            UserDtls staff = staffOpt.get();
            // Cập nhật: Kiểm tra role thông qua Role entity
            String roleName = staff.getRole() != null ? staff.getRole().getRoleName() : null;
            if (!"STAFF".equals(roleName)) {
                return ApiResponse.error("User is not a staff");
            }

            List<STITest> staffTests = stiTestRepository.findByStaffId(staffId);
            List<STITestResponse> responseList = staffTests.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Retrieved " + responseList.size() + " tests for staff", responseList);
        } catch (Exception e) {
            return ApiResponse.error("Error retrieving staff tests: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<STITestResponse> updateTestStatus(Long testId, STITestStatusUpdateRequest request, Long userId) {
        try {
            log.info("Updating test {} to status {} by user {}", testId, request.getStatus(), userId);

            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("STI test not found");
            }

            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            STITest test = testOpt.get();

            // Cập nhật: Lấy role name từ Role entity
            String userRole = user.getRole() != null ? user.getRole().getRoleName() : null;
            log.info("Current test status: {}, User role: {}", test.getStatus(), userRole);

            if (!validateStatusTransition(test, request.getStatus(), userRole)) {
                return ApiResponse.error("Invalid status transition for your role");
            }

            // CONFIRMED status
            if (request.getStatus() == TestStatus.CONFIRMED &&
                    ("STAFF".equals(userRole) || "ADMIN".equals(userRole))) {
                test.setStatus(TestStatus.CONFIRMED);
                test.setStaff(user);
            }

            // SAMPLED status
            else if (request.getStatus() == TestStatus.SAMPLED &&
                    ("STAFF".equals(userRole) || "ADMIN".equals(userRole))) {
                test.setStatus(TestStatus.SAMPLED);
                // Nếu test chưa có consultant, gán STAFF làm consultant
                if (test.getConsultant() == null) {
                    test.setConsultant(user);
                }
            }

            // RESULTED status
            else if (request.getStatus() == TestStatus.RESULTED &&
                    ("STAFF".equals(userRole) || "ADMIN".equals(userRole))) {
                if (request.getResults() == null || request.getResults().isEmpty()) {
                    log.warn("No test results provided for test ID: {}", testId);
                    return ApiResponse.error("Test results are required for RESULTED status");
                }

                // Lấy tất cả components của service
                List<ServiceTestComponent> serviceComponents = test.getStiService().getTestComponents();

                // Lấy tất cả component IDs của service
                List<Long> serviceComponentIds = serviceComponents.stream()
                        .map(ServiceTestComponent::getComponentId)
                        .collect(Collectors.toList());

                log.info("Service {} has {} components", test.getStiService().getServiceId(),
                        serviceComponentIds.size());

                // Lấy tất cả component IDs trong request
                List<Long> requestComponentIds = request.getResults().stream()
                        .map(TestResultRequest::getComponentId)
                        .collect(Collectors.toList());

                log.info("Request contains results for {} components", requestComponentIds.size());

                // Kiểm tra số lượng component trong request có đúng bằng số component của
                // service không
                if (requestComponentIds.size() < serviceComponentIds.size()) {
                    // Tìm các component thiếu
                    List<Long> missingComponentIds = new ArrayList<>(serviceComponentIds);
                    missingComponentIds.removeAll(requestComponentIds);

                    // Lấy tên các component thiếu để hiển thị thông báo rõ ràng
                    List<String> missingComponentNames = new ArrayList<>();
                    for (Long missingId : missingComponentIds) {
                        for (ServiceTestComponent component : serviceComponents) {
                            if (component.getComponentId().equals(missingId)) {
                                missingComponentNames.add(component.getTestName());
                                break;
                            }
                        }
                    }

                    log.warn("Missing results for components: {} in test ID: {}", missingComponentNames, testId);
                    return ApiResponse
                            .error("Missing test results for components: " + String.join(", ", missingComponentNames) +
                                    ". Please provide results for all components in the service.");
                }

                // Kiểm tra tất cả các component ID trong request
                for (TestResultRequest resultReq : request.getResults()) {
                    if (resultReq.getComponentId() == null) {
                        log.warn("Component ID is null in result request for test ID: {}", testId);
                        return ApiResponse.error("Component ID cannot be null");
                    }

                    if (!serviceComponentIds.contains(resultReq.getComponentId())) {
                        log.warn("Component ID {} does not belong to service {} for test {}",
                                resultReq.getComponentId(), test.getStiService().getServiceId(), testId);
                        return ApiResponse.error("Component ID " + resultReq.getComponentId() +
                                " does not belong to this service");
                    }

                    if (resultReq.getResultValue() == null || resultReq.getResultValue().trim().isEmpty()) {
                        log.warn("Result value is empty for component ID: {}", resultReq.getComponentId());
                        return ApiResponse.error("Result value is required for component ID: " +
                                resultReq.getComponentId());
                    }
                }

                // Lưu kết quả xét nghiệm
                boolean allResultsSaved = saveTestResults(test, request.getResults(), userId);

                if (!allResultsSaved) {
                    log.warn("Some results failed to save for test ID: {}", testId);
                    return ApiResponse
                            .error("Some test results could not be saved. Please check component IDs and try again.");
                }

                // Cập nhật trạng thái
                test.setStatus(TestStatus.RESULTED);
                test.setResultDate(LocalDateTime.now());
            }

            // COMPLETED status
            else if (request.getStatus() == TestStatus.COMPLETED &&
                    ("STAFF".equals(userRole) || "ADMIN".equals(userRole))) {
                test.setStatus(TestStatus.COMPLETED);
            }

            log.info("Saving updated test with status: {}", test.getStatus());
            STITest updatedTest = stiTestRepository.save(test);
            stiTestRepository.flush(); // Đảm bảo lưu ngay lập tức vào DB

            log.info("Test saved with status: {}", updatedTest.getStatus());
            STITestResponse response = convertToResponse(updatedTest);
            log.info("Response created with status: {}", response.getStatus());

            return ApiResponse.success("STI test status updated to " + request.getStatus(), response);
        } catch (Exception e) {
            log.error("Error updating test status: {}", e.getMessage(), e);
            return ApiResponse.error("Error updating test status: " + e.getMessage());
        }
    }

    private boolean saveTestResults(STITest test, List<TestResultRequest> resultRequests, Long userId) {
        log.info("Saving {} test results for test ID: {}", resultRequests.size(), test.getTestId());

        // Lấy tất cả component IDs thuộc về service này
        List<Long> validComponentIds = test.getStiService().getTestComponents().stream()
                .map(ServiceTestComponent::getComponentId)
                .collect(Collectors.toList());

        log.info("Valid component IDs for service {}: {}",
                test.getStiService().getServiceId(), validComponentIds);

        // Kiểm tra đã nhập đủ kết quả cho tất cả components chưa
        if (resultRequests.size() < validComponentIds.size()) {
            log.error("Not enough results provided. Service has {} components but only {} results provided.",
                    validComponentIds.size(), resultRequests.size());
            return false;
        }

        boolean allResultsSaved = true;

        for (TestResultRequest resultReq : resultRequests) {
            try {
                // Kiểm tra component ID có thuộc về service này không
                if (!validComponentIds.contains(resultReq.getComponentId())) {
                    log.error("Component ID {} does not belong to service {} for test {}",
                            resultReq.getComponentId(), test.getStiService().getServiceId(), test.getTestId());
                    allResultsSaved = false;
                    continue;
                }

                Optional<ServiceTestComponent> componentOpt = testComponentRepository
                        .findById(resultReq.getComponentId());
                if (componentOpt.isEmpty()) {
                    log.error("Component ID {} not found in database", resultReq.getComponentId());
                    allResultsSaved = false;
                    continue;
                }

                TestResult testResult = new TestResult();
                testResult.setStiTest(test);
                testResult.setTestComponent(componentOpt.get());
                testResult.setResultValue(resultReq.getResultValue());
                testResult.setNormalRange(resultReq.getNormalRange());
                testResult.setUnit(resultReq.getUnit());
                testResult.setReviewedBy(userId);
                testResult.setReviewedAt(LocalDateTime.now());

                TestResult savedResult = testResultRepository.save(testResult);
                log.info("Saved test result ID {} for component: {}",
                        savedResult.getResultId(), componentOpt.get().getTestName());
            } catch (Exception e) {
                log.error("Error saving test result for component ID {}: {}",
                        resultReq.getComponentId(), e.getMessage(), e);
                allResultsSaved = false;
            }
        }

        return allResultsSaved;
    }

    private boolean validateStatusTransition(STITest test, TestStatus newStatus, String userRole) {
        TestStatus currentStatus = test.getStatus();

        // Kiểm tra role và luồng chuyển đổi trạng thái
        if ("STAFF".equals(userRole)) {
            // STAFF có thể thực hiện các chuyển đổi trạng thái sau:
            if (currentStatus == TestStatus.PENDING && newStatus == TestStatus.CONFIRMED)
                return true;
            if (currentStatus == TestStatus.CONFIRMED && newStatus == TestStatus.SAMPLED)
                return true;
            if (currentStatus == TestStatus.SAMPLED && newStatus == TestStatus.RESULTED)
                return true;
            if (currentStatus == TestStatus.RESULTED && newStatus == TestStatus.COMPLETED)
                return true;
        } else if ("ADMIN".equals(userRole)) {
            // ADMIN có thể thực hiện mọi chuyển đổi trạng thái
            return true;
        } else if ("CUSTOMER".equals(userRole) || "CONSULTANT".equals(userRole)) {
            // CUSTOMER và CONSULTANT chỉ có thể hủy lịch hẹn
            if (currentStatus == TestStatus.PENDING && newStatus == TestStatus.CANCELED)
                return true;
        }

        // Mặc định trả về false nếu không thỏa mãn các điều kiện trên
        return false;
    }

    /**
     * Lấy lịch sử xét nghiệm của user (USER)
     */
    public ApiResponse<List<STITestResponse>> getMyTests(Long customerId) {
        try {
            // Kiểm tra customer
            Optional<UserDtls> customerOpt = userRepository.findById(customerId);
            if (customerOpt.isEmpty()) {
                return ApiResponse.error("Customer not found");
            }

            List<STITest> tests = stiTestRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
            List<STITestResponse> responses = tests.stream()
                    .map(this::convertToResponse)
                    .toList();

            return ApiResponse.success("STI tests retrieved successfully", responses);

        } catch (Exception e) {
            log.error("Error retrieving STI tests for customer {}: {}", customerId, e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve STI tests: " + e.getMessage());
        }
    }

    /**
     * Lấy chi tiết test (USER xem của mình)
     */
    public ApiResponse<STITestResponse> getTestDetails(Long testId, Long userId) {
        try {
            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("STI test not found");
            }

            STITest stiTest = testOpt.get();

            // Kiểm tra quyền truy cập
            if (!stiTest.getCustomer().getId().equals(userId)) {
                return ApiResponse.error("You can only view your own tests");
            }

            STITestResponse response = convertToResponse(stiTest);
            return ApiResponse.success("STI test details retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving STI test details: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve STI test details: " + e.getMessage());
        }
    }

    public ApiResponse<List<TestResultResponse>> getTestResults(Long testId, Long userId) {
        try {
            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("STI test not found");
            }

            STITest stiTest = testOpt.get();

            // Validate access
            boolean hasAccess = false;

            // Người dùng xem kết quả của chính mình
            if (stiTest.getCustomer().getId().equals(userId)) {
                hasAccess = true;
            }

            // Consultant được assign cho test này
            else if (stiTest.getConsultant() != null && stiTest.getConsultant().getId().equals(userId)) {
                hasAccess = true;
            }

            // Staff hoặc admin
            else {
                Optional<UserDtls> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    // Cập nhật: Kiểm tra role thông qua Role entity
                    String userRole = userOpt.get().getRole() != null ? userOpt.get().getRole().getRoleName() : null;
                    if ("STAFF".equals(userRole) || "ADMIN".equals(userRole)) {
                        hasAccess = true;
                    }
                }
            }

            if (!hasAccess) {
                return ApiResponse.error("You don't have permission to view these test results");
            }

            // Kiểm tra test đã có kết quả chưa
            if (stiTest.getStatus() != TestStatus.RESULTED && stiTest.getStatus() != TestStatus.COMPLETED) {
                return ApiResponse.error("Test results are not available yet");
            }

            List<TestResult> results = testResultRepository.findByStiTest_TestId(testId);
            List<TestResultResponse> responseList = results.stream()
                    .map(this::convertToTestResultResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Retrieved " + responseList.size() + " test results", responseList);
        } catch (Exception e) {
            log.error("Error retrieving test results: {}", e.getMessage(), e);
            return ApiResponse.error("Error retrieving test results: " + e.getMessage());
        }
    }

    /**
     * Hủy lịch xét nghiệm (USER) - Với hoàn tiền Stripe
     */
    @Transactional
    public ApiResponse<STITestResponse> cancelTest(Long testId, Long userId) {
        try {
            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("STI test not found");
            }

            STITest stiTest = testOpt.get();

            // Kiểm tra quyền hủy
            if (!stiTest.getCustomer().getId().equals(userId)) {
                return ApiResponse.error("You can only cancel your own tests");
            }

            // Kiểm tra trạng thái có thể hủy
            if (!TestStatus.PENDING.equals(stiTest.getStatus()) &&
                    !TestStatus.CONFIRMED.equals(stiTest.getStatus())) {
                return ApiResponse.error("Cannot cancel test in current status: " + stiTest.getStatus());
            }

            // Kiểm tra thời gian hủy (ít nhất 24h trước)
            if (stiTest.getAppointmentDate().isBefore(LocalDateTime.now().plusHours(24))) {
                return ApiResponse.error("Cannot cancel test within 24 hours of appointment");
            }

            // Xử lý hoàn tiền nếu đã thanh toán qua VISA
            if (PaymentMethod.VISA.equals(stiTest.getPaymentMethod()) &&
                    stiTest.getStripePaymentId() != null) {

                log.info("Processing refund for STI test - Test ID: {}, Payment ID: {}",
                        testId, stiTest.getStripePaymentId());

                ApiResponse<String> refundResponse = stripeService.processRefund(stiTest.getStripePaymentId());

                if (!refundResponse.isSuccess()) {
                    log.error("Refund failed for STI test - Test ID: {}, Error: {}",
                            testId, refundResponse.getMessage());
                    return ApiResponse.error("Failed to process refund: " + refundResponse.getMessage());
                }

                log.info("Refund processed successfully for STI test - Test ID: {}, Refund ID: {}",
                        testId, refundResponse.getData());
            }

            // Cập nhật trạng thái
            stiTest.setStatus(TestStatus.CANCELED);
            STITest canceledTest = stiTestRepository.save(stiTest);

            log.info("STI test canceled by user {} - Test ID: {}", userId, testId);

            STITestResponse response = convertToResponse(canceledTest);
            return ApiResponse.success("STI test canceled successfully" +
                    (PaymentMethod.VISA.equals(stiTest.getPaymentMethod()) ? " and refund processed" : ""),
                    response);

        } catch (Exception e) {
            log.error("Error canceling STI test: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to cancel STI test: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<STITestResponse> updateConsultantNotes(Long testId, String consultantNotes, Long consultantId) {
        try {
            log.info("Consultant {} updating notes for STI test {}", consultantId, testId);

            // Kiểm tra STI test có tồn tại không
            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("STI test not found");
            }

            STITest stiTest = testOpt.get();

            // Kiểm tra consultant có tồn tại và có đúng role không
            Optional<UserDtls> consultantOpt = userRepository.findById(consultantId);
            if (consultantOpt.isEmpty()) {
                return ApiResponse.error("Consultant not found");
            }

            UserDtls consultant = consultantOpt.get();
            // Cập nhật: Kiểm tra role thông qua Role entity
            String roleName = consultant.getRole() != null ? consultant.getRole().getRoleName() : null;
            if (!"CONSULTANT".equals(roleName)) {
                return ApiResponse.error("User is not a consultant");
            }

            // Kiểm tra trạng thái test có cho phép cập nhật notes không
            if (stiTest.getStatus() != TestStatus.SAMPLED &&
                    stiTest.getStatus() != TestStatus.RESULTED &&
                    stiTest.getStatus() != TestStatus.COMPLETED) {
                return ApiResponse.error(
                        "Consultant notes can only be updated for tests in SAMPLED, RESULTED, or COMPLETED status");
            }

            if (stiTest.getConsultant() == null) {
                log.info("Assigning consultant {} to test {}", consultantId, testId);
                stiTest.setConsultant(consultant);
            }

            // Cập nhật consultant notes
            stiTest.setConsultantNotes(consultantNotes);
            stiTest.setUpdatedAt(LocalDateTime.now());

            STITest updatedTest = stiTestRepository.save(stiTest);

            log.info("Consultant notes updated successfully for test ID: {} by consultant: {}", testId, consultantId);

            STITestResponse response = convertToResponse(updatedTest);
            return ApiResponse.success("Consultant notes updated successfully", response);

        } catch (Exception e) {
            log.error("Error updating consultant notes for test {}: {}", testId, e.getMessage(), e);
            return ApiResponse.error("Failed to update consultant notes: " + e.getMessage());
        }
    }

    /**
     * Convert STITest to Response
     */
    private STITestResponse convertToResponse(STITest stiTest) {
        STITestResponse response = new STITestResponse();
        response.setTestId(stiTest.getTestId());
        response.setCustomerId(stiTest.getCustomer().getId());
        response.setCustomerName(stiTest.getCustomer().getFullName());
        response.setCustomerEmail(stiTest.getCustomer().getEmail());
        response.setCustomerPhone(stiTest.getCustomer().getPhone());

        response.setServiceId(stiTest.getStiService().getServiceId());
        response.setServiceName(stiTest.getStiService().getName());
        response.setServiceDescription(stiTest.getStiService().getDescription());
        response.setTotalPrice(stiTest.getTotalPrice());

        if (stiTest.getStaff() != null) {
            response.setStaffId(stiTest.getStaff().getId());
            response.setStaffName(stiTest.getStaff().getFullName());
        }

        response.setAppointmentDate(stiTest.getAppointmentDate());

        // Convert enum to String
        response.setPaymentMethod(stiTest.getPaymentMethod().name());
        response.setStatus(stiTest.getStatus().name());

        response.setPaymentDate(stiTest.getPaymentDate());
        response.setStripePaymentId(stiTest.getStripePaymentId());
        response.setCustomerNotes(stiTest.getCustomerNotes());
        response.setConsultantNotes(stiTest.getConsultantNotes());
        response.setCreatedAt(stiTest.getCreatedAt());
        response.setUpdatedAt(stiTest.getUpdatedAt());

        return response;
    }

    private TestResultResponse convertToTestResultResponse(TestResult result) {
        TestResultResponse response = new TestResultResponse();
        response.setResultId(result.getResultId());
        response.setTestId(result.getStiTest().getTestId());
        response.setComponentId(result.getTestComponent().getComponentId());
        response.setComponentName(result.getTestComponent().getTestName());
        response.setResultValue(result.getResultValue());
        response.setNormalRange(result.getNormalRange());
        response.setUnit(result.getUnit());
        response.setReviewedBy(result.getReviewedBy());
        response.setReviewedAt(result.getReviewedAt());

        // Lookup reviewer name if available
        if (result.getReviewedBy() != null) {
            userRepository.findById(result.getReviewedBy())
                    .ifPresent(user -> response.setReviewerName(user.getFullName()));
        }

        return response;
    }
}