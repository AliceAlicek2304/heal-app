package com.healapp.service;

import java.time.LocalDateTime;
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

@Service
public class AIDashboardAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(AIDashboardAnalysisService.class);

    @Autowired
    private MCPService mcpService;

    @Autowired
    private AdminStatsService adminStatsService;

    /**
     * Phân tích dữ liệu dashboard bằng AI và tạo báo cáo thông minh
     */
    public ApiResponse<Map<String, Object>> generateAIAnalysis() {
        try {
            // Lấy dữ liệu dashboard
            Map<String, Object> stats = adminStatsService.getOverviewStats();
            
            // Tạo prompt cho AI phân tích
            String analysisPrompt = createAnalysisPrompt(stats);
            
            // Gọi AI để phân tích
            ApiResponse<ChatResponse> aiResponse = mcpService.generateResponse(analysisPrompt);
            
            if (!aiResponse.isSuccess()) {
                return ApiResponse.error("Không thể phân tích dữ liệu: " + aiResponse.getMessage());
            }

            // Xử lý kết quả AI
            Map<String, Object> result = new HashMap<>();
            result.put("stats", stats);
            result.put("aiAnalysis", aiResponse.getData().getText());
            result.put("generatedAt", LocalDateTime.now());
            
            return ApiResponse.success("Phân tích AI thành công", result);

        } catch (Exception e) {
            logger.error("Error generating AI analysis: {}", e.getMessage(), e);
            return ApiResponse.error("Lỗi phân tích AI: " + e.getMessage());
        }
    }

    /**
     * Tạo prompt chi tiết cho AI phân tích
     */
    private String createAnalysisPrompt(Map<String, Object> stats) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Bạn là chuyên gia phân tích dữ liệu kinh doanh. Hãy phân tích các chỉ số sau và đưa ra nhận định, khuyến nghị:\n\n");
        
        prompt.append("=== DỮ LIỆU DASHBOARD HEALAPP ===\n");
        prompt.append(String.format("- Tổng người dùng: %s\n", stats.get("totalUsers")));
        prompt.append(String.format("- Tổng tư vấn viên: %s\n", stats.get("totalConsultants")));
        prompt.append(String.format("- Tổng buổi tư vấn: %s\n", stats.get("totalConsultations")));
        prompt.append(String.format("- Tổng xét nghiệm STI: %s\n", stats.get("totalSTITests")));
        prompt.append(String.format("- Tổng doanh thu: %s VND\n", stats.get("totalRevenue")));
        prompt.append(String.format("- Giá trị đơn hàng TB: %s VND\n", stats.get("averageOrderValue")));
        prompt.append(String.format("- Doanh thu/Người dùng: %s VND\n", stats.get("revenuePerUser")));
        prompt.append(String.format("- Tỷ lệ giữ chân KH: %s%%\n", stats.get("customerRetentionRate")));
        prompt.append(String.format("- Tăng trưởng doanh thu: %s%%\n", stats.get("revenueGrowthRate")));
        prompt.append(String.format("- Tăng trưởng người dùng: %s%%\n", stats.get("userGrowthRate")));
        prompt.append(String.format("- Tăng trưởng đơn hàng: %s%%\n", stats.get("orderGrowthRate")));
        
        prompt.append("\n=== YÊU CẦU PHÂN TÍCH ===\n");
        prompt.append("1. Đánh giá tổng quan tình hình kinh doanh\n");
        prompt.append("2. Phân tích điểm mạnh và điểm yếu\n");
        prompt.append("3. Nhận định xu hướng phát triển\n");
        prompt.append("4. Đưa ra 3-5 khuyến nghị cụ thể để cải thiện\n");
        prompt.append("5. Dự đoán xu hướng trong 3 tháng tới\n\n");
        
        prompt.append("Hãy trả lời bằng tiếng Việt, sử dụng định dạng Markdown với các tiêu đề rõ ràng.");
        
        return prompt.toString();
    }

    /**
     * Tạo báo cáo chi tiết với AI insights
     */
    public ApiResponse<Map<String, Object>> generateDetailedReport() {
        try {
            // Lấy tất cả dữ liệu cần thiết
            Map<String, Object> stats = adminStatsService.getOverviewStats();
            List<Map<String, Object>> topConsultants = adminStatsService.getTopConsultants(10, null, null);
            List<Map<String, Object>> topSTIServices = adminStatsService.getTopSTIServices(10, null, null);
            List<Map<String, Object>> topSTIPackages = adminStatsService.getTopSTIPackages(10, null, null);
            List<Map<String, Object>> revenueDistribution = adminStatsService.getRevenueDistribution();

            // Tạo prompt chi tiết hơn
            String detailedPrompt = createDetailedAnalysisPrompt(stats, topConsultants, topSTIServices, 
                                                                topSTIPackages, revenueDistribution);

            // Gọi AI phân tích
            ApiResponse<ChatResponse> aiResponse = mcpService.generateResponse(detailedPrompt);

            if (!aiResponse.isSuccess()) {
                return ApiResponse.error("Không thể tạo báo cáo chi tiết: " + aiResponse.getMessage());
            }

            // Tổng hợp kết quả
            Map<String, Object> result = new HashMap<>();
            result.put("stats", stats);
            result.put("topConsultants", topConsultants);
            result.put("topSTIServices", topSTIServices);
            result.put("topSTIPackages", topSTIPackages);
            result.put("revenueDistribution", revenueDistribution);
            result.put("aiAnalysis", aiResponse.getData().getText());
            result.put("generatedAt", LocalDateTime.now());

            return ApiResponse.success("Báo cáo chi tiết thành công", result);

        } catch (Exception e) {
            logger.error("Error generating detailed report: {}", e.getMessage(), e);
            return ApiResponse.error("Lỗi tạo báo cáo chi tiết: " + e.getMessage());
        }
    }

    /**
     * Tạo prompt phân tích chi tiết
     */
    private String createDetailedAnalysisPrompt(Map<String, Object> stats, 
                                               List<Map<String, Object>> topConsultants,
                                               List<Map<String, Object>> topSTIServices,
                                               List<Map<String, Object>> topSTIPackages,
                                               List<Map<String, Object>> revenueDistribution) {
        
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Bạn là chuyên gia phân tích kinh doanh cao cấp. Hãy phân tích toàn diện dữ liệu HealApp và tạo báo cáo chi tiết:\n\n");
        
        // Thống kê tổng quan
        prompt.append("## 1. THỐNG KÊ TỔNG QUAN\n");
        prompt.append(String.format("- Tổng người dùng: %s (Tư vấn viên: %s, Khách hàng: %s)\n", 
                                   stats.get("totalUsers"), stats.get("totalConsultants"), 
                                   stats.get("totalPatients")));
        prompt.append(String.format("- Tổng giao dịch: %s (Tư vấn: %s, Xét nghiệm: %s)\n", 
                                   stats.get("totalConsultations"), stats.get("totalConsultations"), 
                                   stats.get("totalSTITests")));
        prompt.append(String.format("- Tổng doanh thu: %s VND\n", stats.get("totalRevenue")));
        
        // Phân tích KPIs
        prompt.append("\n## 2. PHÂN TÍCH CHỈ SỐ KINH DOANH\n");
        prompt.append(String.format("- Giá trị đơn hàng TB: %s VND\n", stats.get("averageOrderValue")));
        prompt.append(String.format("- Doanh thu/Người dùng: %s VND\n", stats.get("revenuePerUser")));
        prompt.append(String.format("- Tỷ lệ giữ chân KH: %s%%\n", stats.get("customerRetentionRate")));
        prompt.append(String.format("- Tăng trưởng doanh thu: %s%%\n", stats.get("revenueGrowthRate")));
        prompt.append(String.format("- Tăng trưởng người dùng: %s%%\n", stats.get("userGrowthRate")));
        
        // Phân tích top performers
        if (topConsultants != null && !topConsultants.isEmpty()) {
            prompt.append("\n## 3. PHÂN TÍCH TOP TƯ VẤN VIÊN\n");
            topConsultants.stream().limit(3).forEach(consultant -> {
                prompt.append(String.format("- %s: %s buổi tư vấn\n", 
                                          consultant.get("fullName"), 
                                          consultant.get("bookingCount")));
            });
        }
        
        if (topSTIServices != null && !topSTIServices.isEmpty()) {
            prompt.append("\n## 4. PHÂN TÍCH TOP DỊCH VỤ STI\n");
            topSTIServices.stream().limit(3).forEach(service -> {
                prompt.append(String.format("- %s: %s lượt\n", 
                                          service.get("name"), 
                                          service.get("bookingCount")));
            });
        }
        
        // Phân tích doanh thu
        if (revenueDistribution != null && !revenueDistribution.isEmpty()) {
            prompt.append("\n## 5. PHÂN BỔ DOANH THU\n");
            revenueDistribution.forEach(item -> {
                prompt.append(String.format("- %s: %s VND\n", 
                                          item.get("name"), 
                                          item.get("revenue")));
            });
        }
        
        prompt.append("\n## 6. YÊU CẦU PHÂN TÍCH\n");
        prompt.append("Hãy đưa ra:\n");
        prompt.append("1. **Đánh giá tổng quan** về tình hình kinh doanh\n");
        prompt.append("2. **Điểm mạnh** của hệ thống hiện tại\n");
        prompt.append("3. **Điểm yếu** cần cải thiện\n");
        prompt.append("4. **Cơ hội** phát triển\n");
        prompt.append("5. **Thách thức** cần vượt qua\n");
        prompt.append("6. **5 khuyến nghị cụ thể** để tăng doanh thu và cải thiện dịch vụ\n");
        prompt.append("7. **Dự đoán xu hướng** trong 3-6 tháng tới\n");
        prompt.append("8. **Chiến lược marketing** phù hợp\n\n");
        
        prompt.append("Trả lời bằng tiếng Việt, sử dụng định dạng Markdown với các tiêu đề rõ ràng và bullet points.");
        
        return prompt.toString();
    }
} 