package com.healapp.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healapp.dto.ApiResponse;
import com.healapp.service.MenstrualCycleAIAnalysisService;
import com.healapp.service.UserService;

@RestController
@RequestMapping("/menstrual-cycle/ai")
public class MenstrualCycleAIController {

    @Autowired
    private MenstrualCycleAIAnalysisService aiAnalysisService;

    @Autowired
    private UserService userService;

    /**
     * Phân tích chu kỳ kinh nguyệt cá nhân bằng AI
     */
    @GetMapping("/personal-analysis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generatePersonalAnalysis() {
        try {
            // Lấy thông tin user đang đăng nhập
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401)
                        .body(ApiResponse.error("User not authenticated"));
            }

            // Lấy userId từ username
            String username = auth.getName();
            Long userId = userService.getUserIdFromUsername(username);
            if (userId == null) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("User not found"));
            }

            // Gọi service để phân tích
            ApiResponse<Map<String, Object>> response = aiAnalysisService.generatePersonalCycleAnalysis(userId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Phân tích sức khỏe chi tiết với khuyến nghị y tế
     */
    @GetMapping("/health-analysis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateHealthAnalysis() {
        try {
            // Lấy thông tin user đang đăng nhập
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401)
                        .body(ApiResponse.error("User not authenticated"));
            }

            // Lấy userId từ username
            String username = auth.getName();
            Long userId = userService.getUserIdFromUsername(username);
            if (userId == null) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("User not found"));
            }

            // Gọi service để phân tích sức khỏe
            ApiResponse<Map<String, Object>> response = aiAnalysisService.generateDetailedHealthAnalysis(userId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Phân tích so sánh với chuẩn y tế
     */
    @GetMapping("/comparative-analysis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateComparativeAnalysis() {
        try {
            // Lấy thông tin user đang đăng nhập
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401)
                        .body(ApiResponse.error("User not authenticated"));
            }

            // Lấy userId từ username
            String username = auth.getName();
            Long userId = userService.getUserIdFromUsername(username);
            if (userId == null) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.error("User not found"));
            }

            // Gọi service để phân tích so sánh
            ApiResponse<Map<String, Object>> response = aiAnalysisService.generateComparativeAnalysis(userId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }
} 