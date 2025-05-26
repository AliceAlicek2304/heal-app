package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.AvailableTimeSlot;
import com.healapp.dto.ConsultationRequest;
import com.healapp.dto.ConsultationResponse;
import com.healapp.model.Consultation;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.ConsultationStatus;
import com.healapp.model.PaymentMethod;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.ConsultationRepository;
import com.healapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ConsultationService {

    private static final Logger log = LoggerFactory.getLogger(ConsultationService.class);

    @Autowired
    private ConsultationRepository consultationRepository;

    @Autowired
    private ConsultantProfileRepository consultantProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private StripeService stripeService;

    @Autowired
    private AppConfigService appConfigService;

    @Value("${app.consultation.hourly-rate:150000.0}")
    private Float defaultHourlyRate;

    private static final List<String> TIME_SLOTS = Arrays.asList("8-10", "10-12", "13-15", "15-17");

    private Float getHourlyRate() {
        try {
            ApiResponse<Double> response = appConfigService.getCurrentConsultationPrice();
            if (response.isSuccess() && response.getData() != null) {
                return response.getData().floatValue();
            }
        } catch (Exception e) {
            log.error("Error getting hourly rate from config, using default: {}", e.getMessage());
        }

        // Fallback to default
        log.info("Using default hourly rate: {}", defaultHourlyRate);
        return defaultHourlyRate;
    }

    public ApiResponse<List<AvailableTimeSlot>> getAvailableTimeSlots(Long consultantId, LocalDate date) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(consultantId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("Consultant not found");
            }

            UserDtls user = userOpt.get();
            if (!user.getRole().equals("CONSULTANT")) {
                return ApiResponse.error("Selected user is not a consultant");
            }

            // Ngày bắt đầu và kết thúc tìm kiếm
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(23, 59, 59);

            // lấy lịch consultant trong ngày
            List<Consultation> existingConsultations = consultationRepository.findByConsultantAndTimeRange(consultantId,
                    startOfDay, endOfDay);

            // danh sách time slot
            List<AvailableTimeSlot> availableTimeSlots = new ArrayList<>();
            for (String slot : TIME_SLOTS) {
                String[] hours = slot.split("-");
                LocalTime slotStartTime = LocalTime.of(Integer.parseInt(hours[0]), 0);
                LocalTime slotEndTime = LocalTime.of(Integer.parseInt(hours[1]), 0);

                LocalDateTime slotStart = date.atTime(slotStartTime);
                LocalDateTime slotEnd = date.atTime(slotEndTime);

                boolean isAvailable = true;
                for (Consultation consultation : existingConsultations) {
                    // lịch != canceled && có time chồng chéo với slot => false
                    if (consultation.getStatus() != ConsultationStatus.CANCELED &&
                            consultation.getStartTime().isBefore(slotEnd) &&
                            consultation.getEndTime().isAfter(slotStart)) {
                        isAvailable = false;
                        break;
                    }
                }

                availableTimeSlots.add(new AvailableTimeSlot(slot, isAvailable));
            }

            return ApiResponse.success("Available time slots retrieved successfully", availableTimeSlots);

        } catch (Exception e) {
            return ApiResponse.error("Failed to get available time slots: " + e.getMessage());
        }
    }

    public ApiResponse<ConsultationResponse> createConsultation(ConsultationRequest request, Long customerId) {
        try {
            Optional<UserDtls> customerOpt = userRepository.findById(customerId);
            if (customerOpt.isEmpty()) {
                return ApiResponse.error("Customer not found");
            }

            Optional<UserDtls> consultantOpt = userRepository.findById(request.getConsultantId());
            if (consultantOpt.isEmpty()) {
                return ApiResponse.error("Consultant not found");
            }

            UserDtls customer = customerOpt.get();
            UserDtls consultant = consultantOpt.get();

            if (!consultant.getRole().equals("CONSULTANT")) {
                return ApiResponse.error("Selected user is not a consultant");
            }

            if (customer.getId().equals(consultant.getId())) {
                return ApiResponse.error("You cannot select yourself as a consultant");
            }

            // Parse time slot lấy giờ bắt đầu và kết thúc
            String[] hours = request.getTimeSlot().split("-");
            LocalTime startTime = LocalTime.of(Integer.parseInt(hours[0]), 0);
            LocalTime endTime = LocalTime.of(Integer.parseInt(hours[1]), 0);

            LocalDateTime consultationStartTime = request.getDate().atTime(startTime);
            LocalDateTime consultationEndTime = request.getDate().atTime(endTime);

            if (!TIME_SLOTS.contains(request.getTimeSlot())) {
                return ApiResponse.error("Invalid time slot");
            }

            // kiểm tra time slot
            List<Consultation> existingConsultations = consultationRepository.findByConsultantAndTimeRange(
                    consultant.getId(),
                    request.getDate().atStartOfDay(),
                    request.getDate().atTime(23, 59, 59));

            for (Consultation consultation : existingConsultations) {
                // lịch != canceled && có time chồng chéo với slot => false
                if (consultation.getStatus() != ConsultationStatus.CANCELED &&
                        consultation.getStartTime().isBefore(consultationEndTime) &&
                        consultation.getEndTime().isAfter(consultationStartTime)) {
                    return ApiResponse.error("The selected time slot is not available");
                }
            } // Tính phí tư vấn dựa trên thời lượng
            int durationHours = Integer.parseInt(hours[1]) - Integer.parseInt(hours[0]);
            Float price = getHourlyRate() * durationHours;

            // Tạo lịch tư vấn
            Consultation consultation = new Consultation();
            consultation.setCustomer(customer);
            consultation.setConsultant(consultant);
            consultation.setStartTime(consultationStartTime);
            consultation.setEndTime(consultationEndTime);
            consultation.setPaymentMethod(request.getPaymentMethod());
            consultation.setPrice(price);

            // Xử lý phương thức thanh toán
            if (request.getPaymentMethod() == PaymentMethod.VISA) {
                consultation.setStatus(ConsultationStatus.PAYMENT_PENDING);
                Consultation savedConsultation = consultationRepository.save(consultation);

                // Xử lý thanh toán qua Stripe
                ApiResponse<String> paymentResponse = stripeService.processPayment(
                        savedConsultation,
                        request.getCardNumber(),
                        request.getExpiryMonth(),
                        request.getExpiryYear(),
                        request.getCvc(),
                        request.getCardHolderName());

                if (paymentResponse.isSuccess()) {
                    // Thanh toán thành công, cập nhật thông tin
                    savedConsultation.setStripePaymentId(paymentResponse.getData());
                    savedConsultation.setPaymentDate(LocalDateTime.now());
                    savedConsultation.setStatus(ConsultationStatus.PENDING);
                    savedConsultation = consultationRepository.save(savedConsultation);

                    ConsultationResponse response = convertToResponse(savedConsultation);
                    return ApiResponse.success("Consultation scheduled and payment processed successfully", response);
                } else {
                    // Thanh toán thất bại
                    savedConsultation.setStatus(ConsultationStatus.PAYMENT_FAILED);
                    consultationRepository.save(savedConsultation);
                    return ApiResponse.error(paymentResponse.getMessage());
                }
            } else {
                // COD
                consultation.setStatus(ConsultationStatus.PENDING);
                consultation.setStripePaymentId(null);
                Consultation savedConsultation = consultationRepository.save(consultation);

                ConsultationResponse response = convertToResponse(savedConsultation);
                return ApiResponse.success("Consultation scheduled successfully", response);
            }
        } catch (Exception e) {
            return ApiResponse.error("Failed to schedule consultation: " + e.getMessage());
        }
    }

    public ApiResponse<ConsultationResponse> updateConsultationStatus(Long consultationId,
            ConsultationStatus newStatus, Long userId) {
        try {
            Optional<Consultation> consultationOpt = consultationRepository.findById(consultationId);
            if (consultationOpt.isEmpty()) {
                return ApiResponse.error("Consultation not found");
            }

            Consultation consultation = consultationOpt.get();

            // Kiểm tra quyền cập nhật
            if (newStatus == ConsultationStatus.CONFIRMED) {
                if (!consultation.getConsultant().getId().equals(userId)) {
                    return ApiResponse.error("Only assigned consultant can confirm the consultation");
                }
                String meetUrl = generateJitsiMeetUrl(consultation.getConsultationId());
                consultation.setMeetUrl(meetUrl);

                try {
                    emailService.sendConsultationConfirmationAsync(consultation);
                } catch (Exception e) {
                    System.err.println("Failed to send email notification: " + e.getMessage());
                    e.printStackTrace();
                }
            } else if (newStatus == ConsultationStatus.CANCELED) {
                // customer or consultant can cancel
                if (!consultation.getCustomer().getId().equals(userId) &&
                        !consultation.getConsultant().getId().equals(userId)) {
                    return ApiResponse.error("You don't have permission to cancel this consultation");
                }

                // Xử lý hoàn tiền nếu đã thanh toán qua VISA
                if (consultation.getPaymentMethod() == PaymentMethod.VISA &&
                        consultation.getStripePaymentId() != null) {

                    ApiResponse<String> refundResponse = stripeService.processRefund(consultation.getStripePaymentId());
                    if (!refundResponse.isSuccess()) {
                        return ApiResponse.error("Failed to process refund: " + refundResponse.getMessage());
                    }

                    // Lưu lại quá trình hoàn tiền
                    consultation.setPaymentDate(LocalDateTime.now());
                }
            } else if (newStatus == ConsultationStatus.COMPLETED) {
                if (!consultation.getConsultant().getId().equals(userId)) {
                    return ApiResponse.error("Only assigned consultant can mark the consultation as completed");
                }

                // check time, cant complete before end time
                if (LocalDateTime.now().isBefore(consultation.getEndTime())) {
                    return ApiResponse.error("Consultation cannot be marked as completed before its end time");
                }
            }

            consultation.setStatus(newStatus);
            Consultation updatedConsultation = consultationRepository.save(consultation);

            // Convert to response
            ConsultationResponse response = convertToResponse(updatedConsultation);

            return ApiResponse.success("Consultation status updated successfully", response);

        } catch (Exception e) {
            return ApiResponse.error("Failed to update consultation status: " + e.getMessage());
        }
    }

    public ApiResponse<List<ConsultationResponse>> getConsultationsByStatus(ConsultationStatus status, Long userId) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            List<Consultation> consultations;

            if (user.getRole().equals("STAFF") || user.getRole().equals("ADMIN")) {
                // Admin và staff xem tất cả
                consultations = consultationRepository.findByStatus(status);
            } else if (user.getRole().equals("CONSULTANT")) {
                // Consultant chỉ xem lịch tư vấn của mình
                consultations = consultationRepository.findByConsultantAndStatus(user, status);
            } else {
                // User thường chỉ xem lịch tư vấn mà họ đặt
                consultations = consultationRepository.findByCustomerAndStatus(user, status);
            }

            List<ConsultationResponse> responses = consultations.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success(
                    String.format("Retrieved %d consultations with status %s", responses.size(), status),
                    responses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve consultations: " + e.getMessage());
        }
    }

    public ApiResponse<List<ConsultationResponse>> getConsultationsForUser(Long userId) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            List<Consultation> consultations = consultationRepository.findByUserInvolved(userId);

            // Convert to response
            List<ConsultationResponse> responseList = consultations.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Consultations retrieved successfully", responseList);

        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve consultations: " + e.getMessage());
        }
    }

    private String generateJitsiMeetUrl(Long consultationId) {
        // Tạo UUID để đảm bảo tính duy nhất và bảo mật
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        return "https://meet.jit.si/Heal_Consultation_" + consultationId + "_" + uniqueId;
    }

    public ApiResponse<List<UserDtls>> getAllConsultantMembers() {
        try {
            List<UserDtls> consultantMembers = userRepository.findByRole("CONSULTANT");
            return ApiResponse.success("Consultant members retrieved successfully", consultantMembers);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve consultant members: " + e.getMessage());
        }
    }

    public ApiResponse<List<ConsultationResponse>> getConsultationsForConsultant(Long consultantId) {
        try {
            // Kiểm tra xem người dùng có vai trò CONSULTANT không
            Optional<UserDtls> consultantOpt = userRepository.findById(consultantId);
            if (consultantOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls consultant = consultantOpt.get();
            if (!consultant.getRole().equals("CONSULTANT")) {
                return ApiResponse.error("User is not a consultant");
            }

            // Lấy danh sách consultation của consultant
            List<Consultation> consultations = consultationRepository.findByConsultant(consultant);

            List<ConsultationResponse> consultationResponses = consultations.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Consultations retrieved successfully", consultationResponses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve consultations: " + e.getMessage());
        }
    }

    private ConsultationResponse convertToResponse(Consultation consultation) {
        ConsultationResponse response = new ConsultationResponse();
        response.setConsultationId(consultation.getConsultationId());
        response.setCustomerId(consultation.getCustomer().getId());
        response.setCustomerName(consultation.getCustomer().getFullName());
        response.setConsultantId(consultation.getConsultant().getId());
        response.setConsultantName(consultation.getConsultant().getFullName());

        try {
            Optional<ConsultantProfile> profileOpt = consultantProfileRepository
                    .findByUserId(consultation.getConsultant().getId());
            if (profileOpt.isPresent()) {
                ConsultantProfile profile = profileOpt.get();
                response.setConsultantQualifications(profile.getQualifications());
                response.setConsultantExperience(profile.getExperience());
            }
        } catch (Exception e) {
            System.err.println("Failed to retrieve consultant profile: " + e.getMessage());
            e.printStackTrace();
        }

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