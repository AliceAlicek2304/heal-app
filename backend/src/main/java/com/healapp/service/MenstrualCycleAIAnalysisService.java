package com.healapp.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.healapp.dto.ApiResponse;
import com.healapp.mcp.dto.ChatResponse;
import com.healapp.mcp.service.MCPService;
import com.healapp.model.MenstrualCycle;
import com.healapp.repository.MenstrualCycleRepository;

@Service
public class MenstrualCycleAIAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(MenstrualCycleAIAnalysisService.class);

    @Autowired
    private MCPService mcpService;

    @Autowired
    private MenstrualCycleRepository menstrualCycleRepository;

    @Autowired
    private MenstrualCycleService menstrualCycleService;

    /**
     * Phân tích chu kỳ kinh nguyệt bằng AI cho một người dùng cụ thể
     */
    public ApiResponse<Map<String, Object>> generatePersonalCycleAnalysis(Long userId) {
        try {
            // Lấy tất cả chu kỳ của user
            List<MenstrualCycle> cycles = menstrualCycleRepository.findAllByUserId(userId);
            
            if (cycles.isEmpty()) {
                return ApiResponse.error("Chưa có dữ liệu chu kỳ để phân tích");
            }

            // Sắp xếp theo thời gian
            cycles.sort((a, b) -> a.getStartDate().compareTo(b.getStartDate()));

            // Tạo prompt cho AI phân tích
            String analysisPrompt = createPersonalAnalysisPrompt(cycles);
            
            // Gọi AI để phân tích
            ApiResponse<ChatResponse> aiResponse = mcpService.generateResponse(analysisPrompt);
            
            if (!aiResponse.isSuccess()) {
                return ApiResponse.error("Không thể phân tích dữ liệu: " + aiResponse.getMessage());
            }

            // Xử lý kết quả AI
            Map<String, Object> result = new HashMap<>();
            result.put("totalCycles", cycles.size());
            result.put("firstCycleDate", cycles.get(0).getStartDate());
            result.put("lastCycleDate", cycles.get(cycles.size() - 1).getStartDate());
            result.put("aiAnalysis", aiResponse.getData().getText());
            result.put("generatedAt", LocalDateTime.now());
            
            return ApiResponse.success("Phân tích chu kỳ kinh nguyệt thành công", result);

        } catch (Exception e) {
            logger.error("Error generating personal cycle analysis: {}", e.getMessage(), e);
            return ApiResponse.error("Lỗi phân tích chu kỳ: " + e.getMessage());
        }
    }

    /**
     * Phân tích chi tiết với khuyến nghị y tế
     */
    public ApiResponse<Map<String, Object>> generateDetailedHealthAnalysis(Long userId) {
        try {
            List<MenstrualCycle> cycles = menstrualCycleRepository.findAllByUserId(userId);
            
            if (cycles.size() < 3) {
                return ApiResponse.error("Cần ít nhất 3 chu kỳ để phân tích chi tiết");
            }

            // Phân tích pattern
            MenstrualCycleService.CycleAnalysisResult analysis = menstrualCycleService.analyzeCyclePattern(userId);
            
            // Tạo prompt chi tiết
            String detailedPrompt = createDetailedHealthPrompt(cycles, analysis);
            
            // Gọi AI phân tích
            ApiResponse<ChatResponse> aiResponse = mcpService.generateResponse(detailedPrompt);
            
            if (!aiResponse.isSuccess()) {
                return ApiResponse.error("Không thể tạo phân tích chi tiết: " + aiResponse.getMessage());
            }

            // Tổng hợp kết quả
            Map<String, Object> result = new HashMap<>();
            result.put("cycles", cycles);
            result.put("analysis", analysis);
            result.put("aiHealthAnalysis", aiResponse.getData().getText());
            result.put("generatedAt", LocalDateTime.now());

            return ApiResponse.success("Phân tích sức khỏe chi tiết thành công", result);

        } catch (Exception e) {
            logger.error("Error generating detailed health analysis: {}", e.getMessage(), e);
            return ApiResponse.error("Lỗi phân tích sức khỏe: " + e.getMessage());
        }
    }

    /**
     * Tạo prompt phân tích cá nhân
     */
    private String createPersonalAnalysisPrompt(List<MenstrualCycle> cycles) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Bạn là chuyên gia sản phụ khoa. Hãy phân tích dữ liệu chu kỳ kinh nguyệt sau và đưa ra nhận định, khuyến nghị:\n\n");
        
        prompt.append("=== DỮ LIỆU CHU KỲ KINH NGUYỆT ===\n");
        prompt.append(String.format("- Tổng số chu kỳ: %d\n", cycles.size()));
        prompt.append(String.format("- Thời gian theo dõi: %s đến %s\n", 
                                   cycles.get(0).getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                                   cycles.get(cycles.size() - 1).getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
        
        // Tính toán thống kê
        double avgCycleLength = cycles.stream()
                .mapToLong(MenstrualCycle::getCycleLength)
                .average()
                .orElse(28.0);
        
        double avgPeriodLength = cycles.stream()
                .mapToLong(MenstrualCycle::getNumberOfDays)
                .average()
                .orElse(5.0);
        
        prompt.append(String.format("- Độ dài chu kỳ trung bình: %.1f ngày\n", avgCycleLength));
        prompt.append(String.format("- Số ngày hành kinh trung bình: %.1f ngày\n", avgPeriodLength));
        
        // Phân tích từng chu kỳ
        prompt.append("\n=== CHI TIẾT TỪNG CHU KỲ ===\n");
        for (int i = 0; i < Math.min(cycles.size(), 10); i++) {
            MenstrualCycle cycle = cycles.get(i);
            prompt.append(String.format("Chu kỳ %d: %s - %d ngày hành kinh, chu kỳ %d ngày\n", 
                                      i + 1,
                                      cycle.getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                                      cycle.getNumberOfDays(),
                                      cycle.getCycleLength()));
        }
        
        prompt.append("\n=== YÊU CẦU PHÂN TÍCH ===\n");
        prompt.append("1. **Đánh giá tổng quan** về tính đều đặn của chu kỳ\n");
        prompt.append("2. **Phân tích pattern** và xu hướng\n");
        prompt.append("3. **Đánh giá sức khỏe** dựa trên dữ liệu\n");
        prompt.append("4. **Khuyến nghị** về lối sống và theo dõi\n");
        prompt.append("5. **Cảnh báo** nếu có dấu hiệu bất thường\n");
        prompt.append("6. **Lời khuyên** cho việc theo dõi tiếp theo\n\n");
        
        prompt.append("Trả lời bằng tiếng Việt, sử dụng ngôn ngữ dễ hiểu, thân thiện và chuyên nghiệp.");
        
        return prompt.toString();
    }

    /**
     * Tạo prompt phân tích sức khỏe chi tiết
     */
    private String createDetailedHealthPrompt(List<MenstrualCycle> cycles, 
                                            MenstrualCycleService.CycleAnalysisResult analysis) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Bạn là bác sĩ sản phụ khoa có kinh nghiệm. Hãy phân tích toàn diện dữ liệu chu kỳ kinh nguyệt và đưa ra đánh giá y tế chi tiết:\n\n");
        
        // Thống kê tổng quan
        prompt.append("## 1. THỐNG KÊ TỔNG QUAN\n");
        prompt.append(String.format("- Số chu kỳ theo dõi: %d\n", cycles.size()));
        prompt.append(String.format("- Thời gian theo dõi: %s đến %s\n", 
                                   cycles.get(0).getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                                   cycles.get(cycles.size() - 1).getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
        
        // Phân tích pattern
        if (analysis.isSuccess()) {
            prompt.append("\n## 2. PHÂN TÍCH PATTERN\n");
            prompt.append(String.format("- Độ dài chu kỳ trung bình: %.1f ngày\n", analysis.getAverageCycleLength()));
            prompt.append(String.format("- Độ biến động: ±%.1f ngày\n", analysis.getCycleVariability()));
            prompt.append(String.format("- Tính đều đặn: %s\n", analysis.getRegularity().getDisplayName()));
            prompt.append(String.format("- Độ tin cậy dự đoán: %s\n", analysis.getConfidenceLevel()));
        }
        
        // Phân tích chi tiết từng chu kỳ
        prompt.append("\n## 3. PHÂN TÍCH CHI TIẾT\n");
        for (int i = 0; i < Math.min(cycles.size(), 15); i++) {
            MenstrualCycle cycle = cycles.get(i);
            prompt.append(String.format("Chu kỳ %d (%s): %d ngày hành kinh, chu kỳ %d ngày\n", 
                                      i + 1,
                                      cycle.getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                                      cycle.getNumberOfDays(),
                                      cycle.getCycleLength()));
        }
        
        prompt.append("\n## 4. YÊU CẦU ĐÁNH GIÁ Y TẾ\n");
        prompt.append("Hãy đưa ra:\n");
        prompt.append("1. **Đánh giá sức khỏe tổng quan** dựa trên pattern chu kỳ\n");
        prompt.append("2. **Phân tích tính đều đặn** và ý nghĩa y tế\n");
        prompt.append("3. **Các dấu hiệu bình thường** trong dữ liệu\n");
        prompt.append("4. **Các dấu hiệu cần lưu ý** (nếu có)\n");
        prompt.append("5. **Khuyến nghị lối sống** phù hợp\n");
        prompt.append("6. **Khi nào cần gặp bác sĩ**\n");
        prompt.append("7. **Lời khuyên theo dõi** tiếp theo\n");
        prompt.append("8. **Các yếu tố ảnh hưởng** đến chu kỳ\n\n");
        
        prompt.append("Trả lời bằng tiếng Việt, sử dụng ngôn ngữ y tế chuyên nghiệp nhưng dễ hiểu. Đưa ra lời khuyên thực tế và hữu ích.");
        
        return prompt.toString();
    }

    /**
     * Phân tích so sánh với chuẩn y tế
     */
    public ApiResponse<Map<String, Object>> generateComparativeAnalysis(Long userId) {
        try {
            List<MenstrualCycle> cycles = menstrualCycleRepository.findAllByUserId(userId);
            
            if (cycles.size() < 2) {
                return ApiResponse.error("Cần ít nhất 2 chu kỳ để so sánh");
            }

            // Tính toán thống kê
            double avgCycleLength = cycles.stream()
                    .mapToLong(MenstrualCycle::getCycleLength)
                    .average()
                    .orElse(28.0);
            
            double avgPeriodLength = cycles.stream()
                    .mapToLong(MenstrualCycle::getNumberOfDays)
                    .average()
                    .orElse(5.0);

            // Tạo prompt so sánh
            String comparativePrompt = createComparativePrompt(cycles, avgCycleLength, avgPeriodLength);
            
            // Gọi AI phân tích
            ApiResponse<ChatResponse> aiResponse = mcpService.generateResponse(comparativePrompt);
            
            if (!aiResponse.isSuccess()) {
                return ApiResponse.error("Không thể tạo phân tích so sánh: " + aiResponse.getMessage());
            }

            // Tổng hợp kết quả
            Map<String, Object> result = new HashMap<>();
            result.put("cycles", cycles);
            result.put("averageCycleLength", avgCycleLength);
            result.put("averagePeriodLength", avgPeriodLength);
            result.put("comparativeAnalysis", aiResponse.getData().getText());
            result.put("generatedAt", LocalDateTime.now());

            return ApiResponse.success("Phân tích so sánh thành công", result);

        } catch (Exception e) {
            logger.error("Error generating comparative analysis: {}", e.getMessage(), e);
            return ApiResponse.error("Lỗi phân tích so sánh: " + e.getMessage());
        }
    }

    /**
     * Tạo prompt so sánh với chuẩn y tế
     */
    private String createComparativePrompt(List<MenstrualCycle> cycles, double avgCycleLength, double avgPeriodLength) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Bạn là chuyên gia sản phụ khoa. Hãy so sánh dữ liệu chu kỳ kinh nguyệt với chuẩn y tế và đưa ra đánh giá:\n\n");
        
        prompt.append("=== DỮ LIỆU NGƯỜI DÙNG ===\n");
        prompt.append(String.format("- Độ dài chu kỳ trung bình: %.1f ngày\n", avgCycleLength));
        prompt.append(String.format("- Số ngày hành kinh trung bình: %.1f ngày\n", avgPeriodLength));
        prompt.append(String.format("- Số chu kỳ theo dõi: %d\n", cycles.size()));
        
        prompt.append("\n=== CHUẨN Y TẾ ===\n");
        prompt.append("- Chu kỳ bình thường: 21-35 ngày\n");
        prompt.append("- Hành kinh bình thường: 2-7 ngày\n");
        prompt.append("- Chu kỳ đều: độ biến động ≤ 3 ngày\n");
        prompt.append("- Chu kỳ hơi không đều: độ biến động 3-5 ngày\n");
        prompt.append("- Chu kỳ không đều: độ biến động > 5 ngày\n");
        
        prompt.append("\n=== YÊU CẦU SO SÁNH ===\n");
        prompt.append("1. **So sánh với chuẩn y tế**\n");
        prompt.append("2. **Đánh giá mức độ bình thường**\n");
        prompt.append("3. **Phân tích các yếu tố ảnh hưởng**\n");
        prompt.append("4. **Khuyến nghị cải thiện** (nếu cần)\n");
        prompt.append("5. **Lời khuyên theo dõi**\n\n");
        
        prompt.append("Trả lời bằng tiếng Việt, đưa ra đánh giá khách quan và lời khuyên thực tế.");
        
        return prompt.toString();
    }
} 