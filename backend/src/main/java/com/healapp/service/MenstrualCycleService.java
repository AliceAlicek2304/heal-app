package com.healapp.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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

    // Tính ngày rụng trứng với logic cải tiến
    public LocalDate calculateOvulationDate(MenstrualCycle menstrualCycle) {
        // Logic cải tiến: Ngày rụng trứng thường xảy ra 14 ngày trước khi bắt đầu chu kỳ tiếp theo
        // Nhưng có thể thay đổi từ 12-16 ngày tùy theo độ dài chu kỳ
        int lutealPhase = calculateLutealPhase(menstrualCycle.getCycleLength());
        LocalDate ovulationDate = menstrualCycle.getStartDate().plusDays(menstrualCycle.getCycleLength() - lutealPhase);
        return ovulationDate;
    }

    // Tính giai đoạn hoàng thể dựa trên độ dài chu kỳ
    private int calculateLutealPhase(long cycleLength) {
        if (cycleLength <= 25) {
            return 12; // Chu kỳ ngắn: giai đoạn hoàng thể 12 ngày
        } else if (cycleLength <= 30) {
            return 14; // Chu kỳ trung bình: giai đoạn hoàng thể 14 ngày
        } else if (cycleLength <= 35) {
            return 15; // Chu kỳ dài: giai đoạn hoàng thể 15 ngày
        } else {
            return 16; // Chu kỳ rất dài: giai đoạn hoàng thể 16 ngày
        }
    }

    // Tính xác suất mang thai với logic cải tiến
    public double calculateProb(MenstrualCycle menstrualCycle) {
        LocalDate today = LocalDate.now();
        long daysSinceOvulation = ChronoUnit.DAYS.between(menstrualCycle.getOvulationDate(), today);
        
        // Logic cải tiến dựa trên nghiên cứu y khoa
        double probability = 0.0;
        
        if (daysSinceOvulation >= -5 && daysSinceOvulation <= 1) {
            // Thời kỳ dễ thụ thai: 5 ngày trước rụng trứng đến 1 ngày sau
            switch ((int) daysSinceOvulation) {
                case -5: probability = 8.0; break;   // 5 ngày trước
                case -4: probability = 12.0; break;  // 4 ngày trước
                case -3: probability = 18.0; break;  // 3 ngày trước
                case -2: probability = 25.0; break;  // 2 ngày trước
                case -1: probability = 30.0; break;  // 1 ngày trước
                case 0:  probability = 28.0; break;  // Ngày rụng trứng
                case 1:  probability = 15.0; break;  // 1 ngày sau
            }
        } else if (daysSinceOvulation >= -7 && daysSinceOvulation <= -6) {
            // Thời kỳ có thể thụ thai nhưng tỷ lệ thấp
            probability = 3.0;
        } else if (daysSinceOvulation >= 2 && daysSinceOvulation <= 3) {
            // Vẫn có thể thụ thai nhưng tỷ lệ rất thấp
            probability = 2.0;
        } else {
            // Thời kỳ khó thụ thai
            probability = 0.5;
        }
        
        return probability;
    }

    // Tính xác suất mang thai cho ngày cụ thể
    public double calculatePregnancyProbabilityForDate(MenstrualCycle menstrualCycle, LocalDate targetDate) {
        long daysSinceOvulation = ChronoUnit.DAYS.between(menstrualCycle.getOvulationDate(), targetDate);
        
        double probability = 0.0;
        
        if (daysSinceOvulation >= -5 && daysSinceOvulation <= 1) {
            switch ((int) daysSinceOvulation) {
                case -5: probability = 8.0; break;
                case -4: probability = 12.0; break;
                case -3: probability = 18.0; break;
                case -2: probability = 25.0; break;
                case -1: probability = 30.0; break;
                case 0:  probability = 28.0; break;
                case 1:  probability = 15.0; break;
            }
        } else if (daysSinceOvulation >= -7 && daysSinceOvulation <= -6) {
            probability = 3.0;
        } else if (daysSinceOvulation >= 2 && daysSinceOvulation <= 3) {
            probability = 2.0;
        } else {
            probability = 0.5;
        }
        
        return probability;
    }

    // Tính thời kỳ dễ thụ thai
    public LocalDate[] calculateFertileWindow(MenstrualCycle menstrualCycle) {
        LocalDate ovulationDate = menstrualCycle.getOvulationDate();
        LocalDate fertileStart = ovulationDate.minusDays(5); // 5 ngày trước rụng trứng
        LocalDate fertileEnd = ovulationDate.plusDays(1);    // 1 ngày sau rụng trứng
        return new LocalDate[]{fertileStart, fertileEnd};
    }

    // Kiểm tra xem có đang trong thời kỳ dễ thụ thai không
    public boolean isInFertilePeriod(LocalDate ovulationDate) {
        LocalDate today = LocalDate.now();
        long daysSinceOvulation = ChronoUnit.DAYS.between(ovulationDate, today);
        return daysSinceOvulation >= -5 && daysSinceOvulation <= 1;
    }

    // Tính ngày bắt đầu chu kỳ tiếp theo
    public LocalDate calculateNextCycleDate(MenstrualCycle menstrualCycle) {
        return menstrualCycle.getStartDate().plusDays(menstrualCycle.getCycleLength());
    }

    // Tính ngày kết thúc chu kỳ hiện tại
    public LocalDate calculateEndDate(MenstrualCycle menstrualCycle) {
        return menstrualCycle.getStartDate().plusDays(menstrualCycle.getNumberOfDays() - 1);
    }

    // Tính số ngày trong chu kỳ kinh nguyệt (cải tiến)
    public long dayInMenstrualCycle(MenstrualCycle menstrualCycle) {
        LocalDate today = LocalDate.now();
        long daysSinceOvulation = ChronoUnit.DAYS.between(menstrualCycle.getOvulationDate(), today);
        return daysSinceOvulation;
    }

    // Tính số ngày đến chu kỳ kinh nguyệt tiếp theo (cải tiến)
    public long dayNextMenstrualCycle(MenstrualCycle menstrualCycle) {
        LocalDate today = LocalDate.now();
        LocalDate nextCycleDate = calculateNextCycleDate(menstrualCycle);
        long daysUntilNextCycle = ChronoUnit.DAYS.between(today, nextCycleDate);
        return Math.max(0, daysUntilNextCycle);
    }

    // Phân tích chu kỳ dựa trên lịch sử
    public CycleAnalysisResult analyzeCyclePattern(Long userId) {
        List<MenstrualCycle> cycles = menstrualCycleRepository.findAllByUserId(userId);
        
        if (cycles.size() < 2) {
            return new CycleAnalysisResult(false, "Cần ít nhất 2 chu kỳ để phân tích", null, null, null, null, 0.0);
        }

        // Sắp xếp theo ngày bắt đầu
        cycles.sort((a, b) -> a.getStartDate().compareTo(b.getStartDate()));

        // Tính độ dài chu kỳ trung bình
        double avgCycleLength = cycles.stream()
                .mapToLong(MenstrualCycle::getCycleLength)
                .average()
                .orElse(28.0);

        // Tính độ dài chu kỳ thay đổi
        double cycleVariability = calculateCycleVariability(cycles);

        // Dự đoán chu kỳ tiếp theo
        LocalDate lastCycleStart = cycles.get(cycles.size() - 1).getStartDate();
        LocalDate predictedNextCycle = lastCycleStart.plusDays((long) avgCycleLength);

        // Độ tin cậy dự đoán
        String confidenceLevel = calculateConfidenceLevel(cycles.size(), cycleVariability);

        // Phân tích tính đều đặn của chu kỳ
        CycleRegularity regularity = analyzeCycleRegularity(cycles, avgCycleLength, cycleVariability);

        return new CycleAnalysisResult(true, "Phân tích thành công", 
                avgCycleLength, predictedNextCycle, confidenceLevel, regularity, cycleVariability);
    }

    // Tính độ thay đổi chu kỳ
    private double calculateCycleVariability(List<MenstrualCycle> cycles) {
        if (cycles.size() < 2) return 0.0;

        double avgCycleLength = cycles.stream()
                .mapToLong(MenstrualCycle::getCycleLength)
                .average()
                .orElse(28.0);

        double variance = cycles.stream()
                .mapToDouble(cycle -> Math.pow(cycle.getCycleLength() - avgCycleLength, 2))
                .average()
                .orElse(0.0);

        return Math.sqrt(variance);
    }

    // Tính độ tin cậy dự đoán
    private String calculateConfidenceLevel(int cycleCount, double variability) {
        if (cycleCount >= 6 && variability <= 2.0) {
            return "Cao";
        } else if (cycleCount >= 4 && variability <= 3.0) {
            return "Trung bình";
        } else {
            return "Thấp";
        }
    }

    // Phân tích tính đều đặn của chu kỳ
    private CycleRegularity analyzeCycleRegularity(List<MenstrualCycle> cycles, double avgCycleLength, double variability) {
        if (cycles.size() < 3) {
            return CycleRegularity.INSUFFICIENT_DATA; // Không đủ dữ liệu
        }

        // Tính tỷ lệ chu kỳ trong khoảng chấp nhận được (±3 ngày)
        long regularCycles = cycles.stream()
                .mapToLong(MenstrualCycle::getCycleLength)
                .filter(length -> Math.abs(length - avgCycleLength) <= 3)
                .count();

        double regularityPercentage = (double) regularCycles / cycles.size() * 100;

        // Phân loại dựa trên độ biến động và tỷ lệ chu kỳ đều
        if (variability <= 1.0 && regularityPercentage >= 90) {
            return CycleRegularity.VERY_REGULAR;
        } else if (variability <= 3.0 && regularityPercentage >= 70) {
            return CycleRegularity.REGULAR;
        } else if (variability <= 5.0 && regularityPercentage >= 50) {
            return CycleRegularity.SLIGHTLY_IRREGULAR;
        } else if (variability <= 7.0) {
            return CycleRegularity.IRREGULAR;
        } else {
            return CycleRegularity.VERY_IRREGULAR;
        }
    }

    // Enum cho tính đều đặn chu kỳ
    public enum CycleRegularity {
        VERY_REGULAR("Rất đều", "Chu kỳ rất ổn định, độ biến động ≤ 1 ngày"),
        REGULAR("Đều", "Chu kỳ đều đặn, độ biến động 1-3 ngày"),
        SLIGHTLY_IRREGULAR("Hơi không đều", "Chu kỳ hơi không đều, độ biến động 3-5 ngày"),
        IRREGULAR("Không đều", "Chu kỳ không đều, độ biến động 5-7 ngày"),
        VERY_IRREGULAR("Rất không đều", "Chu kỳ rất không đều, độ biến động > 7 ngày"),
        INSUFFICIENT_DATA("Không đủ dữ liệu", "Cần ít nhất 3 chu kỳ để đánh giá");

        private final String displayName;
        private final String description;

        CycleRegularity(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }

    // Class nội bộ để trả về kết quả phân tích
    public static class CycleAnalysisResult {
        private boolean success;
        private String message;
        private Double averageCycleLength;
        private LocalDate predictedNextCycle;
        private String confidenceLevel;
        private CycleRegularity regularity;
        private double cycleVariability;

        public CycleAnalysisResult(boolean success, String message, Double averageCycleLength, 
                                 LocalDate predictedNextCycle, String confidenceLevel, CycleRegularity regularity, double cycleVariability) {
            this.success = success;
            this.message = message;
            this.averageCycleLength = averageCycleLength;
            this.predictedNextCycle = predictedNextCycle;
            this.confidenceLevel = confidenceLevel;
            this.regularity = regularity;
            this.cycleVariability = cycleVariability;
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public Double getAverageCycleLength() { return averageCycleLength; }
        public LocalDate getPredictedNextCycle() { return predictedNextCycle; }
        public String getConfidenceLevel() { return confidenceLevel; }
        public CycleRegularity getRegularity() { return regularity; }
        public double getCycleVariability() { return cycleVariability; }
    }

    // Tính toán chu kỳ kinh nguyệt không lưu vào database
    public ApiResponse<MenstrualCycleResponse> calculateCycle(MenstrualCycleRequest request) {
        try {
            // Validate input
            LocalDate startDate = request.getStartDate();
            if (startDate.isAfter(LocalDate.now())) {
                return ApiResponse.error("Start date cannot be in the future");
            }
            if (request.getNumberOfDays() <= 0 || request.getCycleLength() <= 0) {
                return ApiResponse.error("Number of days and cycle length must be positive");
            }

            // Validate cycle length range
            if (request.getCycleLength() < 21 || request.getCycleLength() > 45) {
                return ApiResponse.error("Cycle length should be between 21 and 45 days");
            }

            // Validate number of days
            if (request.getNumberOfDays() < 2 || request.getNumberOfDays() > 10) {
                return ApiResponse.error("Number of days should be between 2 and 10 days");
            }

            // Create temporary cycle for calculation
            MenstrualCycle tempCycle = new MenstrualCycle();
            tempCycle.setStartDate(startDate);
            tempCycle.setNumberOfDays(request.getNumberOfDays());
            tempCycle.setCycleLength(request.getCycleLength());

            // Calculate dates and probabilities
            LocalDate ovulationDate = calculateOvulationDate(tempCycle);
            tempCycle.setOvulationDate(ovulationDate);

            // Calculate additional information
            LocalDate endDate = calculateEndDate(tempCycle);
            LocalDate nextCycleDate = calculateNextCycleDate(tempCycle);
            LocalDate[] fertileWindow = calculateFertileWindow(tempCycle);
            double currentPregnancyProbability = calculateProb(tempCycle);
            boolean isInFertilePeriod = isInFertilePeriod(ovulationDate);

            // Create response (without saving to database)
            MenstrualCycleResponse response = new MenstrualCycleResponse();
            response.setStartDate(request.getStartDate());
            response.setNumberOfDays(request.getNumberOfDays());
            response.setCycleLength(request.getCycleLength());
            response.setOvulationDate(ovulationDate);
            response.setReminderEnabled(false);
            
            // Set advanced calculation results
            response.setEndDate(endDate);
            response.setNextCycleDate(nextCycleDate);
            response.setFertileStart(fertileWindow[0]);
            response.setFertileEnd(fertileWindow[1]);
            response.setCurrentPregnancyProbability(currentPregnancyProbability);
            response.setInFertilePeriod(isInFertilePeriod);
            
            // Set historical analysis to false for calculation without login
            response.setHasHistoricalData(false);
            response.setTotalCycles(0);

            return ApiResponse.success("Tính toán chu kỳ kinh nguyệt thành công", response);

        } catch (Exception e) {
            return ApiResponse.error("Error calculating menstrual cycle: " + e.getMessage());
        }
    }

    // Tính toán chu kỳ kinh nguyệt với phân tích lịch sử (cho user đã đăng nhập)
    public ApiResponse<MenstrualCycleResponse> calculateCycleWithHistory(MenstrualCycleRequest request, Long userId) {
        try {
            // Validate input
            LocalDate startDate = request.getStartDate();
            if (startDate.isAfter(LocalDate.now())) {
                return ApiResponse.error("Start date cannot be in the future");
            }
            if (request.getNumberOfDays() <= 0 || request.getCycleLength() <= 0) {
                return ApiResponse.error("Number of days and cycle length must be positive");
            }

            // Validate cycle length range
            if (request.getCycleLength() < 21 || request.getCycleLength() > 45) {
                return ApiResponse.error("Cycle length should be between 21 and 45 days");
            }

            // Validate number of days
            if (request.getNumberOfDays() < 2 || request.getNumberOfDays() > 10) {
                return ApiResponse.error("Number of days should be between 2 and 10 days");
            }

            // Create temporary cycle for calculation
            MenstrualCycle tempCycle = new MenstrualCycle();
            tempCycle.setStartDate(startDate);
            tempCycle.setNumberOfDays(request.getNumberOfDays());
            tempCycle.setCycleLength(request.getCycleLength());

            // Calculate dates and probabilities
            LocalDate ovulationDate = calculateOvulationDate(tempCycle);
            tempCycle.setOvulationDate(ovulationDate);

            // Calculate additional information
            LocalDate endDate = calculateEndDate(tempCycle);
            LocalDate nextCycleDate = calculateNextCycleDate(tempCycle);
            LocalDate[] fertileWindow = calculateFertileWindow(tempCycle);
            double currentPregnancyProbability = calculateProb(tempCycle);
            boolean isInFertilePeriod = isInFertilePeriod(ovulationDate);

            // Analyze historical data
            CycleAnalysisResult analysis = analyzeCyclePattern(userId);

            // Create response (without saving to database)
            MenstrualCycleResponse response = new MenstrualCycleResponse();
            response.setStartDate(request.getStartDate());
            response.setNumberOfDays(request.getNumberOfDays());
            response.setCycleLength(request.getCycleLength());
            response.setOvulationDate(ovulationDate);
            response.setReminderEnabled(false);
            
            // Set advanced calculation results
            response.setEndDate(endDate);
            response.setNextCycleDate(nextCycleDate);
            response.setFertileStart(fertileWindow[0]);
            response.setFertileEnd(fertileWindow[1]);
            response.setCurrentPregnancyProbability(currentPregnancyProbability);
            response.setInFertilePeriod(isInFertilePeriod);
            
            // Set historical analysis results
            response.setHasHistoricalData(analysis.isSuccess());
            // Lấy số chu kỳ thực tế của user
            List<MenstrualCycle> cycles = menstrualCycleRepository.findAllByUserId(userId);
            response.setTotalCycles(cycles.size());
            if (analysis.isSuccess()) {
                response.setAverageCycleLength(analysis.getAverageCycleLength());
                response.setPredictedNextCycle(analysis.getPredictedNextCycle());
                response.setConfidenceLevel(analysis.getConfidenceLevel());
                response.setRegularity(analysis.getRegularity());
                response.setCycleVariability(analysis.getCycleVariability());
            }

            return ApiResponse.success("Tính toán chu kỳ kinh nguyệt với phân tích lịch sử thành công", response);

        } catch (Exception e) {
            return ApiResponse.error("Error calculating menstrual cycle with history: " + e.getMessage());
        }
    }

    // Thêm chu kỳ kinh nguyệt mới với phân tích lịch sử
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

            // Validate cycle length range
            if (request.getCycleLength() < 21 || request.getCycleLength() > 45) {
                return ApiResponse.error("Cycle length should be between 21 and 45 days");
            }

            // Validate number of days
            if (request.getNumberOfDays() < 2 || request.getNumberOfDays() > 10) {
                return ApiResponse.error("Number of days should be between 2 and 10 days");
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

            // Calculate additional information
            LocalDate endDate = calculateEndDate(menstrualCycle);
            LocalDate nextCycleDate = calculateNextCycleDate(menstrualCycle);
            LocalDate[] fertileWindow = calculateFertileWindow(menstrualCycle);
            double currentPregnancyProbability = calculateProb(menstrualCycle);
            boolean isInFertilePeriod = isInFertilePeriod(ovulationDate);

            // Analyze historical data
            CycleAnalysisResult analysis = analyzeCyclePattern(userId);

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
            
            // Set advanced calculation results
            response.setEndDate(endDate);
            response.setNextCycleDate(nextCycleDate);
            response.setFertileStart(fertileWindow[0]);
            response.setFertileEnd(fertileWindow[1]);
            response.setCurrentPregnancyProbability(currentPregnancyProbability);
            response.setInFertilePeriod(isInFertilePeriod);
            
            // Set historical analysis results
            response.setHasHistoricalData(analysis.isSuccess());
            // Lấy số chu kỳ thực tế của user
            List<MenstrualCycle> cycles = menstrualCycleRepository.findAllByUserId(userId);
            response.setTotalCycles(cycles.size());
            if (analysis.isSuccess()) {
                response.setAverageCycleLength(analysis.getAverageCycleLength());
                response.setPredictedNextCycle(analysis.getPredictedNextCycle());
                response.setConfidenceLevel(analysis.getConfidenceLevel());
                response.setRegularity(analysis.getRegularity());
                response.setCycleVariability(analysis.getCycleVariability());
            }

            // Lưu log xác suất mang thai
            pregnancyProbLogService.updatePregnancyProbability(menstrualCycle.getId());

            return ApiResponse.success("Menstrual cycle added successfully!", response);

        } catch (Exception e) {
            return ApiResponse.error("Error adding menstrual cycle: " + e.getMessage());
        }
    }

    // Lấy tất cả chu kỳ kinh nguyệt của người dùng với thông tin nâng cao
    public ApiResponse<List<MenstrualCycleResponse>> getAllCycleByUserId(Long userId) {
        try {
            UserDtls user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<MenstrualCycle> cycles = menstrualCycleRepository.findAllByUserId(userId);
            
            // Analyze historical data
            CycleAnalysisResult analysis = analyzeCyclePattern(userId);
            
            // Chuyển đổi sang response với thông tin nâng cao
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
                        
                        // Calculate additional information for each cycle
                        LocalDate endDate = calculateEndDate(cycle);
                        LocalDate nextCycleDate = calculateNextCycleDate(cycle);
                        LocalDate[] fertileWindow = calculateFertileWindow(cycle);
                        double currentPregnancyProbability = calculateProb(cycle);
                        boolean isInFertilePeriod = isInFertilePeriod(cycle.getOvulationDate());
                        
                        response.setEndDate(endDate);
                        response.setNextCycleDate(nextCycleDate);
                        response.setFertileStart(fertileWindow[0]);
                        response.setFertileEnd(fertileWindow[1]);
                        response.setCurrentPregnancyProbability(currentPregnancyProbability);
                        response.setInFertilePeriod(isInFertilePeriod);
                        
                        // Set historical analysis results
                        response.setHasHistoricalData(analysis.isSuccess());
                        response.setTotalCycles(cycles.size());
                        if (analysis.isSuccess()) {
                            response.setAverageCycleLength(analysis.getAverageCycleLength());
                            response.setPredictedNextCycle(analysis.getPredictedNextCycle());
                            response.setConfidenceLevel(analysis.getConfidenceLevel());
                            response.setRegularity(analysis.getRegularity());
                            response.setCycleVariability(analysis.getCycleVariability());
                        }
                        
                        return response;
                    })
                    .collect(Collectors.toList());

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

            // Validate cycle length range
            if (request.getCycleLength() < 21 || request.getCycleLength() > 45) {
                return ApiResponse.error("Cycle length should be between 21 and 45 days");
            }

            // Validate number of days
            if (request.getNumberOfDays() < 2 || request.getNumberOfDays() > 10) {
                return ApiResponse.error("Number of days should be between 2 and 10 days");
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