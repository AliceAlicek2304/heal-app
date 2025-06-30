package com.healapp.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healapp.dto.ApiResponse;
import com.healapp.service.AIDashboardAnalysisService;

@RestController
@RequestMapping("/admin/ai-dashboard")
public class AIDashboardController {

    @Autowired
    private AIDashboardAnalysisService aiDashboardService;

    /**
     * Tạo phân tích AI cơ bản
     */
    @GetMapping("/analysis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateAIAnalysis() {
        ApiResponse<Map<String, Object>> response = aiDashboardService.generateAIAnalysis();
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Tạo báo cáo chi tiết với AI insights
     */
    @GetMapping("/detailed-report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateDetailedReport() {
        ApiResponse<Map<String, Object>> response = aiDashboardService.generateDetailedReport();
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
} 