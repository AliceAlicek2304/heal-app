package com.healapp.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.MenstrualCycleRequest;
import com.healapp.dto.MenstrualCycleResponse;
import com.healapp.dto.ReminderRequest;
import com.healapp.model.MenstrualCycle;
import com.healapp.model.UserDtls;
import com.healapp.repository.MenstrualCycleRepository;
import com.healapp.repository.UserRepository;

@Service
public class MenstrualCycleService {

    @Autowired
    private MenstrualCycleRepository menstrualCycleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PregnancyProbLogService pregnancyProbLogService;

    // lưu thong tin chu ky kinh nguyet
    public MenstrualCycle saveMenstrualCycle(MenstrualCycle menstrualCycle) {
        return menstrualCycleRepository.save(menstrualCycle);
    }

    // tinh ngay rung trung
    public LocalDate calculateOvulationDate(MenstrualCycle menstrualCycle) {
        LocalDate ovulationDate = menstrualCycle.getStartDate().plusDays(menstrualCycle.getCycleLength() - 14);
        return ovulationDate;
    }

    // tinh ti le co thai
    public double calculateProb(MenstrualCycle menstrualCycle) {
        LocalDate today = LocalDate.now();
        long daysSinceOvulation = today.toEpochDay() - menstrualCycle.getOvulationDate().toEpochDay();
        double tiLe = 0.0; // ti le thu thai

        if (daysSinceOvulation == -5) {
            tiLe = 6.4; // truoc 5 ngay
        } else if (daysSinceOvulation == -4) {
            tiLe = 7.8; // truoc 4 ngay
        } else if (daysSinceOvulation == -3) {
            tiLe = 10.7; // truoc 3 ngay
        } else if (daysSinceOvulation == -2) {
            tiLe = 19.3; // truoc 2 ngay
        } else if (daysSinceOvulation == -1) {
            tiLe = 23.5; // truoc 1 ngay
        } else if (daysSinceOvulation == 0) {
            tiLe = 15.7; // Ngày rụng trứng
        } else if (daysSinceOvulation == 1) {
            tiLe = 5.7; // sau 1 ngày
        } else {
            tiLe = 1; // Ngày còn lại
        }
        // Cập nhật xác suất mang thai vào cơ sở dữ liệu
        return tiLe;
    }

    // TÍnh số ngày trong chu kỳ kinh nguyệt
    public long dayInMenstrualCycle(MenstrualCycle menstrualCycle) {
        LocalDate today = LocalDate.now();
        long daysSinceOvulation = today.toEpochDay() - menstrualCycle.getOvulationDate().toEpochDay();
        return daysSinceOvulation;
    }

    // tính số ngày đến chu kỳ kinh nguyệt tiếp theo
    public long dayNextMenstrualCycle(MenstrualCycle menstrualCycle) {
        LocalDate today = LocalDate.now();
        long daysUntilNextCycle = menstrualCycle.getStartDate().plusDays(menstrualCycle.getCycleLength()).toEpochDay()
                - today.toEpochDay();
        return daysUntilNextCycle;
    }

    // Thêm chu kỳ kinh nguyệt mới
    public ApiResponse<MenstrualCycleResponse> addCycle(MenstrualCycleRequest request, Long userId) {
        try {
            // Validate input
            LocalDate startDate = request.getStartDate();
            if (startDate.isAfter(LocalDate.now())) {
                return ApiResponse.error("Start date cannot be in the future");
            }
            if (request.getNumberOfDays() <= 0 || request.getCycleLength() <= 0) {
                return ApiResponse.error("Number of days and cycle length must be positive");
            }

            // Create new cycle
            MenstrualCycle menstrualCycle = new MenstrualCycle();
            menstrualCycle.setStartDate(startDate);
            menstrualCycle.setNumberOfDays(request.getNumberOfDays());
            menstrualCycle.setCycleLength(request.getCycleLength());
            menstrualCycle.setReminderEnabled(false);

            // Set user
            UserDtls user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            menstrualCycle.setUser(user);

            // Calculate dates and probabilities
            LocalDate ovulationDate = calculateOvulationDate(menstrualCycle);
            menstrualCycle.setOvulationDate(ovulationDate);

            // Save to database
            menstrualCycle = menstrualCycleRepository.save(menstrualCycle);

            // Create response
            MenstrualCycleResponse response = new MenstrualCycleResponse();
            response.setId(menstrualCycle.getId());
            response.setUserId(user.getId());
            response.setStartDate(request.getStartDate());
            response.setNumberOfDays(request.getNumberOfDays());
            response.setCycleLength(request.getCycleLength());
            response.setOvulationDate(ovulationDate);
            response.setReminderEnabled(false);
            response.setCreatedAt(menstrualCycle.getCreatedAt());

            // Lưu log xác suất mang thai
            pregnancyProbLogService.updatePregnancyProbability(menstrualCycle.getId());

            return ApiResponse.success("Menstrual cycle added successfully!", response);

        } catch (Exception e) {
            return ApiResponse.error("Error adding menstrual cycle: " + e.getMessage());
        }
    }

    // Lấy tất cả chu kỳ kinh nguyệt của người dùng
    public ApiResponse<List<MenstrualCycleResponse>> getAllCycleByUserId(Long userId) {
        try {
            UserDtls user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found")); // Lấy tất cả chu kỳ kinh nguyệt của
                                                                                // người dùng
            List<MenstrualCycle> cycles = menstrualCycleRepository.findAllByUserId(userId);
            // Chuyển đổi sang response (có thể là danh sách rỗng)
            List<MenstrualCycleResponse> responseList = cycles.stream()
                    .map(cycle -> {
                        MenstrualCycleResponse response = new MenstrualCycleResponse();
                        response.setId(cycle.getId());
                        response.setUserId(user.getId());
                        response.setStartDate(cycle.getStartDate());
                        response.setNumberOfDays(cycle.getNumberOfDays());
                        response.setCycleLength(cycle.getCycleLength());
                        response.setOvulationDate(cycle.getOvulationDate());
                        response.setReminderEnabled(cycle.isReminderEnabled());
                        response.setCreatedAt(cycle.getCreatedAt());
                        return response;
                    })
                    .collect(Collectors.toList());

            // Luôn trả về success, kể cả khi danh sách rỗng
            return ApiResponse.success("Lấy chu kỳ kinh nguyệt thành công", responseList);
        } catch (Exception e) {
            return ApiResponse.error("Error fetching menstrual cycles: " + e.getMessage());
        }
    }

    public ApiResponse<MenstrualCycleResponse> toggleReminder(Long id, ReminderRequest request, Long userId) {
        try {
            // Tìm chu kỳ kinh nguyệt
            Optional<MenstrualCycle> cycleOpt = menstrualCycleRepository.findById(id);
            if (cycleOpt.isEmpty()) {
                return ApiResponse.error("Menstrual cycle does not exist");
            }

            MenstrualCycle menstrualCycle = cycleOpt.get();

            // Kiểm tra quyền truy cập
            if (!menstrualCycle.getUser().getId().equals(userId)) {
                return ApiResponse.error("You do not have permission to update this menstrual cycle");
            }

            // Cập nhật trạng thái nhắc nhở
            menstrualCycle.setReminderEnabled(request.isReminderEnabled());
            menstrualCycle = menstrualCycleRepository.save(menstrualCycle);

            // Tạo response
            MenstrualCycleResponse response = new MenstrualCycleResponse();
            response.setId(menstrualCycle.getId());
            response.setUserId(menstrualCycle.getUser().getId());
            response.setStartDate(menstrualCycle.getStartDate());
            response.setNumberOfDays(menstrualCycle.getNumberOfDays());
            response.setCycleLength(menstrualCycle.getCycleLength());
            response.setOvulationDate(menstrualCycle.getOvulationDate());
            response.setReminderEnabled(menstrualCycle.isReminderEnabled());
            response.setCreatedAt(menstrualCycle.getCreatedAt());

            String message = request.isReminderEnabled()
                    ? "Ovulation reminder enabled"
                    : "Ovulation reminder turned off";

            return ApiResponse.success(message, response);
        } catch (Exception e) {
            return ApiResponse.error("Error updating reminder: " + e.getMessage());
        }
    }

    // Cập nhật chu kỳ kinh nguyệt
    public ApiResponse<MenstrualCycleResponse> updateCycle(Long id, MenstrualCycleRequest request) {
        try {
            // Validate input
            LocalDate startDate = request.getStartDate();
            if (startDate.isAfter(LocalDate.now())) {
                return ApiResponse.error("Start date cannot be in the future");
            }
            if (request.getNumberOfDays() <= 0 || request.getCycleLength() <= 0) {
                return ApiResponse.error("Number of days and cycle length must be positive");
            }

            // Find existing cycle
            Optional<MenstrualCycle> cycleOpt = menstrualCycleRepository.findById(id);
            if (cycleOpt.isEmpty()) {
                return ApiResponse.error("Menstrual cycle does not exist");
            }

            MenstrualCycle menstrualCycle = cycleOpt.get();

            // Update cycle details
            menstrualCycle.setStartDate(startDate);
            menstrualCycle.setNumberOfDays(request.getNumberOfDays());
            menstrualCycle.setCycleLength(request.getCycleLength());

            // Calculate dates and probabilities
            LocalDate ovulationDate = calculateOvulationDate(menstrualCycle);
            menstrualCycle.setOvulationDate(ovulationDate);

            // Save updated cycle
            menstrualCycle = menstrualCycleRepository.save(menstrualCycle);

            // Tạo MenstrualCycleResponse
            MenstrualCycleResponse response = new MenstrualCycleResponse();
            response.setId(menstrualCycle.getId());
            response.setUserId(menstrualCycle.getUser().getId());
            response.setStartDate(menstrualCycle.getStartDate());
            response.setNumberOfDays(menstrualCycle.getNumberOfDays());
            response.setCycleLength(menstrualCycle.getCycleLength());
            response.setOvulationDate(menstrualCycle.getOvulationDate());
            response.setReminderEnabled(menstrualCycle.isReminderEnabled());

            // Lưu log xác suất mang thai
            pregnancyProbLogService.updatePregnancyProbability(menstrualCycle.getId());

            // Trả về phản hồi thành công
            return ApiResponse.success("Cập nhật chu kỳ kinh nguyệt thành công", response);
        } catch (Exception e) {
            return ApiResponse.error("Error updating menstrual cycle: " + e.getMessage());
        }
    }

    // Xóa chu kỳ kinh nguyệt
    public ApiResponse<String> deleteCycle(Long id) {
        try {
            // Kiểm tra xem chu kỳ kinh nguyệt có tồn tại không
            if (!menstrualCycleRepository.existsById(id)) {
                return ApiResponse.error("Chu kỳ kinh nguyệt không tồn tại");
            }

            // Xóa các bản ghi xác suất mang thai liên quan
            pregnancyProbLogService.deletePregnancyProbLog(id);

            // Xóa chu kỳ kinh nguyệt
            menstrualCycleRepository.deleteById(id);

            // Trả về phản hồi thành công
            return ApiResponse.success("Xóa chu kỳ kinh nguyệt thành công");
        } catch (Exception e) {
            return ApiResponse.error("Error deleting menstrual cycle: " + e.getMessage());
        }
    }

}