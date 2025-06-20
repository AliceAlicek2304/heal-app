package com.healapp.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.STITestRequest;
import com.healapp.dto.STITestResponse;
import com.healapp.dto.STITestStatusUpdateRequest;
import com.healapp.dto.TestResultRequest;
import com.healapp.dto.TestResultResponse;
import com.healapp.exception.PaymentException;
import com.healapp.model.Payment;
import com.healapp.model.PaymentMethod;
import com.healapp.model.PaymentStatus;
import com.healapp.model.STIPackage;
import com.healapp.model.STIService;
import com.healapp.model.STITest;
import com.healapp.model.ServiceTestComponent;
import com.healapp.model.TestResult;
import com.healapp.model.TestStatus;
import com.healapp.model.UserDtls;
import com.healapp.repository.STIPackageRepository;
import com.healapp.repository.STIServiceRepository;
import com.healapp.repository.STITestRepository;
import com.healapp.repository.ServiceTestComponentRepository;
import com.healapp.repository.TestResultRepository;
import com.healapp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class STITestService {

    @Autowired
    private STITestRepository stiTestRepository;

    @Autowired
    private STIServiceRepository stiServiceRepository;

    @Autowired
    private STIPackageRepository stiPackageRepository;

    @Autowired
    private ServiceTestComponentRepository testComponentRepository;

    @Autowired
    private TestResultRepository testResultRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StripeService stripeService;

    @Autowired
    private PaymentService paymentService;

    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<STITestResponse> bookTest(STITestRequest request, Long customerId) {
        log.info("User {} booking STI test", customerId);

        // Validate request
        if (!request.isValid()) {
            return ApiResponse.error("Must specify either serviceId or packageId, not both");
        }

        Optional<UserDtls> customerOpt = userRepository.findById(customerId);
        if (customerOpt.isEmpty()) {
            return ApiResponse.error("Customer not found");
        }
        UserDtls customer = customerOpt.get();

        if (request.getAppointmentDate().isBefore(LocalDateTime.now().plusHours(2))) {
            return ApiResponse.error("Appointment must be at least 2 hours from now");
        }

        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("Invalid payment method: " + request.getPaymentMethod());
        }

        STITest stiTest;
        BigDecimal totalPrice;

        if (request.isServiceBooking()) {
            // Service booking
            log.info("Booking service ID: {}", request.getServiceId());
            Optional<STIService> serviceOpt = stiServiceRepository.findById(request.getServiceId());
            if (serviceOpt.isEmpty()) {
                return ApiResponse.error("STI service not found");
            }
            STIService stiService = serviceOpt.get();

            if (!stiService.getIsActive()) {
                return ApiResponse.error("STI service is not available");
            }

            totalPrice = BigDecimal.valueOf(stiService.getPrice());
            stiTest = STITest.builder()
                    .customer(customer)
                    .stiService(stiService)
                    .appointmentDate(request.getAppointmentDate())
                    .customerNotes(request.getCustomerNotes())
                    .totalPrice(totalPrice)
                    .status(TestStatus.PENDING)
                    .build();

        } else {
            // Package booking
            log.info("Booking package ID: {}", request.getPackageId());
            Optional<STIPackage> packageOpt = stiPackageRepository
                    .findByIdWithServicesAndComponents(request.getPackageId());
            if (packageOpt.isEmpty()) {
                return ApiResponse.error("STI package not found");
            }
            STIPackage stiPackage = packageOpt.get();

            if (!stiPackage.getIsActive()) {
                return ApiResponse.error("STI package is not available");
            }

            totalPrice = stiPackage.getPackagePrice();
            stiTest = STITest.builder()
                    .customer(customer)
                    .stiPackage(stiPackage)
                    .appointmentDate(request.getAppointmentDate())
                    .customerNotes(request.getCustomerNotes())
                    .totalPrice(totalPrice)
                    .status(TestStatus.PENDING)
                    .build();
        }

        STITest savedTest = stiTestRepository.save(stiTest);
        log.info("Created STI Test ID: {} for user: {}", savedTest.getTestId(), customerId);

        // Tạo TestResults
        if (request.isPackageBooking()) {
            createTestResultsForPackage(savedTest);
        } else {
            createTestResultsForService(savedTest);
        }

        ApiResponse<Payment> paymentResult = processPaymentForTest(savedTest, paymentMethod, request);

        if (!paymentResult.isSuccess()) {
            log.warn("Payment failed for user {}: {}", customerId, paymentResult.getMessage());
            throw new PaymentException("Payment failed: " + paymentResult.getMessage());
        }

        Payment payment = paymentResult.getData();
        log.info("Payment successful - Test ID: {}, Payment ID: {}, Status: {}",
                savedTest.getTestId(), payment.getPaymentId(), payment.getPaymentStatus());

        STITestResponse response = convertToResponse(savedTest);

        String message = request.isPackageBooking() ? "STI package test scheduled successfully"
                : "STI test scheduled successfully";
        if (paymentMethod == PaymentMethod.COD) {
            message += " - Payment on delivery";
        } else if (payment.getPaymentStatus() == PaymentStatus.COMPLETED) {
            message += " - Payment processed";
        } else if (paymentMethod == PaymentMethod.QR_CODE && payment.getPaymentStatus() == PaymentStatus.PENDING) {
            message += " - QR code generated, awaiting payment";
        }

        return ApiResponse.success(message, response);
    }

    private ApiResponse<Payment> processPaymentForTest(STITest stiTest, PaymentMethod paymentMethod,
            STITestRequest request) {
        String description;
        if (stiTest.getStiService() != null) {
            description = "STI Test: " + stiTest.getStiService().getName();
        } else if (stiTest.getStiPackage() != null) {
            description = "STI Package: " + stiTest.getStiPackage().getPackageName();
        } else {
            description = "STI Test";
        }

        ApiResponse<Payment> paymentResult;

        try {
            switch (paymentMethod) {
                case COD:
                    paymentResult = paymentService.processCODPayment(
                            stiTest.getCustomer().getId(),
                            "STI",
                            stiTest.getTestId(),
                            stiTest.getTotalPrice(),
                            description);
                    break;

                case VISA:
                    paymentResult = processVisaPaymentWithValidation(stiTest, request);
                    break;

                case QR_CODE:
                    paymentResult = processQRPaymentWithValidation(stiTest, request, description);
                    break;

                default:
                    throw new PaymentException("Unsupported payment method: " + paymentMethod);
            }

            if (!paymentResult.isSuccess()) {
                throw new PaymentException(paymentResult.getMessage());
            }

            return paymentResult;

        } catch (PaymentException e) {
            // Re-throw PaymentException
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error processing payment: {}", e.getMessage(), e);
            throw new PaymentException("Payment processing failed: " + e.getMessage());
        }
    }

    private ApiResponse<Payment> processVisaPaymentWithValidation(STITest stiTest, STITestRequest request) {
        // Validate VISA fields
        if (request.getCardNumber() == null || request.getCardNumber().trim().length() != 16) {
            return ApiResponse.error("Invalid card number - must be 16 digits");
        }

        if (request.getExpiryMonth() == null || request.getExpiryYear() == null) {
            return ApiResponse.error("Card expiry date is required");
        }

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

        if (request.getCvc() == null || request.getCvc().trim().length() < 3) {
            return ApiResponse.error("Invalid CVC - must be 3 or 4 digits");
        }

        if (request.getCardHolderName() == null || request.getCardHolderName().trim().isEmpty()) {
            return ApiResponse.error("Card holder name is required");
        } // Process Stripe payment
        String description;
        if (stiTest.getStiService() != null) {
            description = "STI Test: " + stiTest.getStiService().getName();
        } else if (stiTest.getStiPackage() != null) {
            description = "STI Package: " + stiTest.getStiPackage().getPackageName();
        } else {
            description = "STI Test";
        }

        return paymentService.processStripePayment(
                stiTest.getCustomer().getId(),
                "STI",
                stiTest.getTestId(),
                stiTest.getTotalPrice(),
                description,
                request.getCardNumber().trim(),
                request.getExpiryMonth().trim(),
                request.getExpiryYear().trim(),
                request.getCvc().trim(),
                request.getCardHolderName().trim());
    }

    private ApiResponse<Payment> processQRPaymentWithValidation(STITest stiTest, STITestRequest request,
            String description) {
        log.info("Generating new QR payment for test: {}", stiTest.getTestId());
        return paymentService.generateQRPayment(
                stiTest.getCustomer().getId(),
                "STI",
                stiTest.getTestId(),
                stiTest.getTotalPrice(),
                description);
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

    // ========== CONSULTANT METHODS ==========
    public ApiResponse<List<STITestResponse>> getTestsPendingConsultantNotes() {
        try {
            // Lấy các test có trạng thái SAMPLED, RESULTED, hoặc COMPLETED
            // và chưa có consultantNotes (null hoặc empty)
            List<STITest> tests = stiTestRepository.findTestsPendingConsultantNotes();

            List<STITestResponse> responses = tests.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Retrieved " + responses.size() + " tests pending consultant notes", responses);
        } catch (Exception e) {
            log.error("Error retrieving tests pending consultant notes: {}", e.getMessage(), e);
            return ApiResponse.error("Error retrieving tests: " + e.getMessage());
        }
    }

    public ApiResponse<List<STITestResponse>> getAllConsultantTests() {
        try {
            // Lấy tất cả tests có trạng thái từ SAMPLED trở đi (có thể consultant xem được)
            List<STITest> tests = stiTestRepository.findAllConsultantAccessibleTests();

            List<STITestResponse> responses = tests.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Retrieved " + responses.size() + " consultant accessible tests", responses);
        } catch (Exception e) {
            log.error("Error retrieving consultant tests: {}", e.getMessage(), e);
            return ApiResponse.error("Error retrieving tests: " + e.getMessage());
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

            String userRole = user.getRole() != null ? user.getRole().getRoleName() : null;
            log.info("Current test status: {}, User role: {}", test.getStatus(), userRole);

            if (!validateStatusTransition(test, request.getStatus(), userRole)) {
                return ApiResponse.error("Invalid status transition for your role");
            }

            // CONFIRMED status
            if (request.getStatus() == TestStatus.CONFIRMED
                    && ("STAFF".equals(userRole) || "ADMIN".equals(userRole))) {

                if (!validatePaymentForConfirmation(test)) {
                    return ApiResponse.error("Cannot confirm test - payment not completed or invalid");
                }

                test.setStatus(TestStatus.CONFIRMED);
                test.setStaff(user);
            } // SAMPLED status
            else if (request.getStatus() == TestStatus.SAMPLED
                    && ("STAFF".equals(userRole) || "ADMIN".equals(userRole))) {
                test.setStatus(TestStatus.SAMPLED);
                if (test.getConsultant() == null) {
                    test.setConsultant(user);
                }
            } // RESULTED status
            else if (request.getStatus() == TestStatus.RESULTED
                    && ("STAFF".equals(userRole) || "ADMIN".equals(userRole))) {
                if (request.getResults() == null || request.getResults().isEmpty()) {
                    return ApiResponse.error("Test results are required for RESULTED status");
                }

                if (!validateAndSaveTestResults(test, request.getResults(), userId)) {
                    return ApiResponse.error("Some test results could not be saved. Please check and try again.");
                }

                test.setStatus(TestStatus.RESULTED);
                test.setResultDate(LocalDateTime.now());
            } // COMPLETED status
            else if (request.getStatus() == TestStatus.COMPLETED
                    && ("STAFF".equals(userRole) || "ADMIN".equals(userRole))) {
                test.setStatus(TestStatus.COMPLETED);
            }

            STITest updatedTest = stiTestRepository.save(test);
            STITestResponse response = convertToResponse(updatedTest);

            return ApiResponse.success("STI test status updated to " + request.getStatus(), response);
        } catch (Exception e) {
            log.error("Error updating test status: {}", e.getMessage(), e);
            return ApiResponse.error("Error updating test status: " + e.getMessage());
        }
    }

    private boolean validatePaymentForConfirmation(STITest test) {
        try {
            Optional<Payment> paymentOpt = paymentService.getPaymentByService("STI", test.getTestId());

            if (paymentOpt.isEmpty()) {
                log.warn("No payment found for test ID: {}", test.getTestId());
                return false;
            }

            Payment payment = paymentOpt.get();

            // COD có thể confirm mà không cần payment completed ngay
            if (payment.getPaymentMethod() == PaymentMethod.COD) {
                return true;
            }

            // VISA và QR_CODE cần payment completed
            if (payment.getPaymentStatus() != PaymentStatus.COMPLETED) {
                log.warn("Cannot confirm test {} - payment status: {}",
                        test.getTestId(), payment.getPaymentStatus());
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("Error validating payment for test {}: {}", test.getTestId(), e.getMessage());
            return false;
        }
    }

    private boolean validateAndSaveTestResults(STITest test, List<TestResultRequest> resultRequests, Long userId) {
        List<ServiceTestComponent> serviceComponents;

        // Get components based on whether this is a service or package test
        if (test.getStiService() != null) {
            // Individual service test - chỉ lấy components active
            serviceComponents = test.getStiService().getTestComponents().stream()
                    .filter(component -> component.getStatus())
                    .collect(Collectors.toList());
        } else if (test.getStiPackage() != null) {
            // Package test - get all active components from all services in the package
            serviceComponents = new ArrayList<>();
            for (STIService service : test.getStiPackage().getServices()) {
                List<ServiceTestComponent> activeComponents = service.getTestComponents().stream()
                        .filter(component -> component.getStatus())
                        .collect(Collectors.toList());
                serviceComponents.addAll(activeComponents);
            }
        } else {
            log.error("Test {} has neither service nor package", test.getTestId());
            return false;
        }

        List<Long> activeComponentIds = serviceComponents.stream()
                .map(ServiceTestComponent::getComponentId)
                .collect(Collectors.toList());

        if (resultRequests.size() < activeComponentIds.size()) {
            List<Long> missingComponentIds = new ArrayList<>(activeComponentIds);
            missingComponentIds.removeAll(resultRequests.stream()
                    .map(TestResultRequest::getComponentId)
                    .collect(Collectors.toList()));

            log.warn("Missing results for active components: {} in test ID: {}", missingComponentIds, test.getTestId());
            return false;
        }
        boolean allResultsSaved = true;
        for (TestResultRequest resultReq : resultRequests) {
            try {
                if (!activeComponentIds.contains(resultReq.getComponentId())) {
                    String serviceInfo = test.getStiService() != null ? "service " + test.getStiService().getServiceId()
                            : "package " + test.getStiPackage().getPackageId();
                    log.error("Component ID {} does not belong to active components in {}",
                            resultReq.getComponentId(), serviceInfo);
                    allResultsSaved = false;
                    continue;
                }
                Optional<ServiceTestComponent> componentOpt = testComponentRepository
                        .findById(resultReq.getComponentId());
                if (componentOpt.isEmpty()) {
                    log.error("Component ID {} not found", resultReq.getComponentId());
                    allResultsSaved = false;
                    continue;
                }

                ServiceTestComponent component = componentOpt.get();

                // Tìm existing TestResult cho component này trong test này
                Optional<TestResult> existingResultOpt = testResultRepository
                        .findByStiTest_TestIdAndTestComponent_ComponentId(test.getTestId(), resultReq.getComponentId());

                TestResult testResult;
                if (existingResultOpt.isPresent()) {
                    // UPDATE existing result
                    testResult = existingResultOpt.get();
                    log.info("Updating existing TestResult ID {} for component {} in test {}",
                            testResult.getResultId(), resultReq.getComponentId(), test.getTestId());
                } else {
                    // CREATE new result
                    testResult = new TestResult();
                    testResult.setStiTest(test);
                    testResult.setTestComponent(component);
                    testResult.setCreatedAt(LocalDateTime.now()); // Set sourceService for package tests
                    if (test.getStiPackage() != null) {
                        testResult.setSourceService(component.getStiService());
                    }

                    log.info("Creating new TestResult for component {} in test {}",
                            resultReq.getComponentId(), test.getTestId());
                }

                // Update/Set result values
                testResult.setResultValue(resultReq.getResultValue());
                testResult.setNormalRange(resultReq.getNormalRange());
                testResult.setUnit(resultReq.getUnit());
                testResult.setReviewedBy(userId);
                testResult.setReviewedAt(LocalDateTime.now());

                testResultRepository.save(testResult);
            } catch (Exception e) {
                log.error("Error saving result for component {}: {}",
                        resultReq.getComponentId(), e.getMessage());
                allResultsSaved = false;
            }
        }

        return allResultsSaved;
    }

    private boolean validateStatusTransition(STITest test, TestStatus newStatus, String userRole) {
        TestStatus currentStatus = test.getStatus();

        if ("STAFF".equals(userRole)) {
            if (currentStatus == TestStatus.PENDING && newStatus == TestStatus.CONFIRMED) {
                return true;
            }
            if (currentStatus == TestStatus.CONFIRMED && newStatus == TestStatus.SAMPLED) {
                return true;
            }
            if (currentStatus == TestStatus.SAMPLED && newStatus == TestStatus.RESULTED) {
                return true;
            }
            if (currentStatus == TestStatus.RESULTED && newStatus == TestStatus.COMPLETED) {
                return true;
            }
        } else if ("ADMIN".equals(userRole)) {
            return true;
        } else if ("CUSTOMER".equals(userRole) || "CONSULTANT".equals(userRole)) {
            if (currentStatus == TestStatus.PENDING && newStatus == TestStatus.CANCELED) {
                return true;
            }
        }

        return false;
    }

    public ApiResponse<List<STITestResponse>> getMyTests(Long customerId) {
        try {
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

    public ApiResponse<STITestResponse> getTestDetails(Long testId, Long userId) {
        try {
            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("STI test not found");
            }

            STITest stiTest = testOpt.get();

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
            boolean hasAccess = false;
            if (stiTest.getCustomer().getId().equals(userId)) {
                hasAccess = true;
            } else if (stiTest.getConsultant() != null && stiTest.getConsultant().getId().equals(userId)) {
                hasAccess = true;
            } else {
                Optional<UserDtls> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    String userRole = userOpt.get().getRole() != null ? userOpt.get().getRole().getRoleName() : null;
                    if ("STAFF".equals(userRole) || "ADMIN".equals(userRole) || "CONSULTANT".equals(userRole)) {
                        hasAccess = true;
                    }
                }
            }

            if (!hasAccess) {
                return ApiResponse.error("You don't have permission to view these test results");
            }

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

    @Transactional
    public ApiResponse<STITestResponse> cancelTest(Long testId, Long userId) {
        try {
            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("STI test not found");
            }

            STITest stiTest = testOpt.get();

            if (!stiTest.getCustomer().getId().equals(userId)) {
                return ApiResponse.error("You can only cancel your own tests");
            }

            if (!TestStatus.PENDING.equals(stiTest.getStatus())
                    && !TestStatus.CONFIRMED.equals(stiTest.getStatus())) {
                return ApiResponse.error("Cannot cancel test in current status: " + stiTest.getStatus());
            }

            if (stiTest.getAppointmentDate().isBefore(LocalDateTime.now().plusHours(24))) {
                return ApiResponse.error("Cannot cancel test within 24 hours of appointment");
            }

            String refundMessage = "";
            Optional<Payment> paymentOpt = paymentService.getPaymentByService("STI", testId);

            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();

                // REFUND CHO CẢ VISA VÀ QR_CODE ĐÃ COMPLETED
                if ((payment.getPaymentMethod() == PaymentMethod.VISA
                        || payment.getPaymentMethod() == PaymentMethod.QR_CODE)
                        && payment.getPaymentStatus() == PaymentStatus.COMPLETED) {

                    ApiResponse<Payment> refundResult = paymentService.processRefund(
                            payment.getPaymentId(), "User cancellation");

                    if (!refundResult.isSuccess()) {
                        return ApiResponse.error("Failed to process refund: " + refundResult.getMessage());
                    }

                    // Differentiate refund messages
                    if (payment.getPaymentMethod() == PaymentMethod.VISA) {
                        refundMessage = " - VISA payment refunded automatically";
                        log.info(" VISA refund processed for cancelled test - Test ID: {}, Payment ID: {}",
                                testId, payment.getPaymentId());
                    } else if (payment.getPaymentMethod() == PaymentMethod.QR_CODE) {
                        refundMessage = " - QR Code payment refunded (manual processing required)";
                        log.info(" QR Code refund marked for cancelled test - Test ID: {}, Payment ID: {}, QR Ref: {}",
                                testId, payment.getPaymentId(), payment.getQrPaymentReference());
                    }
                } // COD không cần refund - không có message
                else if (payment.getPaymentMethod() == PaymentMethod.COD) {
                    log.info("📦 COD test cancelled - No refund needed - Test ID: {}", testId);
                } // Payment chưa completed - không refund
                else if (payment.getPaymentStatus() != PaymentStatus.COMPLETED) {
                    log.info("⏳ Payment not completed - No refund needed - Test ID: {}, Status: {}",
                            testId, payment.getPaymentStatus());
                }
            }

            stiTest.setStatus(TestStatus.CANCELED);
            stiTest.setUpdatedAt(LocalDateTime.now());
            STITest canceledTest = stiTestRepository.save(stiTest);

            STITestResponse response = convertToResponse(canceledTest);

            String successMessage = "STI test canceled successfully" + refundMessage;
            return ApiResponse.success(successMessage, response);

        } catch (Exception e) {
            log.error("Error canceling STI test: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to cancel STI test: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<STITestResponse> updateConsultantNotes(Long testId, String consultantNotes, Long consultantId) {
        try {
            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("STI test not found");
            }

            STITest stiTest = testOpt.get();

            Optional<UserDtls> consultantOpt = userRepository.findById(consultantId);
            if (consultantOpt.isEmpty()) {
                return ApiResponse.error("Consultant not found");
            }

            UserDtls consultant = consultantOpt.get();
            String roleName = consultant.getRole() != null ? consultant.getRole().getRoleName() : null;
            if (!"CONSULTANT".equals(roleName)) {
                return ApiResponse.error("User is not a consultant");
            }

            if (stiTest.getStatus() != TestStatus.SAMPLED
                    && stiTest.getStatus() != TestStatus.RESULTED
                    && stiTest.getStatus() != TestStatus.COMPLETED) {
                return ApiResponse.error(
                        "Consultant notes can only be updated for tests in SAMPLED, RESULTED, or COMPLETED status");
            }

            if (stiTest.getConsultant() == null) {
                stiTest.setConsultant(consultant);
            }

            stiTest.setConsultantNotes(consultantNotes);
            stiTest.setUpdatedAt(LocalDateTime.now());

            STITest updatedTest = stiTestRepository.save(stiTest);
            STITestResponse response = convertToResponse(updatedTest);
            return ApiResponse.success("Consultant notes updated successfully", response);
        } catch (Exception e) {
            log.error("Error updating consultant notes for test {}: {}", testId, e.getMessage(), e);
            return ApiResponse.error("Failed to update consultant notes: " + e.getMessage());
        }
    }

    private String generateQRCodeUrl(Payment payment) {
        try {
            // Use VietQR format but with MB Bank info (keep original working format)
            String baseUrl = "https://img.vietqr.io/image";
            String bankId = "970422"; // MB Bank code
            String accountNo = "0349079940"; // MB Bank account
            String accountName = "NGUYEN VAN CUONG"; // MB Bank account name

            String url = String.format("%s/%s-%s-compact.png?amount=%s&addInfo=%s&accountName=%s",
                    baseUrl,
                    bankId,
                    accountNo,
                    payment.getAmount().toString(),
                    java.net.URLEncoder.encode(payment.getQrPaymentReference(),
                            java.nio.charset.StandardCharsets.UTF_8),
                    java.net.URLEncoder.encode(accountName, java.nio.charset.StandardCharsets.UTF_8));

            return url;
        } catch (Exception e) {
            log.error("Error generating QR URL: {}", e.getMessage());
            return null;
        }
    }

    private STITestResponse convertToResponse(STITest stiTest) {
        STITestResponse response = new STITestResponse();

        // Test information
        response.setTestId(stiTest.getTestId());
        response.setCustomerId(stiTest.getCustomer().getId());
        response.setCustomerName(stiTest.getCustomer().getFullName());
        response.setCustomerEmail(stiTest.getCustomer().getEmail());
        response.setCustomerPhone(stiTest.getCustomer().getPhone()); // Service information
        if (stiTest.getStiService() != null) {
            response.setServiceId(stiTest.getStiService().getServiceId());
            response.setPackageId(null);
            response.setServiceName(stiTest.getStiService().getName());
            response.setServiceDescription(stiTest.getStiService().getDescription());
        } else if (stiTest.getStiPackage() != null) {
            response.setServiceId(null);
            response.setPackageId(stiTest.getStiPackage().getPackageId());
            response.setServiceName(stiTest.getStiPackage().getPackageName());
            response.setServiceDescription(stiTest.getStiPackage().getDescription());
        }
        response.setTotalPrice(stiTest.getTotalPrice());

        // Staff information
        if (stiTest.getStaff() != null) {
            response.setStaffId(stiTest.getStaff().getId());
            response.setStaffName(stiTest.getStaff().getFullName());
        }

        // Consultant information
        if (stiTest.getConsultant() != null) {
            response.setConsultantId(stiTest.getConsultant().getId());
            response.setConsultantName(stiTest.getConsultant().getFullName());
        }

        // Appointment information
        response.setAppointmentDate(stiTest.getAppointmentDate());
        response.setStatus(stiTest.getStatus().name());

        // ========== PAYMENT INFORMATION ==========
        try {
            Optional<Payment> latestPaymentOpt = paymentService.getPaymentByService("STI", stiTest.getTestId());
            if (latestPaymentOpt.isPresent()) {
                Payment payment = latestPaymentOpt.get();

                response.setPaymentId(payment.getPaymentId());
                response.setPaymentMethod(payment.getPaymentMethod().name());
                response.setPaymentStatus(payment.getPaymentStatus().name());
                response.setPaidAt(payment.getPaidAt());
                response.setPaymentTransactionId(payment.getTransactionId());

                // Stripe payment specific
                if (payment.getPaymentMethod() == PaymentMethod.VISA) {
                    response.setStripePaymentIntentId(payment.getStripePaymentIntentId());
                }

                // QR payment specific
                if (payment.getPaymentMethod() == PaymentMethod.QR_CODE) {
                    response.setQrPaymentReference(payment.getQrPaymentReference());
                    response.setQrExpiresAt(payment.getExpiresAt());

                    if (payment.getQrPaymentReference() != null) {
                        response.setQrCodeUrl(generateQRCodeUrl(payment));
                    }
                }

            } else {
                response.setPaymentMethod("UNKNOWN");
                response.setPaymentStatus("PENDING");
                log.debug("No payment found for STI test ID: {}", stiTest.getTestId());
            }
        } catch (Exception e) {
            log.error("Error retrieving payment information for test {}: {}", stiTest.getTestId(), e.getMessage());
            response.setPaymentMethod("UNKNOWN");
            response.setPaymentStatus("ERROR");
        }

        // Additional information
        response.setCustomerNotes(stiTest.getCustomerNotes());
        response.setConsultantNotes(stiTest.getConsultantNotes());
        response.setResultDate(stiTest.getResultDate());
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

        if (result.getReviewedBy() != null) {
            userRepository.findById(result.getReviewedBy())
                    .ifPresent(user -> response.setReviewerName(user.getFullName()));
        }

        return response;
    }

    /**
     * Tạo TestResults cho Service booking
     */
    private void createTestResultsForService(STITest stiTest) {
        if (stiTest.getStiService() == null || stiTest.getStiService().getTestComponents() == null) {
            return;
        }

        // Chỉ tạo TestResult cho các components có status = true
        List<ServiceTestComponent> activeComponents = stiTest.getStiService().getTestComponents().stream()
                .filter(component -> component.getStatus())
                .toList();

        for (ServiceTestComponent component : activeComponents) {
            TestResult result = new TestResult();
            result.setStiTest(stiTest);
            result.setTestComponent(component);
            result.setSourceService(stiTest.getStiService()); // Same as parent service
            testResultRepository.save(result);
        }
        log.info("Created {} test results for service booking: {} (from {} active components)",
                activeComponents.size(), stiTest.getTestId(), activeComponents.size());
    }

    /**
     * Tạo TestResults cho Package booking
     */
    private void createTestResultsForPackage(STITest stiTest) {
        if (stiTest.getStiPackage() == null || stiTest.getStiPackage().getServices() == null) {
            return;
        }
        int totalResults = 0;
        for (STIService service : stiTest.getStiPackage().getServices()) {
            if (service.getTestComponents() != null) {
                // Chỉ tạo TestResult cho các components có status = true
                List<ServiceTestComponent> activeComponents = service.getTestComponents().stream()
                        .filter(component -> component.getStatus())
                        .toList();

                for (ServiceTestComponent component : activeComponents) {
                    TestResult result = new TestResult();
                    result.setStiTest(stiTest);
                    result.setTestComponent(component);
                    result.setSourceService(service); // Track which service this component belongs to
                    testResultRepository.save(result);
                    totalResults++;
                }
            }
        }
        log.info("Created {} test results for package booking: {} (only active components)",
                totalResults, stiTest.getTestId());
    }

    /**
     * Lấy TestResults được group theo service (cho package)
     */
    public ApiResponse<List<ServiceTestGroup>> getTestResultsGroupedByService(Long testId, Long userId) {
        try {
            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("Test not found");
            }

            STITest stiTest = testOpt.get();

            // Kiểm tra quyền
            if (!canAccessTest(stiTest, userId)) {
                return ApiResponse.error("Access denied");
            }

            List<TestResult> results = testResultRepository
                    .findByStiTestTestIdOrderBySourceServiceNameAscTestComponentTestNameAsc(testId);

            // Group by source service
            Map<STIService, List<TestResult>> groupedResults = results.stream()
                    .collect(Collectors.groupingBy(TestResult::getSourceService));

            List<ServiceTestGroup> serviceGroups = new ArrayList<>();
            for (Map.Entry<STIService, List<TestResult>> entry : groupedResults.entrySet()) {
                STIService service = entry.getKey();
                List<TestResult> serviceResults = entry.getValue();

                ServiceTestGroup group = new ServiceTestGroup();
                group.setServiceId(service.getServiceId());
                group.setServiceName(service.getName());
                group.setServiceDescription(service.getDescription());

                List<TestResultResponse> resultResponses = serviceResults.stream()
                        .map(this::convertTestResultToResponse)
                        .collect(Collectors.toList());
                group.setTestResults(resultResponses);

                serviceGroups.add(group);
            }

            return ApiResponse.success("Test results retrieved successfully", serviceGroups);

        } catch (Exception e) {
            log.error("Error retrieving grouped test results: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve test results: " + e.getMessage());
        }
    }

    /**
     * DTO class for grouped service results
     */
    public static class ServiceTestGroup {

        private Long serviceId;
        private String serviceName;
        private String serviceDescription;
        private List<TestResultResponse> testResults;

        // Getters and setters
        public Long getServiceId() {
            return serviceId;
        }

        public void setServiceId(Long serviceId) {
            this.serviceId = serviceId;
        }

        public String getServiceName() {
            return serviceName;
        }

        public void setServiceName(String serviceName) {
            this.serviceName = serviceName;
        }

        public String getServiceDescription() {
            return serviceDescription;
        }

        public void setServiceDescription(String serviceDescription) {
            this.serviceDescription = serviceDescription;
        }

        public List<TestResultResponse> getTestResults() {
            return testResults;
        }

        public void setTestResults(List<TestResultResponse> testResults) {
            this.testResults = testResults;
        }
    }

    private TestResultResponse convertTestResultToResponse(TestResult result) {
        TestResultResponse response = new TestResultResponse();
        response.setResultId(result.getResultId());
        response.setTestId(result.getStiTest().getTestId());
        response.setComponentId(result.getTestComponent().getComponentId());
        response.setTestName(result.getTestComponent().getTestName());
        response.setReferenceRange(result.getTestComponent().getReferenceRange());
        response.setResultValue(result.getResultValue());
        response.setNormalRange(result.getNormalRange());
        response.setUnit(result.getUnit());
        response.setReviewedBy(result.getReviewedBy());
        response.setReviewedAt(result.getReviewedAt());
        response.setCreatedAt(result.getCreatedAt());
        response.setUpdatedAt(result.getUpdatedAt());
        return response;
    }

    /**
     * Kiểm tra quyền truy cập test
     */
    private boolean canAccessTest(STITest stiTest, Long userId) {
        // Customer có thể truy cập test của mình
        if (stiTest.getCustomer().getId().equals(userId)) {
            return true;
        }

        // Staff và Admin có thể truy cập tất cả test
        Optional<UserDtls> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            UserDtls user = userOpt.get();
            if (user.getRole() != null) {
                String roleName = user.getRole().getRoleName();
                return "ADMIN".equals(roleName) || "STAFF".equals(roleName);
            }
        }

        return false;
    }

    /**
     * Get all STI tests for admin management
     */
    public ApiResponse<List<STITestResponse>> getAllTestsForAdmin() {
        try {
            log.info("Getting all STI tests for admin");

            List<STITest> tests = stiTestRepository.findAllByOrderByCreatedAtDesc();

            List<STITestResponse> testResponses = tests.stream()
                    .map(this::convertToResponse)
                    .toList();
            log.info("Found {} STI tests", testResponses.size());
            return ApiResponse.success("Tests retrieved successfully", testResponses);

        } catch (Exception e) {
            log.error("Error getting all STI tests: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve STI tests");
        }
    }

    /**
     * Get STI test by ID for admin (no access control)
     */
    public ApiResponse<STITestResponse> getTestByIdForAdmin(Long testId) {
        try {
            log.info("Getting STI test {} for admin", testId);

            Optional<STITest> testOpt = stiTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ApiResponse.error("STI test not found");
            }

            STITest test = testOpt.get();
            STITestResponse response = convertToResponse(test);

            return ApiResponse.success("Test retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error getting STI test {}: {}", testId, e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve STI test");
        }
    }
}
